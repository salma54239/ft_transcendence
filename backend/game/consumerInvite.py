from .models import Requestship
from .models import Game
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db.models import Q
import json
import asyncio

class InviteConsumer(AsyncWebsocketConsumer):
      players = {}
      async def connect(self):
         await self.accept()
         self.user = self.scope['user']
         self.invite_id = self.scope["url_route"]["kwargs"]["inviteId"]

         self.request_ship = await self.get_request_ship()
         self.task = asyncio.create_task(self.loop_check_request())

         if self.invite_id not in InviteConsumer.players:
            InviteConsumer.players[self.invite_id] = []
            
         if self.request_ship:
            InviteConsumer.players[self.invite_id].append(self)

         if len(InviteConsumer.players[self.invite_id]) == 2:
            game = await self.create_game()
            if game:
               await InviteConsumer.players[self.invite_id][0].send(text_data=json.dumps({
                 'type': 'game_created',
                 'game_id': game.id,
                 'player1': game.player1.id,
                 'player2': game.player2.id,
                 'status': game.status,
               }))
               await InviteConsumer.players[self.invite_id][1].send(text_data=json.dumps({
                 'type': 'game_created',
                 'game_id': game.id,
                 'player1': game.player1.id,
                 'player2': game.player2.id,
                 'status': game.status,
               }))
            else:
               await self.send(text_data=json.dumps({
                 'type': 'error',
                 'message': 'Failed to create game.',
               }))

      async def  disconnect(self, close_code):
         if self.invite_id in InviteConsumer.players:
            del InviteConsumer.players[self.invite_id]
         

      @database_sync_to_async
      def get_request_ship(self):
         try:
            request_ship = Requestship.objects.get(
                  Q(sender_id=self.user.id) | Q(receiver_id=self.user.id)
            )
            return request_ship
         except Requestship.DoesNotExist:
            return None
      
      @database_sync_to_async
      def create_game(self):
         try:
            player1 = InviteConsumer.players[self.invite_id][0].user
            player2 = InviteConsumer.players[self.invite_id][1].user
    
            game = Game.objects.create(
                player1=player1,
                player2=player2,
            )
            return game
         except Exception as e:
             return None
      
      async def loop_check_request(self):
         while True:
            await asyncio.sleep(1)
            inv = await self.get_request_ship()
            if not inv:
               await self.send(text_data=json.dumps({
                 'type': 'invite_canceled',
               }))
               break