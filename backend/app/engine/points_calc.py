class PointsEngine:
    def __init__(self):
        # Your specific Yahoo league point values
        self.hitter_weights = {
            '1B': 1, '2B': 2, '3B': 3, 'HR': 4,
            'RBI': 1, 'R': 1, 'SB': 2, 'BB': 1, 
            'HBP': 1, 'K': -0.5
        }
        self.pitcher_weights = {
            'IP': 1, 'W': 3, 'L': -3, 'SV': 3, 
            'HLD': 2, 'ER': -0.5, 'K': 0.25, 'QS': 2
        }

    def calculate_hitter_points(self, proj):
        """Calculates total projected points for a hitter"""
        score = (
            proj.get('1B', 0) * 1 + proj.get('2B', 0) * 2 + 
            proj.get('3B', 0) * 3 + proj.get('HR', 0) * 4 +
            proj.get('RBI', 0) * 1 + proj.get('R', 0) * 1 +
            proj.get('SB', 0) * 2 + proj.get('BB', 0) * 1 +
            proj.get('K', 0) * -0.5
        )
        return round(score, 1)

    def calculate_pitcher_points(self, proj):
        """Calculates total projected points for a pitcher"""
        ip = proj.get('IP', 0)
        era = proj.get('ERA', 0)
        # Estimate ER if not explicitly provided in projections
        er = proj.get('ER', (era * ip) / 9.0 if ip > 0 else 0)
        
        score = (
            ip * self.pitcher_weights['IP'] +
            proj.get('W', 0) * self.pitcher_weights['W'] +
            proj.get('L', 0) * self.pitcher_weights['L'] +
            proj.get('SV', 0) * self.pitcher_weights['SV'] +
            proj.get('HLD', 0) * self.pitcher_weights['HLD'] +
            er * self.pitcher_weights['ER'] +
            proj.get('K', 0) * self.pitcher_weights['K'] +
            proj.get('QS', 0) * self.pitcher_weights['QS']
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