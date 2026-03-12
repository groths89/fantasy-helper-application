import pandas as pd

class SGPEngine:
  def __init__(self):
    # In a real setup, these 'denominators' are calculated from 
    # your specific league's standings from last year.
    # Example: How many extra HRs does it take to move up 1 point in standings?
    self.denominators = {
              'HR': 7.8,   # 12-team is usually ~9.5
              'SB': 6.1,   # 12-team is usually ~7.2
              'RBI': 18.5, 
              'R': 17.0, 
              'AVG': 0.0014,
              'W': 4.0,
              'SV': 2.0,
              'SO': 15.0,
              'ERA': 0.05, # Special handling needed for rate stats
              'WHIP': 0.02
    }

  def calculate_player_value(self, projections, replacement_level=None):
    """
      Input: Dict of player projected stats
      Output: Total SGP Score
    """
    if replacement_level is None:
      # High replacement level for a shallow 9-team league
      replacement_level = {
          'HR': 22, 'SB': 12, 'RBI': 70, 'R': 75, 'AVG': .265,
          'W': 8, 'SV': 5, 'SO': 100, 'ERA': 4.00, 'WHIP': 1.30
      }
         
    score = 0
    for cat, den in self.denominators.items():
      val = projections.get(cat, 0)
      rep = replacement_level.get(cat, 0)
      
      # For ERA and WHIP, lower is better, so we subtract Player from Replacement
      if cat in ['ERA', 'WHIP']:
          diff = rep - val
      else:
          diff = val - rep
          
      score += diff / den
    return round(score, 2)
  
# Initializer for 2026 draft logic
engine = SGPEngine()