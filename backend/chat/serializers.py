from rest_framework import serializers
from .models import ChatRoom,ChatMessage
from API.serializers import UserSerializer

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'chat_room', 'sender', 'content', 'created_at']
        read_only_fields = ['chat_room','sender']

class ChatRoomSerializer(serializers.ModelSerializer):
    last_message_content = serializers.SerializerMethodField()
    last_message_sender = serializers.SerializerMethodField()
    last_updated_at = serializers.SerializerMethodField()
    friend = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'friend', 'last_message_content', 'last_message_sender', 'last_updated_at']

    def get_last_message_content(self, obj):
        last_message = obj.messages.order_by('-created_at').first()
        return last_message.content if last_message else "No messages yet"

    def get_last_message_sender(self, obj):
        last_message = obj.messages.order_by('-created_at').first()
        return last_message.sender.profile.display_name if last_message else None

    def get_last_updated_at(self, obj):
        last_message = obj.messages.order_by('-created_at').first()
        return last_message.created_at if last_message else obj.created_at

    def get_friend(self, obj):
        request_user = self.context['request'].user
        friend_participant = obj.participants.exclude(user=request_user).first()

        if friend_participant and friend_participant.user:
            return UserSerializer(friend_participant.user, context=self.context).data

        return None
 