
from django.db.models.query import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from .models import Friendship, UserFriend, User
from .serializers import FriendshipSerializer, UserSerializer
from notifications.models import Notification


class FriendUserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, friend_user_id):
        friend_user = get_object_or_404(User, id=friend_user_id)
        
        is_friend = Friendship.objects.filter(
            status=Friendship.ACCEPTED
        ).filter(
            (Q(sender=request.user) & Q(receiver=friend_user)) | 
            (Q(receiver=request.user) & Q(sender=friend_user))
        ).exists()
        
        if not is_friend:
            return Response(
                {"error": "This user is not your friend"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserSerializer(friend_user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AllSuggestionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        friendships = Friendship.objects.filter(
            status=Friendship.ACCEPTED
        ).filter(
            Q(sender=request.user) | Q(receiver=request.user)
        )
        friend_ids = [
            friendship.receiver.id if friendship.sender == request.user else friendship.sender.id
            for friendship in friendships
        ]
        pending_invitations = Friendship.objects.filter(
            status=Friendship.PENDING
        ).filter(
            Q(sender=request.user) | Q(receiver=request.user)
        )
        pending_ids = [
            friendship.receiver.id if friendship.sender == request.user else friendship.sender.id
            for friendship in pending_invitations
        ]
        users = User.objects.exclude(id=request.user.id).exclude(id__in=friend_ids).exclude(id__in=pending_ids)

        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



class SendFriendRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, to_user_id):
        to_user = get_object_or_404(User, id=to_user_id)

        if to_user == request.user:
            return Response(
                {"error": "Cannot send request to yourself"},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        existing_request = Friendship.objects.filter(
            sender=request.user, receiver=to_user
        ).first() or Friendship.objects.filter(
            sender=to_user, receiver=request.user
        ).first()

        if existing_request:
            if existing_request.status == Friendship.PENDING:
                return Response(
                    {"message": "Friend request already sent"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if existing_request.status == Friendship.ACCEPTED:
                return Response(
                    {"message": "Already friends"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        friendship = Friendship.objects.create(
            sender=request.user,
            receiver=to_user,
            status=Friendship.PENDING
        )

        Notification.objects.create(
            recipient=to_user,
            sender=request.user,
            notification_type='friend_request'
        )
        serializer = FriendshipSerializer(friendship)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AcceptFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, from_user_id):

        sender_user = get_object_or_404(User, id=from_user_id)


        friendship = Friendship.objects.filter(
            sender=sender_user, receiver=request.user, status=Friendship.PENDING,
        ).first()

        if not friendship:
            return Response(
                {"error": "No pending friend request found from this user"},
                status=status.HTTP_404_NOT_FOUND
            )

        friendship.status = Friendship.ACCEPTED
        friendship.save()

        Notification.objects.create(
            recipient=friendship.sender,
            sender=request.user,
            notification_type='friend_request_accepted'
        )

        sender_friend, _ = UserFriend.objects.get_or_create(user=friendship.sender)
        receiver_friend, _ = UserFriend.objects.get_or_create(user=friendship.receiver)

        sender_friend.friendships.add(friendship.receiver)
        receiver_friend.friendships.add(friendship.sender)

        serializer = FriendshipSerializer(friendship)

        return Response(
            {"message": f"You are now friends with {friendship.sender.email}",
            "friendship": serializer.data},
            status=status.HTTP_200_OK
        )


class DeclineFriendRequestReceivedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, from_user_id):
        sender_user = get_object_or_404(User, id=from_user_id)

        friendship = Friendship.objects.filter(
            sender=sender_user, receiver=request.user, status=Friendship.PENDING,
        ).first()

        if not friendship:
            return Response(
                {"error": "No pending friend request found from this user"},
                status=status.HTTP_404_NOT_FOUND
            )

        friendship.delete()

        success_message = f"Friend request from {sender_user.email} has been removed"
        return Response(
            {"message": success_message},
            status=status.HTTP_200_OK
        )

class DeclineFriendRequestSendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, to_user_id):
        receiver_user = get_object_or_404(User, id=to_user_id)

        friendship = Friendship.objects.filter(
            receiver=receiver_user, sender=request.user, status=Friendship.PENDING,
        ).first()

        if not friendship:
            return Response(
                {"error": "No pending friend request found"},
                status=status.HTTP_404_NOT_FOUND
            )

        friendship.delete()

        success_message = f"Friend request to {receiver_user.email} has been removed"
        return Response(
            {"message": success_message},
            status=status.HTTP_200_OK
        )


class FriendListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        friendships = Friendship.objects.filter(
            status=Friendship.ACCEPTED,
        ).filter(
            Q(sender=request.user) | Q(receiver=request.user)
        )

        friends = [
            friendship.receiver if friendship.sender == request.user else friendship.sender
            for friendship in friendships
        ]

        serializer = UserSerializer(friends, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class InvitationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pending_invitations = Friendship.objects.filter(
            receiver=request.user, status=Friendship.PENDING
        )

        serializer = FriendshipSerializer(pending_invitations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class RequestsSendListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pending_invitations = Friendship.objects.filter(
            sender=request.user, status=Friendship.PENDING
        )

        serializer = FriendshipSerializer(pending_invitations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

 