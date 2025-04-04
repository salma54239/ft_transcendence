from django.urls import re_path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/rooms/(?P<room_id>\d+)/messages/$', ChatConsumer.as_asgi()),
]