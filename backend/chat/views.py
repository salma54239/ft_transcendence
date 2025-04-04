from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import ChatRoom, ChatMessage, ChatParticipant
from .serializers import ChatRoomSerializer, ChatMessageSerializer
from .models import GameInvitation
from API.models import User
from django.db.models import Q
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from rest_framework.views import APIView
from django.db import models


class ChatRoomListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatRoom.objects.filter(participants__user=self.request.user)

    def perform_create(self, serializer):
        invitee_id = self.request.data.get("invitee_id")
        invitee = User.objects.get(id=invitee_id)
        request_user = self.request.user

        # Check if a room already exists between the two users
        existing_room = ChatRoom.objects.filter(
            is_direct_message=True,
            participants__user=request_user
        ).filter(participants__user=invitee).distinct()

        if existing_room.exists():
            print(f"Room already exists between {request_user} and {invitee}.")
            # If room exists, return the existing room ID in the response
            raise serializers.ValidationError({"room_id": existing_room.first().id})

        # If no room exists, create a new one
        chat_room = serializer.save(created_by=request_user)
        ChatParticipant.objects.create(chat_room=chat_room, user=request_user, is_admin=True)
        ChatParticipant.objects.create(chat_room=chat_room, user=invitee)


class ChatRoomDetailView(generics.RetrieveDestroyAPIView):
    """
    View for retrieving and deleting a chat room.
    """
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure the user is a participant in the chat room
        return ChatRoom.objects.filter(participants__user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        try:
            chat_room = self.get_object()
            print(f"Attempting to delete chat room with ID: {chat_room.id}")

            # Check if the current user is allowed to delete the chat room
            if chat_room.created_by != request.user:
                print(f"Permission denied for user {request.user}. Chat room created by {chat_room.created_by}.")
                raise PermissionDenied("You do not have permission to delete this chat room.")

            # Delete related objects (if cascade is not set)
            chat_room.messages.all().delete()
            chat_room.participants.all().delete()

            # Delete the chat room
            self.perform_destroy(chat_room)
            print("Chat room deleted successfully.")
            return Response({"detail": "Chat room deleted successfully."}, status=204)

        except Exception as e:
            print(f"Error while deleting chat room: {e}")
            return Response({"detail": f"Error while deleting chat room: {str(e)}"}, status=500)

class ChatMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        chat_room = ChatRoom.objects.get(id=room_id)
        user = self.request.user

        # Ensure the user is part of the chat room
        ChatParticipant.objects.get(chat_room=chat_room, user=user)

        return ChatMessage.objects.filter(chat_room=chat_room).order_by('created_at')

    def perform_create(self, serializer):
        room_id = self.kwargs['room_id']
        chat_room = ChatRoom.objects.get(id=room_id)
        sender = self.request.user

        # Check if any participant is blocked
        participants = ChatParticipant.objects.filter(chat_room=chat_room)
        if participants.filter(is_blocked=True).exists():
            # Ensure this message is sent
            raise serializers.ValidationError({"detail": "You are blocked and cannot send messages."})

        # Save the message if no block is active
        serializer.save(sender=sender, chat_room=chat_room)



from django.utils.timezone import now
class BlockParticipantView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        try:
            chat_room = ChatRoom.objects.get(id=room_id)
            participant_to_block = ChatParticipant.objects.get(chat_room=chat_room, user_id=request.data['participant_id'])
            current_user = request.user
        except ChatParticipant.DoesNotExist:
            raise NotFound("User not found in the chat room.")

        # Prevent the blocked user from toggling the block status
        if participant_to_block.is_blocked and participant_to_block.blocked_by != current_user:
            raise PermissionDenied("You cannot unblock this user because you are blocked by them.")

        # Toggle block/unblock logic
        if participant_to_block.is_blocked and participant_to_block.blocked_by == current_user:
            # Unblock the user
            participant_to_block.is_blocked = False
            participant_to_block.blocked_by = None
            participant_to_block.isblocker = False
            participant_to_block.save()
            return Response({"detail": "The user has been unblocked."})
        else:
            # check if no participant is being blocked
            if ChatParticipant.objects.filter(chat_room=chat_room, is_blocked=True).exists():
                raise PermissionDenied("You cannot block this user because someone else is already blocked.")
            participant_to_block.is_blocked = True
            participant_to_block.blocked_by = current_user
            participant_to_block.save()
            return Response({"detail": "The user has been blocked."})

class BlockStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        try:
            chat_room = ChatRoom.objects.get(id=room_id)
            current_user = request.user

            # Fetch the current user's participant record
            participant = ChatParticipant.objects.get(chat_room=chat_room, user=current_user)

            # Check block relationships
            is_blocked_by_other = participant.is_blocked  # User is blocked by someone
            is_blocking = ChatParticipant.objects.filter(chat_room=chat_room, blocked_by=current_user).exists()  # User is blocking someone

            # Determine frontend state
            if is_blocked_by_other:
                button_state = "Blocked by someone"
                can_toggle = False
            elif is_blocking:
                button_state = "Unblock"
                can_toggle = True
            else:
                button_state = "Block"
                can_toggle = True

            return Response({
                "is_blocked": is_blocking,
                "is_blocked_by": is_blocked_by_other,
                "button_state": button_state,
                "can_toggle": can_toggle,
            })
        except ChatParticipant.DoesNotExist:
            return Response({"is_blocked": False, "is_blocked_by": False, "button_state": "Block", "can_toggle": True})
        except ChatRoom.DoesNotExist:
            raise NotFound("Chat room not found.")
