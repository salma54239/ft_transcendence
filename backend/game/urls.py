from django.urls import path
from . import views

urlpatterns=[
    path('update-score/<int:gameId>/', views.update_score, name='update_score'),
    path('abandon/<int:gameId>/', views.mark_game_abandonned, name='abandon_game'),
    path('send/<int:to_user_id>/', views.SendRequestView.as_view(), name='send_request'),
    path('accept/<int:from_user_id>/', views.AcceptRequestView.as_view(), name='accept_request'),
    path('declinereceived/<int:from_user_id>/', views.DeclineRequestReceivedView.as_view(), name='decline_request_received'),
    path('declinesend/<int:to_user_id>/', views.DeclineRequestSendView.as_view(), name='decline_friend_send'),
    path('invitationdetail/', views.InvitationDetailView.as_view(), name='invitation_detail'),
    path('senddetail/', views.RequestsSendDetailView.as_view(), name='send_detail'),
    path('checkgamerequeststatus/', views.checkGameRequestStatusView.as_view(), name='check_game_request_status'),
    path('checkgamerequeststatus/<int:user_id>/', views.checkGameRequestStatusView.as_view(), name='check_game_request_status'),
    path('achievements/<int:user_id>/', views.UserAchievementsView.as_view(), name='user_achievements'),
    path('gamehistory/<int:user_id>/', views.GameHistoryView.as_view(), name='game_history'),
    path('userhistory/<int:user_id>/', views.UserHistoryView.as_view(), name='user_history'),
    path('playersinfo/<int:game_id>/', views.PlayersInfoView.as_view(), name='players_info'),
    path('gamestatus/<int:game_id>/', views.CheckFinalGameStatusView.as_view(), name='status_game'),
    path('roundwinner/<int:game_id>/', views.FirstRoundsWinnerView.as_view(), name='round_game'),
    path('removerequestship/<int:game_id>/', views.RemoveRequestShipView.as_view(), name='remove_requestship'),
    path('checkuseringame/', views.CheckUserInGameView.as_view(), name='user_in_game'),
]
