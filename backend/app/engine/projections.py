import pandas as pd
import os


def fetch_2026_projections():
  """
  Loads 2026 projected hitting and pitching stats from local CSV files,
  merges them, and cleans the data.
  """
  try:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    hitter_path = os.path.join(base_dir, '..', 'data', 'hitter_projections.csv')
    pitcher_path = os.path.join(base_dir, '..', 'data', 'pitcher_projections.csv')

    if not os.path.exists(hitter_path) or not os.path.exists(pitcher_path):
        raise FileNotFoundError("Hitter or pitcher projection file not found.")

    df_hitters = pd.read_csv(hitter_path)
    df_pitchers = pd.read_csv(pitcher_path)

    # --- Data Cleaning & Renaming ---
    # Standardize column names from FantasyPros: 'Player' and 'Positions'
    df_hitters = df_hitters.rename(columns={'Player': 'name', 'Positions': 'position'})
    df_pitchers = df_pitchers.rename(columns={'Player': 'name', 'Positions': 'position'})

    # Pre-process Pitcher columns to prevent collision with Hitter stats
    # We rename conflicting Pitcher stats to *_allowed
    if 'SO' in df_pitchers.columns:
        if 'K' in df_pitchers.columns:
            # Both 'K' and 'SO' exist. Prefer 'SO' if 'K' is empty.
            if pd.to_numeric(df_pitchers['K'], errors='coerce').sum() == 0 and pd.to_numeric(df_pitchers['SO'], errors='coerce').sum() > 0:
                df_pitchers['K'] = df_pitchers['SO']
            # Now that K is correct, drop the SO column to prevent collision.
            df_pitchers = df_pitchers.drop(columns=['SO'])
        else:
             df_pitchers.rename(columns={'SO': 'K'}, inplace=True)

    for col in ['HR', 'R', 'H', 'BB']:
        if col in df_pitchers.columns:
             df_pitchers.rename(columns={col: f"{col}_allowed"}, inplace=True)

    # Calculate 1B for hitters if possible. 1B = H - 2B - 3B - HR
    if all(c in df_hitters.columns for c in ['H', '2B', '3B', 'HR']):
        df_hitters['1B'] = df_hitters['H'] - df_hitters['2B'] - df_hitters['3B'] - df_hitters['HR']

    # Merge on name. Use an outer join to keep all players.
    # Common columns like 'SO' and 'position' will get suffixes.
    df = pd.merge(df_hitters, df_pitchers, on='name', how='outer', suffixes=('_h', '_p'))

    # Drop rows that may have been created from empty lines in the CSV files
    df.dropna(subset=['name'], inplace=True)

    # Create a unique ID. Using index is a safe bet.
    df['id'] = df.index

    # Coalesce position info from both files
    if 'position_h' in df.columns and 'position_p' in df.columns:
        df['position'] = df['position_h'].combine_first(df['position_p'])
    elif 'position_h' in df.columns: # Only hitters have positions
        df['position'] = df['position_h']
    elif 'position_p' in df.columns: # Only pitchers have positions
        df['position'] = df['position_p']
    else:
        df['position'] = 'Unknown'

    # Ensure position is a string, default to 'Util' if it's missing
    df['position'] = df['position'].fillna('Util')

    # Unify Strikeouts (SO for hitters, K for pitchers) into a single 'SO' column
    # For two-way players, this will sum their hitting and pitching strikeouts.
    hitter_so = df['SO'].fillna(0) if 'SO' in df.columns else 0
    pitcher_k = df['K'].fillna(0) if 'K' in df.columns else 0
    df['SO'] = hitter_so + pitcher_k

    # Ensure all expected stat columns exist and are numeric, filling NaNs with 0
    # This list should contain all stats used for SGP and Points calculations
    stat_cols = [
        'AB', 'R', 'H', '1B', '2B', '3B', 'HR', 'RBI', 'SB', 'BB', 'AVG', # Hitting
        'W', 'L', 'SV', 'HLD', 'IP', 'ERA', 'WHIP', 'ER', # Pitching
        'H_allowed', 'BB_allowed',
        'SO' # Shared
    ]
    for col in stat_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        else:
            df[col] = 0

    # Select and order final columns
    final_cols = ['id', 'name', 'position'] + [col for col in stat_cols if col in df.columns]
    df = df[final_cols]

    return df

  except (FileNotFoundError, Exception) as e:
    print(f"⚠️ Projections file processing error: {e}. Using mock data.")
    return pd.DataFrame([
      {'name': 'Sample Hitter 1', 'id': 1, 'position': '1B,OF', 'HR': 20, 'SB': 10, 'RBI': 80, 'R': 80, 'AVG': .260, 'W': 0, 'L': 0, 'SV': 0, 'HLD': 0, 'SO': 0, 'ERA': 0, 'WHIP': 0, 'IP': 0, 'QS': 0},
      {'name': 'Sample Hitter 2', 'id': 2, 'position': '2B', 'HR': 15, 'SB': 5, 'RBI': 60, 'R': 70, 'AVG': .275, 'W': 0, 'L': 0, 'SV': 0, 'HLD': 0, 'SO': 0, 'ERA': 0, 'WHIP': 0, 'IP': 0, 'QS': 0},
      {'name': 'Sample Pitcher 1', 'id': 3, 'position': 'SP', 'HR': 0, 'SB': 0, 'RBI': 0, 'R': 0, 'AVG': 0, 'W': 15, 'L': 5, 'SV': 0, 'HLD': 0, 'SO': 200, 'ERA': 3.50, 'WHIP': 1.10, 'IP': 180, 'QS': 15},
      {'name': 'Sample Pitcher 2', 'id': 4, 'position': 'RP', 'HR': 0, 'SB': 0, 'RBI': 0, 'R': 0, 'AVG': 0, 'W': 5, 'L': 2, 'SV': 20, 'HLD': 10, 'SO': 80, 'ERA': 2.80, 'WHIP': 1.00, 'IP': 60, 'QS': 0}
    ])