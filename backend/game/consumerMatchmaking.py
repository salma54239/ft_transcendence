
from .models import Game
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json
import asyncio


class MatchmakingConsumer(AsyncWebsocketConsumer):
    players = {}
    async def connect(self):
        self.user = self.scope['user']
        await self.accept()
        if self.user.id not in MatchmakingConsumer.players:
            MatchmakingConsumer.players[self.user.id] = []

        MatchmakingConsumer.players[self.user.id] = self
        if len(MatchmakingConsumer.players) == 2:
            game = await self.create_game()
            if game:
                player_connections = list(MatchmakingConsumer.players.values())
                game_data = {
                'type': 'game_created',
                'game_id': game.id,
                'player1': game.player1.id,
                'player2': game.player2.id,
                'status': game.status,
                }

                for player_connection in player_connections:
                    await player_connection.send(text_data=json.dumps(game_data))

                MatchmakingConsumer.players.clear()
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Failed to create game.',
                }))

    async def  disconnect(self, close_code):
        if(MatchmakingConsumer.players):
            MatchmakingConsumer.players.clear()


    @database_sync_to_async
    def create_game(self):
        try:
            player_connections = list(MatchmakingConsumer.players.values())
        
            player1 = player_connections[0].user
            player2 = player_connections[1].user

            game = Game.objects.create(
                player1=player1,
                player2=player2,
            )
            return game
        except Exception as e:
            return None
    