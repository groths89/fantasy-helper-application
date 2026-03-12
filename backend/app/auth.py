import os
import time
from httpx_oauth.oauth2 import OAuth2
from dotenv import load_dotenv

load_dotenv()

YAHOO_CLIENT_ID = os.getenv("YAHOO_CLIENT_ID")
YAHOO_CLIENT_SECRET = os.getenv("YAHOO_CLIENT_SECRET")

# This is a simple in-memory store. In a real app, use a database or a secure session store.
token_storage = {}

yahoo_client = OAuth2(
    client_id=YAHOO_CLIENT_ID,
    client_secret=YAHOO_CLIENT_SECRET,
    authorize_endpoint="https://api.login.yahoo.com/oauth2/request_auth",
    access_token_endpoint="https://api.login.yahoo.com/oauth2/get_token",
    name="yahoo",
)

async def get_valid_token():
    """Retrieves the current token, refreshing it if expired."""
    token = token_storage.get("yahoo_token")
    if not token:
        return None

    # Check if token is expired (giving a 60-second buffer)
    if token.get("expires_at") and token["expires_at"] < time.time() + 60:
        try:
            print("Refreshing Yahoo token...")
            new_token = await yahoo_client.refresh_token(token["refresh_token"])
            token_storage["yahoo_token"] = new_token
            return new_token
        except Exception as e:
            print(f"Error refreshing token: {e}")
            return None
            
    return token