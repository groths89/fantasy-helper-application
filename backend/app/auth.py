import os
import json
import time
from httpx_oauth.oauth2 import OAuth2
from dotenv import load_dotenv

load_dotenv()

YAHOO_CLIENT_ID = os.getenv("YAHOO_CLIENT_ID")
YAHOO_CLIENT_SECRET = os.getenv("YAHOO_CLIENT_SECRET")

# Path to the shared token file used by automation scripts
# automation/token.json relative to backend/app/auth.py
TOKEN_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'automation', 'token.json'))

def save_token(token: dict):
    """Saves the token to the shared JSON file."""
    os.makedirs(os.path.dirname(TOKEN_FILE), exist_ok=True)
    with open(TOKEN_FILE, 'w') as f:
        json.dump(token, f, indent=4)
    print(f"Token saved to {TOKEN_FILE}")

def get_token() -> dict | None:
    """Retrieves the token from the shared JSON file."""
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'r') as f:
            return json.load(f)
    return None

yahoo_client = OAuth2(
    client_id=YAHOO_CLIENT_ID,
    client_secret=YAHOO_CLIENT_SECRET,
    authorize_endpoint="https://api.login.yahoo.com/oauth2/request_auth",
    access_token_endpoint="https://api.login.yahoo.com/oauth2/get_token",
    refresh_token_endpoint="https://api.login.yahoo.com/oauth2/get_token",
    name="yahoo",
)

async def get_valid_token():
    """Retrieves the current token, refreshing it if expired."""
    token = get_token()
    if not token:
        return None

    # Check if token is expired (giving a 60-second buffer)
    if token.get("expires_at") and token["expires_at"] < time.time() + 60:
        try:
            print("Refreshing Yahoo token...")
            new_token = await yahoo_client.refresh_token(token["refresh_token"])
            save_token(new_token)
            return new_token
        except Exception as e:
            print(f"Error refreshing token: {e}")
            return None
            
    return token