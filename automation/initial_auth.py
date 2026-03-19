import asyncio
from yahoo_auth import get_new_token

if __name__ == "__main__":
    """
    This script is used to perform the initial OAuth2 authentication with Yahoo.
    It will guide you to a URL, you'll authorize the app, and then you'll
    paste a code back into the terminal.
    
    The resulting token (with refresh capabilities) will be stored in `token.json`.
    This only needs to be run once, or again if the token becomes invalid.
    """
    print("--- Starting Yahoo Initial Authentication ---")
    asyncio.run(get_new_token())