import os
import time
import json
import asyncio
from httpx_oauth.oauth2 import OAuth2, OAuth2Token
from dotenv import load_dotenv

# Load environment variables from the backend's .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    print("Warning: .env file not found. Make sure YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET are set in your environment.")

YAHOO_CLIENT_ID = os.getenv("YAHOO_CLIENT_ID")
YAHOO_CLIENT_SECRET = os.getenv("YAHOO_CLIENT_SECRET")
YAHOO_REDIRECT_URI = "oob"  # Out-of-band for CLI authentication

TOKEN_FILE = os.path.join(os.path.dirname(__file__), 'token.json')

yahoo_client = OAuth2(
    client_id=YAHOO_CLIENT_ID,
    client_secret=YAHOO_CLIENT_SECRET,
    authorize_endpoint="https://api.login.yahoo.com/oauth2/request_auth",
    access_token_endpoint="https://api.login.yahoo.com/oauth2/get_token",
    name="yahoo",
)

def get_token_from_file() -> dict | None:
    """Reads the token from the JSON file."""
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'r') as f:
            return json.load(f)
    return None

def save_token_to_file(token: dict):
    """Saves the token to the JSON file."""
    with open(TOKEN_FILE, 'w') as f:
        json.dump(token, f, indent=4)
    print(f"Token saved to {TOKEN_FILE}")

async def get_new_token():
    """Guides the user through the initial OAuth2 flow to get a token."""
    if not YAHOO_CLIENT_ID or not YAHOO_CLIENT_SECRET:
        print("Error: YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET must be set.")
        return

    authorization_url = await yahoo_client.get_authorization_url(
        redirect_uri=YAHOO_REDIRECT_URI,
        scope="fspt-w",  # Request write-scope to allow roster changes
    )
    print("Please go to this URL and authorize the application:")
    print(authorization_url)
    code = input("Enter the code from the redirect URL: ")
    
    token = await yahoo_client.get_access_token(code, redirect_uri=YAHOO_REDIRECT_URI)
    save_token_to_file(token)
    print("Token obtained and saved successfully!")
    return token

async def get_valid_token() -> OAuth2Token | None:
    """Retrieves the current token from file, refreshing it if it's expired or close to expiring."""
    token = get_token_from_file()
    if not token:
        print(f"Token file not found at {TOKEN_FILE}.\nPlease run `python automation/initial_auth.py` first to authenticate.")
        return None

    if token.get("expires_at", 0) < time.time() + 60:
        try:
            print("Yahoo token expired or is about to expire. Refreshing...")
            new_token = await yahoo_client.refresh_token(token["refresh_token"])
            save_token_to_file(new_token)
            return new_token
        except Exception as e:
            print(f"Error refreshing token: {e}\nYou may need to re-authenticate by running `python automation/initial_auth.py`.")
            return None
            
    return token