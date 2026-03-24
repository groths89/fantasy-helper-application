import mlbstatsapi

mlb = mlbstatsapi.Mlb()

def get_anti_tilt_metrics(player_id):
  """
  Fetches Statcast 'Expected' data to see if a player is getting unlucky.
  Compares current performance vs expected performance AND 2025 historical baseline.
  Supports both Hitters (Buy/Sell) and Pitchers (Stream/Fade).
  """
  # 1. Fetch 2026 Expected Data
  # We fetch both groups to determine if the ID belongs to a hitter or pitcher
  stats_26 = mlb.get_player_stats(
    player_id,
    stats=['expectedStatistics'],
    groups=['hitting', 'pitching'],
    params={'season': 2026}
  )

  is_pitcher = False
  curr = None

  # Determine position based on which group has data
  if stats_26.get('pitching') and stats_26['pitching'].get('expectedStatistics'):
      is_pitcher = True
      curr = stats_26['pitching']['expectedStatistics'][0]
  elif stats_26.get('hitting') and stats_26['hitting'].get('expectedStatistics'):
      is_pitcher = False
      curr = stats_26['hitting']['expectedStatistics'][0]

  if not curr:
      return {
          "player_id": player_id,
          "patience_score": 50,
          "luck_delta": 0.0,
          "recommendation": "Insufficient Data"
      }

  # 2. Parse Metrics
  # xwOBA / wOBA are available for both hitters and pitchers in expectedStatistics.
  # For Pitchers, this is "wOBA Allowed".
  current_woba = float(getattr(curr, 'woba', 0))
  current_xwoba = float(getattr(curr, 'xwoba', 0))
  
  # 3. Calculate Luck Delta & Recommendation
  rec = "HOLD"
  patience_score = 50
  luck_delta = 0.0

  if is_pitcher:
      # Pitcher Logic (Lower is better)
      # Unlucky = Actual wOBA (High) - Expected wOBA (Low) > 0
      # If wOBA is .400 but xwOBA is .250, luck_delta is +.150 (Very Unlucky)
      luck_delta = round(current_woba - current_xwoba, 3)

      # Pitcher Patience Score: Scale so +0.050 delta -> ~75 score
      patience_score = int(min(max(50 + (luck_delta * 500), 0), 100))

      if luck_delta > 0.050:
          rec = "STREAM / BUY LOW"
      elif luck_delta < -0.050:
          rec = "FADE / SELL HIGH"
      else:
          rec = "HOLD"
  else:
      # Hitter Logic (Higher is better)
      # Unlucky = Expected wOBA (High) - Actual wOBA (Low) > 0
      luck_delta = round(current_xwoba - current_woba, 3)
      
      if luck_delta > 0.040:
          rec = "BUY LOW / HOLD"
          patience_score = 90 # High score means "Be Patient"
      elif luck_delta < -0.040:
          rec = "SELL HIGH"
          patience_score = 30 # Low score means "Don't trust this"
      else:
          rec = "HOLD"
          patience_score = 50

  # Return Combined Analysis
  return {
    "player_id": player_id,
    "is_pitcher": is_pitcher,
    "xwOBA": current_xwoba,
    "wOBA": current_woba,
    "xBA": getattr(curr, 'xba', 0) if not is_pitcher else 0, 
    "avg": getattr(curr, 'avg', 0) if not is_pitcher else 0,
    "luck_delta": luck_delta,
    "patience_score": patience_score,
    "recommendation": rec
  }