from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatRoom, ChatParticipant, ChatMessage

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_name = f'chat_{self.room_id}'

        if not self.scope.get('user') or not await self.is_room_participant():
            await self.close()
            return
        # adds websocket connection to the group 
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_name'):
            await self.channel_layer.group_discard(self.room_name, self.channel_name)
    async def close(self, code=None):
        await self.disconnect(code)

    # method to handle incoming messages
    async def receive_json(self, content):
        if await self.is_blocked():
            await self.send_json({
                'type': 'error',
                'message': 'You are blocked and cannot send messages.'
            })
            return

        try:
            message_type = content.get('type')
            if message_type == 'chat.message':
                message_data = content.get('message', {})
                message_content = message_data.get('content', '')
                
                if message_content:
                    message = await self.save_message(message_content)
                    if message:
                        await self.channel_layer.group_send(
                            self.room_name,
                            {
                            'type': 'chat_message',
                            'message': {
                                'id': message.id,
                                'content': message_content,
                                'sender': self.scope['user'].id,
                                'created_at': message.created_at.isoformat()
                            }
                        }
                    )
        except KeyError as e:
            await self.send_json({
            'type': 'error',
            'message': f'Missing key: {str(e)}'
            })
        except Exception as e:
            await self.send_json({
            'type': 'error',
            'message': f'An error occurred: {str(e)}'
            })

    async def chat_message(self, event):
        message = event['message']
        await self.send_json({
            'type': 'chat.message',
            'message': {
                'id': message['id'],
                'content': message['content'],
                'sender': message['sender'],
                'created_at': message['created_at']
            }
        })

    @database_sync_to_async
    def is_room_participant(self):
        return ChatParticipant.objects.filter(
            chat_room_id=self.room_id,
            user=self.scope['user']
        ).exists()

    @database_sync_to_async
    def is_blocked(self):
        return ChatParticipant.objects.filter(
            chat_room_id=self.room_id,
            is_blocked=True
        ).exists()

    @database_sync_to_async
    def save_message(self, content):
        return ChatMessage.objects.create(
            chat_room_id=self.room_id,
            sender=self.scope['user'],
            content=content
        )
