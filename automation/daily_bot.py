import requests
import httpx
import asyncio
import os
import pandas as pd
from datetime import datetime
import sys

# Add project root to path to allow importing from backend
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(project_root)

from automation.yahoo_auth import get_valid_token
from backend.app.engine.projections import fetch_2026_projections
from backend.app.logging_service import log_bot_event

# MLB Stats API base URL
MLB_API_BASE = "https://statsapi.mlb.com/api/v1"

# Yahoo Fantasy API base URL
YAHOO_API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2"

def log(message: str, level: str = "INFO", details: dict = None):
    """Helper to print to stdout and write to backend logs."""
    print(message)
    # Strip newlines for the log message purely for cleanliness
    log_bot_event(level, message.strip(), details)

def _parse_yahoo_resource(resource_list):
    """Helper to convert Yahoo's list-of-dicts-with-one-key format."""
    if not isinstance(resource_list, list):
        return resource_list
    data = {}
    for item in resource_list:
        if isinstance(item, dict):
            data.update(item)
    return data

def create_player_id_map() -> dict:
    """
    Creates a mapping from 'FirstName LastName' to MLBAM ID using projection files.
    """
    print("Loading projections to create player ID map...")
    df = fetch_2026_projections()
    if 'name' not in df.columns or 'id' not in df.columns:
        raise ValueError("Projections DataFrame must contain 'name' and 'id' columns.")
    
    player_map = pd.Series(df.id.values, index=df.name).to_dict()
    print(f"Created map for {len(player_map)} players.")
    return player_map

async def get_user_team_and_roster(client: httpx.AsyncClient):
    """Fetches user's MLB team, league, and current roster from Yahoo."""
    print("Fetching user's fantasy team and roster from Yahoo...")
    user_games_url = f"{YAHOO_API_BASE}/users;use_login=1/games;game_codes=mlb;seasons=2026"
    res = await client.get(user_games_url)
    res.raise_for_status()
    
    try:
        game_raw = res.json()['fantasy_content']['users']['0']['user'][1]['games']['0']['game']
        game_key = game_raw[0]['game_key']
    except (KeyError, IndexError):
        raise Exception("Could not find 2026 MLB fantasy game for this user.")

    user_teams_url = f"{YAHOO_API_BASE}/users;use_login=1/games;game_keys={game_key}/teams"
    res = await client.get(user_teams_url)
    res.raise_for_status()
    try:
        team_list_raw = res.json()['fantasy_content']['users']['0']['user'][1]['games']['0']['game'][1]['teams']
        my_team_raw = team_list_raw['0']['team'][0]
        my_team_key = _parse_yahoo_resource(my_team_raw)['team_key']
    except (KeyError, IndexError):
        raise Exception("Could not find user's team for the 2026 MLB game.")

    roster_url = f"{YAHOO_API_BASE}/team/{my_team_key}/roster"
    res = await client.get(roster_url)
    res.raise_for_status()
    roster_raw = res.json()['fantasy_content']['team'][1]['roster']['0']['players']

    roster = []
    for i in range(roster_raw['count']):
        player_list = roster_raw[str(i)]['player']
        player_data = _parse_yahoo_resource(player_list[0])
        position_data = _parse_yahoo_resource(player_list[1])
        
        eligible_positions = []
        if 'eligible_positions' in player_data:
            eps = player_data['eligible_positions']
            if isinstance(eps, list):
                eligible_positions = [ep['position'] for ep in eps]
            elif isinstance(eps, dict):
                eligible_positions = [eps['position']]

        roster.append({
            'name': player_data['name']['full'],
            'player_key': player_data['player_key'],
            'editorial_team_abbr': player_data['editorial_team_abbr'].upper(),
            'selected_position': position_data['selected_position']['position'],
            'eligible_positions': eligible_positions
        })
    
    print(f"Successfully fetched roster for team {my_team_key}.")
    return my_team_key, roster

async def fetch_lineup(session, game_pk):
    """Async helper to fetch a single game's starting lineup."""
    lineup_url = f"{MLB_API_BASE}/game/{game_pk}/boxscore"
    try:
        response = await session.get(lineup_url)
        response.raise_for_status()
        boxscore = response.json()
        
        starting_lineup_ids = set()
        home_pitcher_id = boxscore.get('teams', {}).get('home', {}).get('startingPitcher', {}).get('id')
        away_pitcher_id = boxscore.get('teams', {}).get('away', {}).get('startingPitcher', {}).get('id')
        if home_pitcher_id: starting_lineup_ids.add(home_pitcher_id)
        if away_pitcher_id: starting_lineup_ids.add(away_pitcher_id)

        for team_type in ['home', 'away']:
            players = boxscore.get('teams', {}).get(team_type, {}).get('players', {})
            for player_id_str, player_data in players.items():
                if player_data.get('battingOrder'):
                    starting_lineup_ids.add(int(player_id_str.replace('ID', '')))
        return game_pk, starting_lineup_ids
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
             print(f"Info: Lineup for game {game_pk} not yet available (404).")
        else:
             print(f"Warning: Could not fetch lineup for game {game_pk}: {e}")
        return game_pk, None
    except Exception as e:
        print(f"Warning: An unexpected error occurred fetching lineup for game {game_pk}: {e}")
        return game_pk, None

async def swap_players(client, team_key, benched_player, replacement_player):
    """Performs a roster swap using Yahoo API."""
    url = f"{YAHOO_API_BASE}/team/{team_key}/roster"
    date_str = datetime.now().strftime('%Y-%m-%d')
    xml_data = f"""<?xml version="1.0"?>
    <fantasy_content>
    <roster>
        <coverage_type>date</coverage_type>
        <date>{date_str}</date>
        <players>
        <player>
            <player_key>{benched_player['player_key']}</player_key>
            <position>BN</position>
        </player>
        <player>
            <player_key>{replacement_player['player_key']}</player_key>
            <position>{benched_player['selected_position']}</position>
        </player>
        </players>
    </roster>
    </fantasy_content>
    """
    headers = {"Content-Type": "application/xml"}
    try:
        res = await client.put(url, content=xml_data, headers=headers)
        if res.status_code == 200:
            log(f"Successfully swapped {benched_player['name']} with {replacement_player['name']}.", "SUCCESS", {"benched": benched_player['name'], "replacement": replacement_player['name']})
            return True
        else:
            log(f"Failed to swap players. Status: {res.status_code}", "ERROR", {"response": res.text})
            return False
    except Exception as e:
        log(f"Error performing swap: {e}", "ERROR")
        return False

async def get_todays_games_and_lineups():
    """Fetches today's MLB schedule and starting lineups for each game concurrently."""
    print("Fetching today's MLB schedule and lineups...")
    today = datetime.now().strftime('%Y-%m-%d')
    schedule_url = f"{MLB_API_BASE}/schedule/games/?sportId=1&date={today}"
    
    team_to_game_pk, game_pks = {}, []
    try:
        schedule_res = requests.get(schedule_url)
        schedule_res.raise_for_status()
        schedule = schedule_res.json()
        if schedule.get('totalGames', 0) > 0:
            for game in schedule.get('dates', [{}])[0].get('games', []):
                if game.get('status', {}).get('abstractGameState') in ['Preview', 'Pre-Game']:
                    game_pk = game['gamePk']
                    game_pks.append(game_pk)
                    team_to_game_pk[game['teams']['home']['team']['abbreviation'].upper()] = game_pk
                    team_to_game_pk[game['teams']['away']['team']['abbreviation'].upper()] = game_pk
    except requests.exceptions.RequestException as e:
        print(f"Error fetching MLB schedule: {e}")
        return {}, {}

    if not game_pks:
        print("No upcoming MLB games found for today.")
        return {}, {}

    async with httpx.AsyncClient() as session:
        tasks = [fetch_lineup(session, pk) for pk in game_pks]
        lineup_results = await asyncio.gather(*tasks)
        game_lineups = {pk: lineup for pk, lineup in lineup_results}

    print(f"Found {len(team_to_game_pk)} teams in {len(game_pks)} upcoming games today.")
    return team_to_game_pk, game_lineups

async def check_lineups_and_notify():
    log(f"--- Running Daily Lineup Check: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ---", "INFO")
    
    token = await get_valid_token()
    if not token: return

    try:
        player_id_map = create_player_id_map()
    except Exception as e:
        print(f"Fatal: Could not create player ID map. {e}"); return

    headers = {"Authorization": f"Bearer {token['access_token']}"}
    params = {"format": "json"}
    async with httpx.AsyncClient(headers=headers, params=params) as client:
        try:
            (team_key, roster), (team_to_game_pk, game_lineups) = await asyncio.gather(
                get_user_team_and_roster(client),
                get_todays_games_and_lineups()
            )
        except Exception as e:
            print(f"An unexpected error occurred during data fetching: {e}"); return

    active_roster = [p for p in roster if p['selected_position'] not in ['BN', 'IL', 'NA']]
    print("\n--- Checking Active Roster ---")
    benched_players = []
    for player in active_roster:
        player_name, player_team = player['name'], player['editorial_team_abbr']
        if player_team in team_to_game_pk:
            game_pk = team_to_game_pk[player_team]
            lineup = game_lineups.get(game_pk)
            if lineup is None:
                print(f"-> {player_name} ({player_team}): Game is scheduled, but lineup data is not available yet.")
                continue
            mlb_id = player_id_map.get(player_name)
            if not mlb_id:
                print(f"-> {player_name} ({player_team}): No MLB ID found. Cannot check status.")
                continue
            if mlb_id not in lineup:
                message = f"BENCHED: {player_name} ({player_team}) is NOT in the starting lineup."
                log(f"!! {message}", "WARNING", {"player": player_name, "team": player_team, "game_pk": game_pk})
                benched_players.append(player)
            else:
                print(f"-> {player_name} ({player_team}): Is in the starting lineup.")
        else:
            print(f"-> {player_name} ({player_team}): No game today.")

    if benched_players:
        print("\n--- Summary: Benched Players ---")
        for player in benched_players: print(f"- {player['name']} ({player['selected_position']})")
        
        print("\n--- Attempting Auto-Swaps ---")
        async with httpx.AsyncClient(headers=headers) as write_client:
            for benched in benched_players:
                pos_needed = benched['selected_position']
                
                # Find valid replacements on bench
                candidates = []
                for p in roster:
                    if p['selected_position'] == 'BN' and pos_needed in p['eligible_positions']:
                        # Check if this candidate is starting
                        p_team = p['editorial_team_abbr']
                        if p_team in team_to_game_pk:
                            g_pk = team_to_game_pk[p_team]
                            lineup = game_lineups.get(g_pk)
                            if lineup:
                                p_id = player_id_map.get(p['name'])
                                if p_id and p_id in lineup:
                                    candidates.append(p)
                
                if candidates:
                    replacement = candidates[0]
                    print(f"Found replacement for {benched['name']}: {replacement['name']}")
                    success = await swap_players(write_client, team_key, benched, replacement)
                    if success:
                        benched['selected_position'] = 'BN'
                        replacement['selected_position'] = pos_needed
                else:
                    log(f"No starting replacement found for {benched['name']} at {pos_needed}.", "WARNING", {"player": benched['name']})
    else:
        log("\n--- Summary: All clear! All players with games today are starting. ---", "INFO")
    
    print(f"--- Check Complete: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ---")

if __name__ == '__main__':
    # Ensure you have run `pip install python-dotenv httpx httpx-oauth pandas`
    # And have a valid token.json by running `python automation/initial_auth.py`
    asyncio.run(check_lineups_and_notify())