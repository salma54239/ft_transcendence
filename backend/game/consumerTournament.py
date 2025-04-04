
from .models import Tournament
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json
import asyncio


class TournamentConsumer(AsyncWebsocketConsumer):
    players = {}
    playersTournament = {}
    winners = {}
    async def connect(self):
        await self.accept()
        self.user = self.scope['user']
        if self.user.id not in TournamentConsumer.players:
            TournamentConsumer.players[self.user.id] = []
        TournamentConsumer.players[self.user.id] = self
        TournamentConsumer.playersTournament[self.user.id] = self
        if len(TournamentConsumer.players) == 4:
            tournament, games = await self.create_tournament_and_games()
            if games:
                await self.send_game_notifications(games)

                player_ids = list(TournamentConsumer.players.keys())[:4]
                for player_id in player_ids:
                    del TournamentConsumer.players[player_id]
                self.task = asyncio.create_task(self.monitor_games(tournament, games))
                self.task.add_done_callback(self.handle_task)
                
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Failed to create games.',
                }))

    async def  disconnect(self, close_code):
        if self.user.id in  TournamentConsumer.players:
            del TournamentConsumer.players[self.user.id]

    @database_sync_to_async
    def create_tournament_and_games(self):
        try:
            player_connections = list(TournamentConsumer.players.values())
            player1 = player_connections[0].user
            player2 = player_connections[1].user
            player3 = player_connections[2].user
            player4 = player_connections[3].user

            tournament = Tournament.objects.create(
                player1=player1,
                player2=player2,
                player3=player3,
                player4=player4,
            )

            game1 = tournament.create_game_player1_vs_player2()
            game2 = tournament.create_game_player3_vs_player4()

            return tournament, [game1, game2]
        except Exception as e:
            print(f"Error creating games: {e}")
            return None
    
    async def send_game_notifications(self, games):
        try:
            player_connections = list(TournamentConsumer.players.values())

            game1 = games[0]
            game1_data = {
                'type': 'game_created',
                'game_id': game1.id,
                'player1': game1.player1.id,
                'player2': game1.player2.id,
                'status': game1.status,
            }
            await player_connections[0].send(text_data=json.dumps(game1_data))
            await player_connections[1].send(text_data=json.dumps(game1_data))

            game2 = games[1]
            game2_data = {
                'type': 'game_created',
                'game_id': game2.id,
                'player1': game2.player1.id,
                'player2': game2.player2.id,
                'status': game2.status,
            }
            await player_connections[2].send(text_data=json.dumps(game2_data))
            await player_connections[3].send(text_data=json.dumps(game2_data))

        except Exception as e:
            print(f"Error sending game notifications: {e}")

    async def monitor_games(self, tournament, games):
        try:
            while True:
                await asyncio.sleep(1)
                completed_games = await self.check_completed_games(games)
                if len(completed_games) == 2:
                    winner1, winner2 = await self.get_winners(completed_games)
                    final_game = await self.create_final_game(tournament, winner1, winner2)
                    if final_game:
                        await self.send_final_game_notification(final_game)
                    break
        except Exception as e:
            print(f"Error monitoring games: {e}")

    @database_sync_to_async
    def get_winners(self, completed_games):
        winner1 = completed_games[0].winner
        winner2 = completed_games[1].winner
        for player_id, player in TournamentConsumer.playersTournament.items():
            if player.user == winner1 or player.user == winner2:
                TournamentConsumer.winners[player_id] = player
        return winner1, winner2

    @database_sync_to_async
    def check_completed_games(self, games):
        completed_games = []
        for game in games:
            try:
                game.refresh_from_db()
                if game.status == 'completed' and game.winner:
                    completed_games.append(game)
            except Exception as e:
                print(f"Error refreshing game: {e}")
        return completed_games

    @database_sync_to_async
    def create_final_game(self, tournament, winner1, winner2):
        try:
            final_game = tournament.create_game_final(winner1, winner2)
            return final_game
        except Exception as e:
            print(f"Error creating final game: {e}")
            return None

    async def send_final_game_notification(self, final_game):
        try:
            for player_id, player in TournamentConsumer.winners.items():
                await player.send(text_data=json.dumps({
                    'type': 'final_game_created',
                    'game_id': final_game.id,
                    'player1': final_game.player1.id,
                    'player2': final_game.player2.id,
                    'status': final_game.status,
                }))
            TournamentConsumer.winners.clear()
        except Exception as e:
            print(f"Error sending final game notification: {e}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'leave':
            
            if self.user.id in TournamentConsumer.players:
                del TournamentConsumer.players[self.user.id]
    
    def handle_task(self, task):
        try:
            task.result()
        except Exception as e:
            print(f"Task crashed with error: {e}")