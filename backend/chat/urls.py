from django.urls import path
from . import views

urlpatterns = [
    path('rooms/', views.ChatRoomListCreateView.as_view(), name='chat-rooms'),
    path('rooms/<int:room_id>/messages/', views.ChatMessageListCreateView.as_view(), name='chat-room-messages'),
    path('rooms/<int:pk>/', views.ChatRoomDetailView.as_view(), name='chat-room-detail'),
    path('rooms/<int:room_id>/block/', views.BlockParticipantView.as_view(), name='block-participant'),
    path('rooms/<int:room_id>/block-status/', views.BlockStatusView.as_view(), name='block-status'),
    path('rooms/<int:room_id>/delete-messages/', views.ChatMessageListCreateView.as_view(), name='delete-messages'),
]
