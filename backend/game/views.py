
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Game, Achievement
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from .serializers import GameSerializer
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Requestship, UserRequest, User
from API.serializers import UserSerializer
from rest_framework import status
from .serializers import RequestshipSerializer, AchievementSerializer
from notifications.models import Notification

class SendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, to_user_id):
        to_user = get_object_or_404(User, id=to_user_id)
        
        request_is_sended = Requestship.objects.filter(
            sender=request.user
        ).exists()

        if request_is_sended:
            return Response(
                {'status': 'Only one request can be sent unless you cancel it!'}, status=200
            )

        request_is_received = Requestship.objects.filter(
            receiver=request.user
        ).exists()

        if request_is_received:
            return Response(
                {'status': 'You are already invited to a game!'}, status=200
            )

        any_active_request = Requestship.objects.filter(
            Q(sender=to_user) | Q(receiver=to_user)
        ).exists()

        if any_active_request:
            return Response(
                {'status': 'This user already part in another game'}, status=200
            )
        requestship = Requestship.objects.create(
            sender=request.user,
            receiver=to_user,
            status=Requestship.PENDING
        )

        Notification.objects.create(
            recipient=to_user,
            sender=request.user,
            notification_type='game_request'
        )
        serializer = RequestshipSerializer(requestship)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    

class AcceptRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, from_user_id):

        sender_user = get_object_or_404(User, id=from_user_id)


        requestship = Requestship.objects.filter(
            sender=sender_user, receiver=request.user, status=Requestship.PENDING,
        ).first()

        if not requestship:
            return Response(
                {"error": "No pending request found from this user"},
                status=status.HTTP_404_NOT_FOUND
            )

        requestship.status = Requestship.ACCEPTED
        requestship.save()

        Notification.objects.create(
            recipient=requestship.sender,
            sender=request.user,
            notification_type='game_request_accepted'
        )


        sender_request, _ = UserRequest.objects.get_or_create(user=requestship.sender)
        receiver_request, _ = UserRequest.objects.get_or_create(user=requestship.receiver)

        sender_request.requestships.add(requestship.receiver)
        receiver_request.requestships.add(requestship.sender)

        serializer = RequestshipSerializer(requestship)
        return Response(
            {"message": f"You can now start game with {requestship.sender.email}",
            "friendship": serializer.data},
            status=status.HTTP_200_OK
        )
    
class DeclineRequestReceivedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, from_user_id):
        sender_user = get_object_or_404(User, id=from_user_id)

        requestship = Requestship.objects.filter(
            sender=sender_user, receiver=request.user, status=Requestship.PENDING,
        ).first()

        if not requestship:
            return Response(
                {"error": "No pending request found from this user"},
                status=status.HTTP_404_NOT_FOUND
            )

        requestship.delete()
        success_message = f"Request from {sender_user.email} has been removed"
        return Response(
            {"message": success_message},
            status=status.HTTP_200_OK
        )

class DeclineRequestSendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, to_user_id):
        receiver_user = get_object_or_404(User, id=to_user_id)

        requestship = Requestship.objects.filter(
            receiver=receiver_user, sender=request.user, status=Requestship.PENDING,
        ).first()

        if not requestship:
            return Response(
                {"error": "No pending request found"},
                status=status.HTTP_404_NOT_FOUND
            )

        requestship.delete()
        success_message = f"Request to {receiver_user.email} has been removed"
        return Response(
            {"message": success_message},
            status=status.HTTP_200_OK
        )
    
class InvitationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pending_invitations = Requestship.objects.filter(
            receiver=request.user, status=Requestship.PENDING
        )

        serializer = RequestshipSerializer(pending_invitations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    
class RequestsSendDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pending_invitations = Requestship.objects.filter(
            sender=request.user, status=Requestship.PENDING
        )

        serializer = RequestshipSerializer(pending_invitations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class checkGameRequestStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id=None):
        
        if user_id:
            user = get_object_or_404(User, id=user_id)
        
        checkstatus = Requestship.objects.filter( (Q(receiver=user) & Q(sender=request.user)) |
                                                 (Q(receiver=request.user) & Q(sender=user)), 
                                                 Q(status=Requestship.PENDING) | 
                                                 Q(status=Requestship.ACCEPTED)).exists()

        if checkstatus:
            return Response({'status': 'ok'}, status=200)
        else:
            return Response({'status': 'ko'}, status=200)
        

class CheckUserInGameView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        active = Game.objects.filter(
            Q(player1=request.user) | Q(player2=request.user),
            status="active",
        )
        if active.exists():
            return Response(
                {"message": "Active game"},
                status=status.HTTP_200_OK
            )
        return Response(
            {"message": "Game not found"},
            status=status.HTTP_200_OK
        )

class CheckFinalGameStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, game_id):
        try:
            if not Game.objects.filter(id=game_id).exists():
                return Response(
                    {"message": "completed game"},
                    status=status.HTTP_200_OK
                )
            game = Game.objects.get(id=game_id)
            if game and not (game.player1 == request.user or game.player2 == request.user) :  
                return Response(
                    {"message": "completed game"},
                    status=status.HTTP_200_OK
                )
            active = Game.objects.filter(
                Q(player1=request.user) | Q(player2=request.user),
                id=game_id,
                status="active",
                tournament_round=3,
            )
            if active.exists():
                return Response(
                    {"message": "Active final game"},
                    status=status.HTTP_200_OK
                )
            if Game.objects.filter(
                Q(player1=request.user) | Q(player2=request.user),
                id=game_id,
                status="completed" ).exists():
                return Response(
                    {"message": "completed game"},
                    status=status.HTTP_200_OK
                )
            return Response(
                {"message": "No matching game found"},
                status=status.HTTP_200_OK
            )
        except Game.DoesNotExist:
            return Response(
                {"message": "Game not found"},
                status=status.HTTP_200_OK
            )
class FirstRoundsWinnerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, game_id):
        active = Game.objects.filter(
            Q(winner=request.user),
            id=game_id,
            status="completed",
            tournament_round=1,
        )

        if active.exists():
            return Response(
                {"message": "ok"},
                status=status.HTTP_200_OK
            )
        return Response(
                {"message": "ko"},
                status=status.HTTP_200_OK
            )

class UserAchievementsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            achievements = Achievement.objects.filter(user__id=user_id)
            
            if not achievements.exists():
                return Response(
                    {"message": "No achievements found for this user."},
                    status=status.HTTP_200_OK
                )

            serializer = AchievementSerializer(achievements, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Achievement.DoesNotExist:
            return Response(
                {"message": "Achievements not found."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class GameHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            user = get_object_or_404(User, id=user_id)

            completed_games = Game.objects.filter(
                Q(player1=user) | Q(player2=user),
                status="completed"
            ).select_related('player1__profile', 'player2__profile').order_by('-id')[:20] 

            game_data = []
            for game in completed_games:
                game_data.append({
                    "id": game.id,
                    "nameW": game.player1.profile.display_name if request.user == game.player1 else game.player2.profile.display_name,
                    "nameL": game.player2.profile.display_name if request.user == game.player1 else game.player1.profile.display_name,
                    "avatarW": request.build_absolute_uri(game.player1.avatar.url) if request.user == game.player1 else request.build_absolute_uri(game.player2.avatar.url),
                    "avatarL": request.build_absolute_uri(game.player2.avatar.url) if request.user == game.player1 else request.build_absolute_uri(game.player1.avatar.url),
                    "date": game.end_time.strftime("%Y-%m-%d %H:%M:%S") if game.end_time else None,
                    "scoreW": game.player1_score if request.user == game.player1 else game.player2_score,
                    "scoreL": game.player2_score if request.user == game.player1 else game.player1_score, 
                })

            return Response(game_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            user = get_object_or_404(User, id=user_id)

            games = Game.objects.filter(
                Q(player1=user) | Q(player2=user),
                status="completed"
            ).select_related('player1__profile', 'player2__profile').order_by('-id')[:20] 

            if not games:
                return Response({"message": "No completed games found for this user."}, status=status.HTTP_200_OK)

            game_history = []
            for game in games:
                if game.player1 == user:
                    player = game.player1
                else:
                    player = game.player2

                game_history.append({
                    "id": game.id,
                    "result": "Win" if game.winner == user else "Lose",
                    "date": game.end_time,
                    "avatar": request.build_absolute_uri(player.avatar.url) if player.avatar else None,
                    "score": game.player1_score if player == game.player1 else game.player2_score,
                    "widthlvl": player.profile.widthlvl,
                    "date": game.end_time.strftime("%Y-%m-%d %H:%M:%S") if game.end_time else None,
                })


            return Response(game_history, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Error: {str(e)}")
            return Response(
                {"error": "An error occurred while fetching user history", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PlayersInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, game_id):
        try:

            game = Game.objects.get(id=game_id)
            serializer1 = UserSerializer(game.player1)
            serializer2 = UserSerializer(game.player2)

            return Response({
                'player1': serializer1.data,
                'player2': serializer2.data
                },
                status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class RemoveRequestShipView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, game_id):
        game = Game.objects.get(id=game_id)

        requestship = Requestship.objects.filter( (Q(receiver=game.player1) | Q(sender=game.player2)) |
                                                 (Q(receiver=game.player2) | Q(sender=game.player1)),
                                                 Q(status=Requestship.ACCEPTED))
        if requestship.exists():
            requestship.delete()
            return Response({
                'message': "Requestship deleted successfully."
                },
                status=status.HTTP_200_OK)
        return Response({
           'message': "Requestship not found."
           },
           status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_score(request, gameId):
    if request.method == 'POST':
        p1_id= request.data.get('player1_id')
        p2_id= request.data.get('player2_id')
        p1_score = request.data.get('player1_score')
        p2_score = request.data.get('player2_score')
        if p1_id == None or p2_id == None or p1_score == None or p2_score == None:
            return Response({'success':False, 'error':'Required fields are missing.'}, status=400)
        try:
            game = Game.objects.get(id=gameId)
        except Game.DoesNotExist:
            return Response({"success":False, "error":"game not found."}, status=404)
        if game.status == 'completed':
            return Response({'success': False, 'message': 'You Cannot update the score for a completed game.'}, status=status.HTTP_200_OK)
        game.update_score(p1_id, p2_id, p1_score, p2_score)
        serializer = GameSerializer(game)
        return Response({
        'success': True,
        'game': serializer.data,
        })
    else:
        return Response({"success":False, "error":"Invalid request method."}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mark_game_abandonned( request, gameId):
    if request.method == 'GET':
        try:
            game = Game.objects.get(id=gameId, status="active")
            game.abandon_game(request.user)
            return Response({"success": True})
        except Game.DoesNotExist:
            return Response({"success": False, "error": "game not found."}, status=404)
    return Response({"success": False, "error": "Invalid request method."}, status=405)

























