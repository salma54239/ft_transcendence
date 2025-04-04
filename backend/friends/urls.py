from django.urls import path
from . import views

urlpatterns = [
    path('allsuggestions/', views.AllSuggestionsView.as_view(), name='all_suggestions'),
    path('send/<int:to_user_id>/', views.SendFriendRequestView.as_view(), name='send_friend_request'),
    path('accept/<int:from_user_id>/', views.AcceptFriendRequestView.as_view(), name='accept_friend_request'),
    path('declinereceived/<int:from_user_id>/', views.DeclineFriendRequestReceivedView.as_view(), name='decline_friend_request_received'),
    path('declinesend/<int:to_user_id>/', views.DeclineFriendRequestSendView.as_view(), name='decline_friend_request_send'),
    path('allfriends/', views.FriendListView.as_view(), name='list_friends'),
    path('invitations/', views.InvitationListView.as_view(), name='invitations'),
    path('requestssend/', views.RequestsSendListView.as_view(), name='requests'),
    path('frienduser/<int:friend_user_id>/', views.FriendUserDetailView.as_view(), name='friend-user-detail'),
]
