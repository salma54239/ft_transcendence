from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification


@receiver(post_save, sender=Notification)
def send_notification(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        print(f"Sending signal for notification type: {instance.notification_type}")
        async_to_sync(channel_layer.group_send)(
            f"user_{instance.recipient.id}",
            {
                "type": "notification_message",
                "message": {
                    "id": instance.id,
                    "type": instance.notification_type,
                    "sender": {
                        "id": instance.sender.id,
                        "username": instance.sender.profile.display_name if hasattr(instance.sender, 'profile') else instance.sender.email,
                        "avatar": instance.sender.avatar.url if hasattr(instance.sender, 'avatar') and instance.sender.avatar else None
                    }
                }
            }
        )