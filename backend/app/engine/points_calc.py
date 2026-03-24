import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SETTINGS_FILE = os.path.join(BASE_DIR, 'data', 'scoring_settings.json')

class PointsEngine:
    def __init__(self):
        self.load_settings()

    def load_settings(self):
        # Default values (Standard Yahoo H2H)
        self.hitter_weights = {
            '1B': 1.0, '2B': 2.0, '3B': 3.0, 'HR': 4.0, 'RBI': 1.0, 'R': 1.0, 'SB': 2.0, 'BB': 1.0, 'HBP': 1.0, 'K': -0.5, 'CYC': 4.0
        }
        self.pitcher_weights = {
            'IP': 1.0, 'W': 3.0, 'L': -3.0, 'SV': 3.0, 'HLD': 2.0, 'ER': -0.5, 'K': 0.25, 'QS': 2.0, 'CG': 3.0, 'SHO': 4.0, 'BSV': -3.0, 'NH': 3.0, 'PG': 4.0
        }

        if os.path.exists(SETTINGS_FILE):
            try:
                with open(SETTINGS_FILE, 'r') as f:
                    data = json.load(f)
                    if 'hitter' in data:
                        self.hitter_weights.update(data['hitter'])
                    if 'pitcher' in data:
                        self.pitcher_weights.update(data['pitcher'])
            except Exception as e:
                print(f"Error loading scoring settings: {e}")

    def calculate_hitter_points(self, proj):
        """Calculates total projected points for a hitter"""
        score = (
            proj.get('1B', 0) * self.hitter_weights.get('1B', 0) + 
            proj.get('2B', 0) * self.hitter_weights.get('2B', 0) + 
            proj.get('3B', 0) * self.hitter_weights.get('3B', 0) + 
            proj.get('HR', 0) * self.hitter_weights.get('HR', 0) +
            proj.get('RBI', 0) * self.hitter_weights.get('RBI', 0) + 
            proj.get('R', 0) * self.hitter_weights.get('R', 0) +
            proj.get('SB', 0) * self.hitter_weights.get('SB', 0) + 
            proj.get('BB', 0) * self.hitter_weights.get('BB', 0) +
            proj.get('HBP', 0) * self.hitter_weights.get('HBP', 0) +
            proj.get('SO', 0) * self.hitter_weights.get('K', 0) + # Map Proj SO to Settings K
            proj.get('CYC', 0) * self.hitter_weights.get('CYC', 0)
        )
        return round(score, 1)

    def calculate_pitcher_points(self, proj):
        """Calculates total projected points for a pitcher"""
        ip = proj.get('IP', 0)
        era = proj.get('ERA', 0)
        # Estimate ER if not explicitly provided in projections
        er = proj.get('ER', (era * ip) / 9.0 if ip > 0 else 0)
        
        score = (
            ip * self.pitcher_weights.get('IP', 0) +
            proj.get('W', 0) * self.pitcher_weights.get('W', 0) +
            proj.get('L', 0) * self.pitcher_weights.get('L', 0) +
            proj.get('SV', 0) * self.pitcher_weights.get('SV', 0) +
            proj.get('HLD', 0) * self.pitcher_weights.get('HLD', 0) +
            er * self.pitcher_weights.get('ER', 0) +
            proj.get('K', 0) * self.pitcher_weights.get('K', 0) +
            proj.get('QS', 0) * self.pitcher_weights.get('QS', 0) +
            proj.get('CG', 0) * self.pitcher_weights.get('CG', 0) +
            proj.get('SHO', 0) * self.pitcher_weights.get('SHO', 0) +
            proj.get('BSV', 0) * self.pitcher_weights.get('BSV', 0) +
            proj.get('NH', 0) * self.pitcher_weights.get('NH', 0) +
            proj.get('PG', 0) * self.pitcher_weights.get('PG', 0) +
            proj.get('H_allowed', 0) * self.pitcher_weights.get('H_allowed', 0) +
            proj.get('BB_allowed', 0) * self.pitcher_weights.get('BB_allowed', 0)
        )
        return round(score, 1)

    def calculate_vorp(self, player_points, position):
        # Replacement levels for a 12-team points league (estimated)
        # These are estimated based on typical player point totals. A positive
        # VORP means a player is better than a typical waiver-wire pickup.
        replacement_levels = {
            'C': 240, 
            '1B': 310, 
            '2B': 285, 
            '3B': 290, 
            'SS': 300, 
            'OF': 280, 
            'SP': 180, 
            'RP': 110
        }
        # Use the player's first listed position to determine replacement level.
        primary_pos = position.split(',')[0]
        base = replacement_levels.get(primary_pos, 260) # Default for UTIL or unexpected positions
        return round(player_points - base, 1)