from rest_framework import serializers
from .models import User, UserProfile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user
        user.status = "Online"
        user.refresh_token = data['refresh']
        user.save()
        return data

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):

    profile = UserProfileSerializer(read_only=True)
    avatar = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'avatar','username', 'is_two_factor_enabled', 'profile', 'status', 'level']
        read_only_fields = ('is_two_factor_enabled',)
        
    def get_avatar(self, obj):
        if obj.avatar:
            return obj.avatar.url
        
        return None
    
    def get_username(self, obj):
        if hasattr(obj, 'profile') and obj.profile:
            return obj.profile.display_name
        return obj.username
    
    def get_level(self, obj):
        if hasattr(obj, 'profile') and obj.profile:
            return obj.profile.level
        return obj.level


class UserRegistrationSerializer(serializers.ModelSerializer):

    password2 = serializers.CharField(write_only=True) 
    display_name = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'display_name')
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords don't match")
        return data

    def create(self, validated_data):

        display_name = validated_data.pop('display_name')
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        user.profile.display_name = display_name
        user.profile.save()
        return user