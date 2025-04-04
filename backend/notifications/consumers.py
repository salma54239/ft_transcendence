from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.exceptions import DenyConnection
import logging

logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        try:
            if self.scope["user"] is None or self.scope["user"].is_anonymous:
                logger.warning("Anonymous user tried to connect")
                raise DenyConnection("Authentication required")
            
            self.user_id = str(self.scope['user'].id)
            self.group_name = f"user_{self.user_id}"
            
            logger.info(f"User {self.user_id} connected")
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            
        except DenyConnection as e:
            logger.error(f"Connection denied: {str(e)}")
            await self.close()
        except Exception as e:
            logger.error(f"WebSocket connection error: {str(e)}")
            await self.close()

    async def disconnect(self, close_code):
        try:
            if hasattr(self, 'user_id') and hasattr(self, 'group_name'):
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
                logger.info(f"User {self.user_id} disconnected")
        except Exception as e:
            logger.error(f"Error during disconnect: {str(e)}")

    async def notification_message(self, event):
        try:
            logger.info(f"Sending notification to user {self.user_id}: {event}")
            await self.send_json(event['message'])
        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")


            