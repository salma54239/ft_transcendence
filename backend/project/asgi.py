import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from project.routing import websocket_urlpatterns
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from project.cookieJwtAuthentication import CookieJWTAuthentication
import logging

logger = logging.getLogger(__name__)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')

class JWTAuthMiddleware(BaseMiddleware):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.cookie_auth = CookieJWTAuthentication()

    def get_access_token_from_cookies(self, headers):
        try:
            for key, value in headers:
                if key == b'cookie':
                    cookie_str = value.decode('utf-8')
                    cookies = dict(cookie.strip().split('=', 1) for cookie in cookie_str.split(';') if '=' in cookie)
                    return cookies.get('access')
        except Exception as e:
            logger.error(f"Error extracting access token: {str(e)}")
        return None

    async def __call__(self, scope, receive, send):
        try:
            access_token = self.get_access_token_from_cookies(scope['headers'])
            if access_token:
                user, token = await database_sync_to_async(self.cookie_auth.socket_authenticate)(access_token)
                scope['user'] = user
                scope['token'] = token
            else:
                logger.warning("No access token found in cookies")
        except Exception as e:
            logger.error(f"Authentication middleware error: {str(e)}")
        
        return await super().__call__(scope, receive, send)

application = ProtocolTypeRouter({
    "http": get_asgi_application(), 
    "websocket": JWTAuthMiddleware( 
        URLRouter(
            websocket_urlpatterns
        )
    ),
})