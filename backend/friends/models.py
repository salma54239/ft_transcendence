from django.db import models
from API.models import User 

class UserFriend(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="user_friend")
    friendships = models.ManyToManyField(
        User,
        symmetrical=False,
        blank=True,
        related_name="friends_with"
    )

class Friendship(models.Model):
    PENDING = 'pending'
    ACCEPTED = 'accepted'

    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (ACCEPTED, 'Accepted'),
    ]

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_requests")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_requests")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

