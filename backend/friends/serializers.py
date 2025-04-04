from rest_framework import serializers
from .models import Friendship, User

class UserSerializer(serializers.ModelSerializer):

    username = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id','username' ,'avatar', 'email', 'status', 'level']
    
    def get_username(self, obj):
        return obj.profile.display_name

    def get_level(self, obj):
        return obj.profile.level
    
    def get_avatar(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None
    
class FriendshipSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'sender', 'receiver', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']
