from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin, User
from django.db import models
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
            
        email = self.normalize_email(email)
        
        user = self.model(email=email, **extra_fields)

        user.set_password(password)
        
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):

    id = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True, null=False)
    
    avatar = models.ImageField(upload_to='avatars/', default='avatars/profile.jpg')

    refresh_token = models.CharField(max_length=255, blank=True)
    is_two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    first_time = models.BooleanField(default=True)

    status = models.CharField(
        max_length=20,
        choices=[
            ('ONLINE', 'Online'),
            ('OFFLINE', 'Offline'),
        ],
        default='OFFLINE'
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'
        swappable = 'AUTH_USER_MODEL' 

    def __str__(self):
        return self.email

class UserProfile(models.Model):

    id = models.AutoField(primary_key=True)

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )


    status = models.CharField(
        max_length=20,
        choices=[
            ('ONLINE', 'Online'),
            ('OFFLINE', 'Offline'),
            ('IN_GAME', 'In Game'),
            ('AWAY', 'Away')
        ],
        default='OFFLINE'
    )


    display_name = models.CharField(max_length=255, unique=True)
    first_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)


    level = models.FloatField(default=0)
    points = models.IntegerField(default=0)
    widthlvl = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    fastVictory = models.IntegerField(default=0)
    consecutiveWins = models.IntegerField(default=0)

    class Meta:
        db_table = 'user_profiles'

    def __str__(self):
        return f"{self.display_name}'s profile"

    @property
    def total_games(self):
        return self.wins + self.losses

    @property
    def win_rate(self):
        if self.total_games > 0:
            return round((self.wins / self.total_games) * 100, 2)
        return 0.0

@receiver(post_save, sender=User) 
def create_user_profile(sender, instance, created, **kwargs):

    if created:
        UserProfile.objects.create(
            user=instance,
            display_name=instance.email.split('@')[0]
        )


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
