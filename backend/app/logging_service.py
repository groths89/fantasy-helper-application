# /Users/gregoryrothstein/Code/fantasy-baseball-helper-app/backend/app/logging_service.py
import json
import os
from datetime import datetime
from typing import List, Dict, Optional

# Logs will be stored in 'backend/bot_logs.jsonl' relative to this file
LOG_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'bot_logs.jsonl'))

def log_bot_event(level: str, message: str, details: Optional[dict] = None):
    """
    Appends a log entry to the log file.
    """
    entry = {
        "timestamp": datetime.now().isoformat(),
        "level": level,
        "message": message,
        "details": details or {}
    }
    
    try:
        # Append to the file (JSON Lines format)
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as e:
        print(f"Warning: Failed to write to bot log file: {e}")

def get_bot_logs(limit: int = 100) -> List[Dict]:
    """
    Reads the last N logs from the log file, newest first.
    """
    logs = []
    if not os.path.exists(LOG_FILE):
        return logs
    
    try:
        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
            # Process in reverse to get newest first
            for line in reversed(lines):
                if len(logs) >= limit:
                    break
                if line.strip():
                    try:
                        logs.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
    except Exception as e:
        print(f"Error reading bot logs: {e}")
        
    return logs
