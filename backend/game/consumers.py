from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
import math


class PongConsumer(AsyncWebsocketConsumer):
    players = {}

    async def connect(self):
        await self.accept()
        self.user_id = self.scope['user'].id
        self.game_id = self.scope['url_route']['kwargs']['gameId']
        self.room_group_name = f"game_{self.game_id}"

       
        self.BALL_SPEED = 5
        self.WINNING_SCORE = 7
        self.CANVAS_WIDTH = 1000
        self.CANVAS_HEIGHT = 700
        self.PADDLE_WIDTH = 20
        self.PADDLE_HEIGHT = 100
        self.playerL = {'id': None, 'x': 0, 'y': 0, 'score': 0, 'down': False, 'up':False, 'gameOver': False}
        self.playerR = {'id': None, 'x': self.CANVAS_WIDTH - self.PADDLE_WIDTH, 'y': 0, 'score': 0, 'down': False, 'up':False, 'gameOver': False}
        self.ball = {
            'x': self.CANVAS_WIDTH/2, 
            'y': self.CANVAS_HEIGHT/2, 
            'radius': 12, 
            'speed': self.BALL_SPEED, 
            'velocityX': self.BALL_SPEED, 
            'velocityY': self.BALL_SPEED
        }
        self.gameOver = False
        self.winner = None
        self.role = None
        
        if self.game_id not in self.players:
            self.players[self.game_id] = {'playerL': self.playerL, 'playerR': self.playerR, 'ball': self.ball}
        

        if self.players[self.game_id]['playerL']['id'] is None:
            self.players[self.game_id]['playerL']['id'] = self.user_id
            self.role = 'playerL'
        elif self.players[self.game_id]['playerR']['id'] is None:
            self.players[self.game_id]['playerR']['id'] = self.user_id
            self.role = 'playerR'
        else:
            await self.close()
            return
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        asyncio.create_task(self.paddles_loop())
        if self.players[self.game_id]['playerL']['id'] and self.players[self.game_id]['playerR']['id']:
            asyncio.create_task(self.ball_loop())
        
    async def disconnect(self, close_code):
        try:
            if self.role is None or self.game_id not in self.players:
                return
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'player_disconncted',
                    'disconnect': True
                }
            )

            if not self.players[self.game_id]['playerR']['gameOver'] and not self.players[self.game_id]['playerL']['gameOver']:
                self.players[self.game_id]['playerR']['gameOver'] = True
                self.players[self.game_id]['playerL']['gameOver'] = True

            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)


        except Exception as e:
            print(f"Error during disconnect: {str(e)}")
        finally:
            await self.close()

    async def player_disconncted(self, event):
        await self.send(text_data=json.dumps({
            'role': event.get('role'),
            'disconnected': True
        }))

    async def receive(self, text_data):
        data = json.loads(text_data)

        move = data['move']
        value = data.get('value')   

        if move == 'down':
            self.players[self.game_id][self.role]['down'] = value

        elif move == 'up':
            self.players[self.game_id][self.role]['up'] = value

    async def update_paddle(self):
            if self.players[self.game_id][self.role]['up']:
                self.players[self.game_id][self.role]['y'] = max(0, self.players[self.game_id][self.role]['y'] - 10)
            if self.players[self.game_id][self.role]['down']:
                self.players[self.game_id][self.role]['y'] = min(self.CANVAS_HEIGHT - self.PADDLE_HEIGHT, self.players[self.game_id][self.role]['y'] + 10)



    def check_collision(self, paddle):
        paddle_top = paddle['y']
        paddle_bottom = paddle['y'] + self.PADDLE_HEIGHT
        paddle_right = paddle['x'] + self.PADDLE_WIDTH
        paddle_left = paddle['x']

        ball_top = self.ball['y'] - self.ball['radius']
        ball_bottom = self.ball['y'] + self.ball['radius']
        ball_right = self.ball['x'] + self.ball['radius']
        ball_left = self.ball['x'] - self.ball['radius']

        return (
            ball_left <= paddle_right and ball_top <= paddle_bottom and ball_bottom >= paddle_top 
            and ball_right >= paddle_left
        )

    async def reset_ball(self):
        self.ball['x'] = self.CANVAS_WIDTH/2
        self.ball['y'] = self.CANVAS_HEIGHT/2
        self.ball['velocityX'] *= -1
        self.ball['speed'] = self.BALL_SPEED

    async def broadcast_winner(self):
        self.players[self.game_id]['playerR']['gameOver'] = True
        self.players[self.game_id]['playerL']['gameOver'] = True


    async def update_ball(self):
        self.ball['x'] += self.ball['velocityX']
        self.ball['y'] += self.ball['velocityY']

        if self.ball['y'] + self.ball['radius'] > self.CANVAS_HEIGHT or self.ball['y'] - self.ball['radius'] < 0:
            self.ball['velocityY'] *= -1

        paddle = self.players[self.game_id]['playerR'] if self.ball['x'] > self.CANVAS_WIDTH/2 else self.players[self.game_id]['playerL']
        if self.check_collision(paddle):
            angleRad = math.pi / 4 if self.ball['velocityY'] > 0 else -math.pi / 4
            direction = 1 if self.ball['x'] < self.CANVAS_WIDTH/2 else -1
            self.ball['velocityX'] = math.cos(angleRad) * self.ball['speed'] * direction
            self.ball['velocityY'] = math.sin(angleRad) * self.ball['speed']
            self.ball['speed'] += 0.1

        if self.ball['x'] - self.ball['radius'] <= 0:
            self.players[self.game_id]['playerR']['score'] += 1
            if self.players[self.game_id]['playerR']['score'] == self.WINNING_SCORE:
                await self.broadcast_winner()
            await self.reset_ball()
        elif self.ball['x'] + self.ball['radius'] >= self.CANVAS_WIDTH:
            self.players[self.game_id]['playerL']['score'] += 1
            if self.players[self.game_id]['playerL']['score'] == self.WINNING_SCORE:
                await self.broadcast_winner()
            await self.reset_ball() 

    async def start_game(self, event):
        await self.send(json.dumps({
            'start': event['start'],
            'player1': event['player1'],
            'player2': event['player2'],
        }))
    
    async def game_update(self, event):
        await self.send(json.dumps({
            'ball': event['ball'],
            'player1': event['player1'],
            'player2': event['player2'],
    }))

    async def ball_loop(self):
        await asyncio.sleep(2)
        while not self.players[self.game_id][self.role]['gameOver']:
            await self.update_ball()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_update',
                    'ball': self.ball,
                    'player1': self.players[self.game_id]['playerL'],
                    'player2': self.players[self.game_id]['playerR'],

                }
            )
            await asyncio.sleep(1/60)


    async def paddles_loop(self):
        await asyncio.sleep(2)
        if self.players[self.game_id]['playerL']['id'] is None or self.players[self.game_id]['playerR']['id'] is None:
            self.players[self.game_id][self.role]['gameOver'] = True
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'player_disconncted',
                    'disconnect': True
                }
            )
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'start_game',
                'start': True,
                'player1': self.players[self.game_id]['playerL'],
                'player2': self.players[self.game_id]['playerR'],
            }
        )
        while not self.players[self.game_id][self.role]['gameOver']:
            await self.update_paddle()
            await asyncio.sleep(1/60)