import requests
from django.conf import settings
from requests.exceptions import RequestException
from urllib.parse import urlencode

class FortyTwoOAuth:
    AUTH_URL = 'https://api.intra.42.fr/oauth/authorize'
    TOKEN_URL = 'https://api.intra.42.fr/oauth/token'
    USER_URL = 'https://api.intra.42.fr/v2/me'

    def __init__(self):

        self.client_id = settings.FORTY_TWO_CLIENT_ID
        self.client_secret = settings.FORTY_TWO_CLIENT_SECRET
        self.redirect_uri = settings.FORTY_TWO_REDIRECT_URI

        if not all([self.client_id, self.client_secret, self.redirect_uri]):
            raise ValueError("Missing required OAuth configuration")

    def get_auth_url(self):

        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'response_type': 'code',
            'state': 'random_state',
            'scope': 'public'
        }

        from requests.utils import quote
        base_url = f'{self.AUTH_URL}'
        query_params = [
            f'client_id={self.client_id}',
            f'redirect_uri={quote(self.redirect_uri, safe="")}',
            'response_type=code',
            'state=random_state',
            'scope=public'
        ]
        return f"{base_url}?{'&'.join(query_params)}"

    def get_access_token(self, code):
        data = {
            'grant_type': 'authorization_code',
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': code,
            'redirect_uri': self.redirect_uri
        }
        try:
            response = requests.post(self.TOKEN_URL, data=data, timeout=10)
            response.raise_for_status()
            return response.json()
        except RequestException as e:
            raise Exception(f"Failed to get access token: {str(e)}")

    def get_user_info(self, access_token):

        headers = {'Authorization': f'Bearer {access_token}'}
        try:
            response = requests.get(self.USER_URL, headers=headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except RequestException as e:
            raise Exception(f"Failed to get user info: {str(e)}")