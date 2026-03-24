import json
import os
import logging
import pandas as pd
from app.engine.projections import fetch_2026_projections

# Logger configuration will be inherited from main.py
logger = logging.getLogger(__name__)

# In-memory cache for settings to avoid recalculation on every call within a single request lifecycle
_settings_cache = None

def get_matchup_settings():
    """
    Dynamically determines strong/weak offenses and aces based on projections.
    Caches the result in memory for the duration of the app's process.
    """
    global _settings_cache
    if _settings_cache:
        return _settings_cache

    # Define hardcoded defaults as a fallback in case projections fail
    defaults = {
        'STRONG_OFFENSES': {'LAD', 'ATL', 'NYY', 'HOU', 'TEX', 'PHI', 'BAL'},
        'WEAK_OFFENSES': {'OAK', 'CWS', 'COL', 'WSH', 'MIA', 'LAA'},
        'ACES': {
            'Gerrit Cole', 'Spencer Strider', 'Zack Wheeler', 'Corbin Burnes', 
            'Tarik Skubal', 'Tyler Glasnow', 'Yoshinobu Yamamoto', 'Logan Webb',
            'Zac Gallen', 'Luis Castillo', 'George Kirby', 'Pablo Lopez', 'Paul Skenes'
        }
    }
    
    try:
        df = fetch_2026_projections()
        if df.empty:
            _settings_cache = defaults
            return _settings_cache

        # --- Calculate ACES ---
        # Filter for starting pitchers with a significant projected workload
        pitchers_df = df[df['position'].str.contains('SP', na=False) & (df['IP'] >= 100)]
        
        # Define Aces as top ~15% in ERA (lower is better) and top ~20% in Strikeouts
        aces = set()
        if not pitchers_df.empty:
            ace_era_threshold = pitchers_df[pitchers_df['ERA'] > 0]['ERA'].quantile(0.15)
            ace_so_threshold = pitchers_df['SO'].quantile(0.80)
            
            aces_df = pitchers_df[
                (pitchers_df['ERA'] > 0) & (pitchers_df['ERA'] <= ace_era_threshold) & 
                (pitchers_df['SO'] >= ace_so_threshold)
            ]
            aces = set(aces_df['name'])

        # --- Calculate OFFENSES ---
        team_offense = df[df['team'] != 'UNK'].groupby('team')['R'].sum().sort_values(ascending=False)
        strong_offenses, weak_offenses = set(), set()
        if not team_offense.empty:
            num_teams = len(team_offense)
            quartile = max(1, num_teams // 4)
            strong_offenses = set(team_offense.head(quartile).index)
            weak_offenses = set(team_offense.tail(quartile).index)

        _settings_cache = {
            'STRONG_OFFENSES': strong_offenses if strong_offenses else defaults['STRONG_OFFENSES'],
            'WEAK_OFFENSES': weak_offenses if weak_offenses else defaults['WEAK_OFFENSES'],
            'ACES': aces if aces else defaults['ACES']
        }
        return _settings_cache

    except Exception as e:
        logger.warning(f"Could not dynamically generate matchup settings: {e}. Falling back to defaults.")
        _settings_cache = defaults
        return defaults

def generate_recommendations(team, last_drafted, roster_settings, players, all_taken_players):
    """
    Analyzes the draft state and generates contextual recommendations.
    """
    recs = []
    drafted_ids = {p['id'] for p in all_taken_players}
    available_players = [p for p in players if p['id'] not in drafted_ids]

    # 1. Initial Draft Advice
    if not team:
        return [
            {"type": "tip", "message": "Welcome to the War Room! Start by drafting an elite 5-category contributor or a top-tier Ace."},
            {"type": "suggestion", "message": f"Top available: {available_players[0]['name'] if available_players else 'N/A'}"}
        ]

    # 2. Analyze Last Pick
    if last_drafted:
        is_pitcher = last_drafted.get('position') in ['SP', 'RP', 'P']
        if is_pitcher:
            recs.append({"type": "success", "message": f"Great addition to the rotation with {last_drafted['name']}."})
        else:
            recs.append({"type": "success", "message": f"Solid bat added: {last_drafted['name']}."})
            if (last_drafted.get('SB', 0)) > 20:
                recs.append({"type": "info", "message": "You've secured speed. You can prioritize power in the next few rounds."})

    # 3. Positional Run Detection
    if len(all_taken_players) > 10:
        RUN_WINDOW = 12
        RUN_THRESHOLD = 5
        recent_picks = all_taken_players[-RUN_WINDOW:]

        position_counts = {}
        for player in recent_picks:
            if player.get('position'):
                positions = player['position'].split(',')
                for pos in positions:
                    group_pos = 'P' if pos in ['SP', 'RP'] else pos
                    position_counts[group_pos] = position_counts.get(group_pos, 0) + 1
        
        for position, count in position_counts.items():
            if count >= RUN_THRESHOLD:
                position_name = 'pitchers' if position == 'P' else f"{position}s"
                recs.append({"type": "alert", "message": f"A run on {position_name} is happening! {count} of the last {RUN_WINDOW} picks have been from this position."})
                break

    # 4. Roster Balance Analysis
    hitters = [p for p in team if p.get('position') not in ['SP', 'RP', 'P']]
    pitchers = [p for p in team if p.get('position') in ['SP', 'RP', 'P']]
    
    if len(team) > 5:
        pitcher_ratio = len(pitchers) / len(team) if len(team) > 0 else 0
        if pitcher_ratio < 0.3:
            recs.append({"type": "warning", "message": "Your pitching staff is thin. Consider targeting an SP soon."})
        elif pitcher_ratio > 0.5:
            recs.append({"type": "warning", "message": "You are heavy on pitching. Focus on filling hitting slots."})

    # 5. Position Scarcity Checks
    has_catcher = any('C' in p.get('position', '') for p in team)
    if not has_catcher and roster_settings.get('C', 0) > 0:
        top_catchers_left = sum(1 for p in available_players if 'C' in p.get('position', ''))
        if top_catchers_left < 5 and len(team) > 8:
            recs.append({"type": "alert", "message": "Catcher pool is drying up! Secure one soon."})

    # 6. Category Needs
    if len(hitters) > 3:
        avg_sb = sum(p.get('SB', 0) for p in hitters) / len(hitters) if len(hitters) > 0 else 0
        if avg_sb < 5:
            recs.append({"type": "suggestion", "message": "Your team lacks speed. Look for a base stealer next."})

    # 7. Best Available Suggestion
    if available_players:
        next_best = available_players[0]
        recs.append({"type": "tip", "message": f"Best value on the board: {next_best['name']} ({next_best['position']})"})

    return recs

def generate_lineup_recommendations(roster, schedule_map, anti_tilt_map):
    """
    Generates Start/Sit recommendations based on daily matchups and Statcast metrics.
    """
    recs = []
    
    # Simple heuristic for opponent strength (could be dynamic in future)
    settings = get_matchup_settings()
    STRONG_OFFENSES = settings['STRONG_OFFENSES']
    WEAK_OFFENSES = settings['WEAK_OFFENSES']
    ACES = settings['ACES']

    for player in roster:
        name = player.get('name')
        team = player.get('team') # editorial_team_abbr
        pid = player.get('player_id')
        position = player.get('display_position')
        if position is None: position = ''
        
        # 1. Get Game Info
        game = schedule_map.get(team)
        if not game:
            continue # No game today or team not found in schedule
            
        opponent = game.get('opponent', 'UNK')
        opp_pitcher = game.get('opp_pitcher', '')
        
        # 2. Get Advanced Metrics (if available)
        metrics = anti_tilt_map.get(int(pid)) if pid else None
        patience_score = metrics['patience_score'] if metrics else 50
        
        rec = None

        # --- PITCHER LOGIC ---
        if any(pos in position for pos in ['SP', 'RP', 'P']):
            # Strong Opponent Warning
            if opponent in STRONG_OFFENSES:
                if patience_score < 60:
                    rec = {"type": "warning", "message": f"SIT: {name} faces a dangerous {opponent} lineup today."}
                else:
                    rec = {"type": "info", "message": f"RISKY START: {name} faces {opponent}, though his underlying metrics are solid."}
            
            # Weak Opponent Opportunity
            elif opponent in WEAK_OFFENSES:
                rec = {"type": "success", "message": f"START: {name} has a favorable matchup vs {opponent}."}
            
            # Luck-based Streaming
            if not rec and metrics and metrics['luck_delta'] > 0.050:
                rec = {"type": "success", "message": f"STREAM: {name} is statistically unlucky and due for regression. Good spot vs {opponent}."}

            # Default for Probable Starters
            if not rec and 'SP' in position:
                rec = {"type": "info", "message": f"START: {name} faces {opponent}."}

        # --- HITTER LOGIC ---
        else:
             # Only recommend Start/Sit for hitters in extreme cases
             if opp_pitcher in ACES:
                 rec = {"type": "warning", "message": f"TOUGH MATCHUP: {name} faces ace {opp_pitcher}. Consider benching if you have depth."}
             elif metrics and metrics['patience_score'] >= 80:
                 rec = {"type": "success", "message": f"MUST START: {name} is crushing the ball (High xStats). A breakout game is imminent."}
             elif opponent in WEAK_OFFENSES and patience_score > 60:
                 rec = {"type": "success", "message": f"Good matchup for {name} vs {opponent}."}
             else:
                 # Default Matchup Info
                 rec = {"type": "info", "message": f"Matchup: {name} vs {opponent} ({opp_pitcher or 'TBD'})."}

        if rec:
            rec['player_id'] = pid
            recs.append(rec)

    return recs