import mlbstatsapi

mlb = mlbstatsapi.Mlb()

def get_anti_tilt_metrics(player_id):
  """
  Fetches Statcast 'Expected' data to see if a player is getting unlucky.
  Useful for preventing rage drops in early season slumps.
  """
  # Fetch expectedStatistics for 2026 season
  # This uses the 'statType' hydration under the hood
  stats = mlb.get_player_stats(
    player_id,
    stats=['expectedStatistics'],
    groups=['hitting'],
    params={'season': 2026}
  )

  # Safety Check: if no data exists yet (early season), return neutral
  if not stats or 'hitting' not in stats or not stats['hitting'].get('expectedStatistics'):
    return {
      "player_id": player_id,
      "patience_score": 50,
      "luck_delta": 0.0,
      "recommendation": "Insufficient Statcast data for this player."
    }
  
  # x is the Pydantic model returned by the library
  x = stats['hitting']['expectedStatistics'][0]

  # Calculate Luck Delta: xwOBA - wOBA
  # Positive delta = Unlucky (Underperforming expectations)
  # Negative delta = Lucky (Overperforming expectations)
  luck_delta = round(x.xwoba - x.woba, 3)

  # Patience Score (0-100)
  # Scaled so that +0.30 delta (~1 standard deviation of 'bad luck')
  # results in a score around 80
  patience_score = int(min(max(50 + (luck_delta * 100), 0), 100))

  return {
    "player_id": player_id,
    "xwOBA": x.xwoba,
    "wOBA": x.woba,
    "xBA": x.xba,
    "avg": x.avg,
    "luck_delta": luck_delta,
    "patience_score": patience_score,
    "recommendation": "STAY THE COURSE" if patience_score > 60 else "MONITOR"
  }