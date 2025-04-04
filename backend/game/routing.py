from django.urls import path
from .consumers import PongConsumer
from .consumerInvite import InviteConsumer
from .consumerMatchmaking import MatchmakingConsumer
from .consumerTournament import TournamentConsumer


websocket_urlpatterns = [
    path("ws/game/<int:gameId>", PongConsumer.as_asgi()),
    path("ws/invite/<int:inviteId>", InviteConsumer.as_asgi()),
    path("ws/matchmaking", MatchmakingConsumer.as_asgi()),
    path("ws/playersTournament", TournamentConsumer.as_asgi()),
]