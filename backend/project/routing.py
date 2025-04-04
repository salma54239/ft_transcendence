from game.routing import websocket_urlpatterns as game_ws
from notifications.routing import websocket_urlpatterns as notification_ws
from chat.routing import websocket_urlpatterns as chat_ws

websocket_urlpatterns = game_ws + notification_ws + chat_ws