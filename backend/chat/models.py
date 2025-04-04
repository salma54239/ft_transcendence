from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatRoom(models.Model):
    name = models.CharField(max_length=255)
    is_direct_message = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_chat_rooms'
    )
    
from django.utils.timezone import now

class ChatParticipant(models.Model):
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_participations')
    joined_at = models.DateTimeField(auto_now_add=True)
    is_admin = models.BooleanField(default=False)
    is_blocked = models.BooleanField(default=False)
    blocked_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='blocked_participants'
    )
    blocked_since = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['chat_room', 'user']


class ChatMessage(models.Model):
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    hidden = models.BooleanField(default=False) 

    class Meta:
        ordering = ['created_at']
    
class GameInvitation(models.Model):
    inviter = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_invitations")
    invitee = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_invitations")
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_accepted = models.BooleanField(default=False)
    is_declined = models.BooleanField(default=False)