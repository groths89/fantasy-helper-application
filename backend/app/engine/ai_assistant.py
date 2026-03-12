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