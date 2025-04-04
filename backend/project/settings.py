# Standard Django imports
import os
from pathlib import Path

# Set base directory for project
BASE_DIR = Path(__file__).resolve().parent.parent

# Security settings from environment variables
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')  # Django's secret key
DOMAIN_NAME = os.getenv('DOMAIN_NAME')  # Domain for the application
DEBUG = os.getenv('DEBUG', 'False') == 'True'  # Debug mode toggle

ALLOWED_HOSTS = [
    DOMAIN_NAME,
]

# Media files configuration
MEDIA_URL = '/media/'  # URL prefix for media files
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')  # Physical location of media files

# Installed applications
INSTALLED_APPS = [
    'daphne',  # ASGI server for Django

    # Default Django apps
    'django.contrib.admin',         
    'django.contrib.auth',         
    'django.contrib.contenttypes',  
    'django.contrib.sessions',     
    'django.contrib.messages',      
    'django.contrib.staticfiles',  

    # Custom apps
    'API.apps.ApiConfig',
    'chat',
    'friends',
    'game',
    'notifications',

    # Third-party apps
    'rest_framework',  # REST framework
    'rest_framework_simplejwt',  # JWT authentication     
    'rest_framework_simplejwt.token_blacklist',  # JWT token blacklisting
    'corsheaders',  # Handle CORS                  
    'social_django',  # Social authentication            
    'channels',  # WebSocket support
]

# Middleware configuration
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CORS handling
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# Session and CORS settings
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
CSRF_TRUSTED_ORIGINS = [
    f'https://{DOMAIN_NAME}'  # Trusted origins for CSRF
]
CORS_ALLOW_CREDENTIALS = True  # Allow credentials in CORS
CORS_ALLOWED_ORIGINS = [
    f'https://{DOMAIN_NAME}'  # Allowed CORS origins
]

# Authentication configuration
AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend', 
)

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'project.cookieJwtAuthentication.CookieJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    )
}

# 42 OAuth Configuration
FORTY_TWO_CLIENT_ID = os.getenv('FORTY_TWO_CLIENT_ID')
FORTY_TWO_CLIENT_SECRET = os.getenv('FORTY_TWO_CLIENT_SECRET')
FORTY_TWO_REDIRECT_URI = os.getenv('FORTY_TWO_REDIRECT_URI')
SOCIAL_AUTH_FORTY_TWO_KEY = FORTY_TWO_CLIENT_ID
SOCIAL_AUTH_FORTY_TWO_SECRET = FORTY_TWO_CLIENT_SECRET

# URL and Template configuration
ROOT_URLCONF = 'project.urls'
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Application servers
WSGI_APPLICATION = 'project.wsgi.application'  # WSGI config
ASGI_APPLICATION = 'project.asgi.application'  # ASGI config

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB'),
        'USER': os.getenv('POSTGRES_USER'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),
    }
}

# Redis channel layer for WebSocket
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG":{
            "hosts": [("redis", 6379)]
        },
    },
}

# Password validation settings
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization settings
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Static files configuration
STATIC_URL = '/static/'

# Default auto field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'API.User'  # Use custom user model

# JWT settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),  # Access token expiry
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),  # Refresh token expiry    
    'ROTATE_REFRESH_TOKENS': True,  # Rotate refresh tokens                  
    'BLACKLIST_AFTER_ROTATION': True,  # Blacklist old refresh tokens              
    'ALGORITHM': 'HS256',  # JWT encryption algorithm                           
    'SIGNING_KEY': SECRET_KEY,  # Key for signing tokens                        
    'AUTH_HEADER_TYPES': ('Bearer',),  # Authorization header prefix                
    'USER_ID_FIELD': 'id',  # User ID field                          
    'USER_ID_CLAIM': 'user_id',  # User ID claim in token                    
}
