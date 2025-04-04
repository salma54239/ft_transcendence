
import os
from django.conf import settings
from django.views.generic import TemplateView
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import authentication_classes
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import redirect
from .serializers import UserSerializer, UserRegistrationSerializer, UserProfileSerializer
from .models import User, UserProfile
from .oauth_utils import FortyTwoOAuth
from rest_framework_simplejwt.authentication import JWTAuthentication
import pyotp
from django.utils.timezone import now
import qrcode
from io import BytesIO
import base64
import requests
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage


from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.password_validation import validate_password
from game.models import Achievement
from django.shortcuts import get_object_or_404


@api_view(['GET'])
def check_login_method(request):

    login_method = request.session.get('login_method', None)

    if login_method == 'intra':
        return Response({'status': 'ok'}, status=200)
    else:
        return Response({'status': 'ko'}, status=200)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    refresh_token = request.COOKIES.get('refresh')
    if not refresh_token:
        return Response({'error': 'No refresh token'}, status=401)
        
    try:
        refresh = RefreshToken(refresh_token)
        access_token = str(refresh.access_token)
        
        response = Response({'message': 'Token refreshed'})
        response.set_cookie(
            'access',
            access_token,
            httponly=True,
            secure=True,
            samesite='Lax'
        )
        return response
    except:
        return Response({'error': 'Invalid refresh token'}, status=401)


@api_view(['GET'])
@permission_classes([AllowAny])
def is_logged_in(request):
    if request.user.is_authenticated:
        return Response({
            'message': 'User is authenticated',
            'user': {
                'email': request.user.email,
            }
        },status=status.HTTP_200_OK)
    return Response({'message': 'User is not authenticated'}, status=status.HTTP_200_OK)

class UserRankView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            ranked_players = User.objects.all().select_related('profile').order_by('-profile__points')

            rank_data = [
                {
                    "rank": index + 1,
                    "name": user.profile.display_name,
                    "level": user.profile.level,
                    "widthlvl": user.profile.widthlvl,
                    "avatar": user.avatar.url if user.avatar else None,
                }
                for index, user in enumerate(ranked_players)
            ]
            
            return Response(rank_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class infoUser(APIView):
    permission_classes = [IsAuthenticated]

    def assign_achievements(self, user):
        achievements = []
        
        if user.profile.level == 1:
            if not Achievement.objects.filter(user=user, title="LEVEL 1").exists():
                achievements.append(
                    Achievement.objects.create(
                        user=user,
                        title="LEVEL 1",
                        description="Reached level 1.",
                        category="lvl Achievement"
                    )
                )
            
        if user.profile.level >= 3:
            if not Achievement.objects.filter(user=user, title="LEVEL 3").exists():
                achievements.append(
                    Achievement.objects.create(
                        user=user,
                        title="LEVEL 3",
                        description="Reached level 3.",
                        category="lvl Achievement"
                    )
                )

        if user.profile.wins >= 1:
            if not Achievement.objects.filter(user=user, title="First Win").exists():
                achievements.append(
                    Achievement.objects.create(
                        user=user,
                        title="First Win",
                        description="Achieved 1 win.",
                        category="Wins Achievement"
                    )
                )

        if user.profile.wins >= 10:
            if not Achievement.objects.filter(user=user, title="10 Wins").exists():
                achievements.append(
                    Achievement.objects.create(
                        user=user,
                        title="10 Wins",
                        description="Achieved 10 win.",
                        category="Wins Achievement"
                    )
                )
        if user.profile.fastVictory <= 60 and user.profile.fastVictory > 0:
            if not Achievement.objects.filter(user=user, title="Fast victory").exists():
                achievements.append(
                    Achievement.objects.create(
                        user=user,
                        title="Fast victory",
                        description="You win in less than 60 seconds.",
                        category="fast win"
                    )
                )
        if user.profile.consecutiveWins >= 5 :
            if not Achievement.objects.filter(user=user, title="5 Consecutive wins").exists():
                achievements.append(
                    Achievement.objects.create(
                        user=user,
                        title="5 Consecutive wins",
                        description="You win 5 times in a row.",
                        category="fast win"
                    )
                )

        return achievements
    def get(self, request):
        try:
            self.assign_achievements(request.user)
            serializer = UserSerializer(request.user, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            print("Error details:", str(e))
            return Response(
                {"error": "An error occurred while fetching user information", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class infoUserProfile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:

            user = get_object_or_404(User, id=user_id)
            user_profile = user.profile
            serializer = UserProfileSerializer(user_profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "User profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        except Exception as e:
            return Response(
                {"error": "An error occurred while fetching user profile information", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if 'email' not in request.data or 'password' not in request.data:
            return Response({"error": "email and password required"}, status=400)

        user = authenticate(email=request.data.get('email'), password=request.data.get('password'))
        
        if not user:
            return Response({'message': "invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        
        response = Response({'message': 'Login successful'})
        refresh = RefreshToken.for_user(user)
        user.refresh_token = refresh
        user.status = "Online"
        user.save()
        
        response.set_cookie(
            key='access',
            value=str(refresh.access_token),
            httponly=False,
            secure=True,
            samesite='Lax',
        )
        response.set_cookie(
            key='refresh',
            value=str(refresh),
            httponly=False,
            secure=True,
            samesite='Lax',
        )

        request.session['login_method'] = 'email'
        if user.is_two_factor_enabled:
            return Response({
                'requires2FA': True,
                'user_id': user.id
            }, status=status.HTTP_200_OK)
        
        return response
    
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.status = "Offline"
        user.refresh_token = ''
        user.save()
        response = Response({'message': 'logout success'})
        response.delete_cookie('access')
        response.delete_cookie('refresh')
        return response

class RegisterView(generics.CreateAPIView):

    queryset = User.objects.all()                
    permission_classes = (AllowAny,)   
    serializer_class = UserRegistrationSerializer 
class UserProfileView(generics.RetrieveUpdateAPIView):

    permission_classes = (IsAuthenticated,) 
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user


@api_view(['GET'])                         
@permission_classes([IsAuthenticated])      
def check_auth_status(request):

    serializer = UserSerializer(request.user)
    return Response({
        'isAuthenticated': True,
        'user': serializer.data
    })

@api_view(['GET'])  # Decorator to specify this endpoint only accepts GET requests
@permission_classes([AllowAny])  # Allows any user (authenticated or not) to access this endpoint
@authentication_classes([])  # Specifies no authentication is required for this endpoint
def oauth_login(request):
    # Initialize the FortyTwoOAuth class which handles OAuth2 authentication with 42 API
    oauth = FortyTwoOAuth()
    
    # Get the authorization URL where users will be redirected to login with 42
    auth_url = oauth.get_auth_url()
    
    # Return the authorization URL in JSON format
    return Response({'auth_url': auth_url})

@api_view(['GET'])  # Decorator to specify this endpoint only accepts GET requests
@permission_classes([AllowAny])  # Allows any user (authenticated or not) to access this endpoint
@authentication_classes([])  # Specifies no authentication is required for this endpoint
def oauth_login(request):
    # Initialize the FortyTwoOAuth class which handles OAuth2 authentication with 42 API
    oauth = FortyTwoOAuth()
    
    # Get the authorization URL where users will be redirected to login with 42
    auth_url = oauth.get_auth_url()
    
    # Return the authorization URL in JSON format
    return Response({'auth_url': auth_url})

@api_view(['POST'])  # Decorator to specify this endpoint only accepts POST requests
@permission_classes([AllowAny])  # Allows any user (authenticated or not) to access this endpoint
def verify_login_2fa(request):
    # Extract user_id and 2FA code from the request data
    user_id = request.data.get('user_id')
    code = request.data.get('code')
    
    # Validate that both user_id and code are provided
    if not user_id or not code:
        return Response({'error': 'User ID and code are required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Try to find the user with the provided user_id
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        # Return error if user doesn't exist
        return Response({'error': 'Invalid user'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Check if 2FA is enabled for this user
    if not user.is_two_factor_enabled:
        return Response({'error': '2FA is not enabled for this user'}, 
                       status=status.HTTP_400_BAD_REQUEST)

    # Create TOTP object using user's secret key
    totp = pyotp.TOTP(user.two_factor_secret)
    
    # Verify if the provided code matches the generated TOTP code
    if not totp.verify(code):
        return Response({'error': 'Invalid 2FA code'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Generate new refresh token for the user
    refresh = RefreshToken.for_user(user)
    
    # Create response object with success message
    response = Response({'message': 'Login successful'})
    
    # Set access token cookie
    response.set_cookie(
        key='access',  # Cookie name
        value=str(refresh.access_token),  # JWT access token
        httponly=False,  # Allows JavaScript to access the cookie
        secure=True,  # Cookie only sent over HTTPS
        samesite='Lax'  # Cookie sent for same-site and top-level navigation
    )
    
    # Set refresh token cookie
    response.set_cookie(
        key='refresh',  # Cookie name
        value=str(refresh),  # JWT refresh token
        httponly=False,  # Allows JavaScript to access the cookie
        secure=True,  # Cookie only sent over HTTPS
        samesite='Lax'  # Cookie sent for same-site and top-level navigation
    )
    
    # Return the response with cookies set
    return response


@api_view(['GET'])  # Specifies this endpoint only accepts GET requests
@permission_classes([AllowAny])  # Allows access without authentication
@authentication_classes([])  # No authentication required
def oauth_42_callback(request):
    try:
        # Get authorization code from query parameters
        code = request.GET.get('code')
        # Get domain name from environment variables
        domain_name = os.getenv('DOMAIN_NAME')

        # Check if domain name exists in environment variables
        if not domain_name:
            return redirect('/error')
        # Check if authorization code was provided
        if not code:
            return redirect(f'https://{domain_name}/logincallback?status=failed')

        # Initialize OAuth handler and get access token
        oauth = FortyTwoOAuth()
        token_data = oauth.get_access_token(code)
        access_token = token_data.get('access_token')
        # Get user information using access token
        user_info = oauth.get_user_info(access_token)

        # Extract avatar URL and OAuth ID from user info
        avatar_url = user_info.get('image', {}).get('link')
        oauth_id = user_info.get('id')

        try:
            # Try to find existing user
            user = User.objects.get(id=oauth_id)
            # Update user status and refresh token
            user.status = 'Online'
            user.refresh_token = token_data.get('refresh_token', '')
            user.save()
            created = False
        except User.DoesNotExist:
            # Create new user if not found
            email = user_info.get('email')
            user = User.objects.create(
                id=oauth_id,
                email=email,
                status='Online',
                refresh_token=token_data.get('refresh_token', '')
            )
            created = True

        # Handle avatar update for new users or users without avatar
        if created or not user.avatar:
            if avatar_url:
                try:
                    # Download avatar from 42's servers
                    response = requests.get(avatar_url)
                    
                    # Save avatar to user profile
                    file_name = f"avatars/{user.id}_avatar.jpg"
                    user.avatar.save(file_name, ContentFile(response.content), save=True)
                except Exception as e:
                    print(f"Error saving avatar: {e}")
    
        # Check if 2FA is enabled for user
        if user.is_two_factor_enabled:
            return redirect(f'https://{domain_name}/verify-2fa-oauth?user_id={user.id}')
        
        # Set login method in session
        request.session['login_method'] = 'intra'
        # Generate JWT refresh token
        refresh = RefreshToken.for_user(user)
        # Create redirect response
        response = redirect(f'https://{domain_name}/logincallback?status=success')

        # Set access token cookie
        response.set_cookie(
            key='access',
            value=str(refresh.access_token),
            httponly=True,  # Cookie not accessible via JavaScript
            secure=True,    # Only sent over HTTPS
            samesite='Lax', # Moderate cross-site security
        )

        # Set refresh token cookie
        response.set_cookie(
            key='refresh',
            value=str(refresh),
            httponly=True,
            secure=True,
            samesite='Lax',
        )
        return response

    except Exception as e:
        # Handle any errors during the OAuth process
        print(f"Error in OAuth Callback: {str(e)}")
        return redirect(f'https://{domain_name}/logincallback?status=failed')
 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def two_factor_status(request):
    return Response({
        'is_enabled': request.user.is_two_factor_enabled
    })

@api_view(['POST'])  # Specifies endpoint only accepts POST requests
@permission_classes([IsAuthenticated])  # Requires user to be authenticated
@csrf_exempt  # Disables CSRF protection for this view (since we're using token auth)
def enable_2fa(request):
    # Double-check user authentication (extra security)
    if not request.user.is_authenticated:
        return Response({'error': 'User is not authenticated'}, status=401)

    # Check if 2FA is already enabled for the user
    if request.user.is_two_factor_enabled:
        return Response({'error': '2FA is already enabled'}, 
                       status=status.HTTP_400_BAD_REQUEST)

    try:
        # Generate a random secret key for TOTP
        secret = pyotp.random_base32()
        # Save the secret key to user's profile
        request.user.two_factor_secret = secret
        request.user.save()

        # Create TOTP object with the secret
        totp = pyotp.TOTP(secret)
        # Generate the URI for QR code
        # This URI contains all info needed for authenticator apps
        provisioning_uri = totp.provisioning_uri(
            request.user.email,  # User identifier
            issuer_name="Transcendence"  # App name in authenticator
        )

        # Create QR code object with specific settings
        qr = qrcode.QRCode(
            version=1,  # QR code version
            box_size=10,  # Size of each box in pixels
            border=5  # Border width
        )
        # Add the provisioning URI to QR code
        qr.add_data(provisioning_uri)
        qr.make(fit=True)  # Generate QR code with automatic size

        # Create QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        # Create in-memory buffer for image
        buffer = BytesIO()
        # Save PNG image to buffer
        img.save(buffer, format="PNG")
        # Convert image to base64 for sending to frontend
        qr_code = base64.b64encode(buffer.getvalue()).decode()

        # Return the secret and QR code to frontend
        return Response({
            'secret': secret,  # Secret key for verification
            'qr_code': qr_code  # Base64 encoded QR code image
        })

    except Exception as e:
        # Log full traceback for debugging
        import traceback
        traceback.print_exc()
        # Return generic error to user
        return Response({'error': 'Failed to enable 2FA'}, status=500)

@api_view(['POST'])  # Specifies endpoint only accepts POST requests
@permission_classes([IsAuthenticated])  # Requires user to be authenticated
def verify_2fa(request):
    # Extract verification code from request data
    code = request.data.get('code')
    
    # Check if code was provided
    if not code:
        return Response(
            {'error': 'Code is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create TOTP object using user's secret
    totp = pyotp.TOTP(request.user.two_factor_secret)
    
    # Verify if provided code matches generated TOTP code
    if totp.verify(code):
        # If code is valid, enable 2FA for user
        request.user.is_two_factor_enabled = True
        request.user.save()
        return Response({'success': True})
    
    # If code is invalid, return error
    return Response(
        {'error': 'Invalid code'}, 
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['POST'])  # Endpoint only accepts POST requests
@permission_classes([IsAuthenticated])  # User must be authenticated to access
def validate_2fa(request):
    # Extract verification code from request data
    code = request.data.get('code')
    
    # Check if verification code was provided
    if not code:
        return Response(
            {'error': 'Code is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify that 2FA is enabled for the user
    if not request.user.is_two_factor_enabled:
        return Response(
            {'error': '2FA is not enabled'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create TOTP object with user's secret key
    totp = pyotp.TOTP(request.user.two_factor_secret)
    
    # Verify if provided code matches TOTP code
    if totp.verify(code):
        return Response({'success': True})
    
    # Return error if code is invalid
    return Response(
        {'error': 'Invalid code'}, 
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_2fa(request):
    try:
        if not request.user.is_two_factor_enabled:
            return Response(
                {'error': '2FA is not enabled'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
      
        request.user.is_two_factor_enabled = False
        request.user.two_factor_secret = ''
        request.user.save()

        return Response({
            'success': True,
            'message': '2FA disabled successfully'
        })
    except Exception as e:
        return Response(
            {'error': f'Failed to disable 2FA: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        data = request.data
        username = data.get('username')
        email = data.get('email')
        avatar = request.FILES.get('avatar')
        removeAvatar = data.get('removeAvatar')

        if not email and not username and not avatar and removeAvatar == 'no':
            return Response({'error': 'Please change at least one.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if avatar:
            user.avatar = avatar
        if removeAvatar == 'yes':
            user.avatar = '/avatars/profile.jpg'
        if email:
            try:
                validate_email(email)
                if User.objects.exclude(pk=user.pk).filter(email=email).exists():
                    return Response({
                        'error': 'This email is already in use by another account.',
                        'field': 'email'
                    }, status=status.HTTP_400_BAD_REQUEST)
                user.email = email
            except ValidationError:
                return Response({'error': 'Invalid email format'}, status=status.HTTP_400_BAD_REQUEST)

        if username:
            if User.objects.exclude(pk=user.pk).filter(profile__display_name=username).exists():
                return Response({
                    'error': 'Username is already in use by another account.',
                    'field': 'username'
                }, status=status.HTTP_400_BAD_REQUEST)
            if len(username) < 3:
                return Response(
                    {'error': 'Username must be at least 3 characters long.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if len(username) > 8:
                return Response(
                    {'error': 'Username must be no more than 8 characters long.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not username.isalnum():
                return Response({'error': 'Username must be alphanumeric.'}, status=status.HTTP_400_BAD_REQUEST)
            user.profile.display_name = username

        try:
            user.save()
            return Response('Profile updated successfully', status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class UpdatePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        data = request.data
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        confirm_password = data.get('confimPassword')

        if not current_password and not new_password and not confirm_password:
            return Response({'error': 'Cannot all be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(current_password):
            return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({'error': 'New password and confirmation do not match.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            print(e.messages)
            return Response({'error': ' Password must contain at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)