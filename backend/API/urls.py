from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('islogged/', views.is_logged_in),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('profile/update/', views.UpdateProfileView.as_view(), name='update_profile'),
    path('profile/password/', views.UpdatePasswordView.as_view(), name='update_password'),
    path('infoUser/', views.infoUser.as_view(), name='info_user'),
    path('checkloginmethod/', views.check_login_method, name='check_login_method'),
    path('infoUserProfile/<int:user_id>/', views.infoUserProfile.as_view(), name='info_user_profile'),
    path('rank/', views.UserRankView.as_view(), name='user_rank'),

    
    path('auth/42/login/', views.oauth_login, name='42_login'),
    path('auth/42/callback/', views.oauth_42_callback, name='42_callback'),
    path('auth/status/', views.check_auth_status, name='auth_status'),
    path('auth/verify-oauth-2fa/', views.verify_login_2fa, name='verify-oauth-2fa'),
    
    path('2fa/enable/', views.enable_2fa, name='enable_2fa'),
    path('2fa/verify/', views.verify_2fa, name='verify_2fa'),
    path('2fa/validate/', views.validate_2fa, name='validate_2fa'),
    path('2fa/disable/', views.disable_2fa, name='disable_2fa'),
    path('2fa/status/', views.two_factor_status, name='2fa_status'),
    
    path('verify-login-2fa/', views.verify_login_2fa, name='verify-login-2fa'),
]