from django.db import models
from API.models import User
from django.utils import timezone
from django.db.models import Q
from notifications.models import Notification

from API.models import User 

class UserRequest(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="user_request")
    requestships = models.ManyToManyField(
        User,
        symmetrical=False,
        blank=True,
        related_name="requests_with"
    )

class Requestship(models.Model):
    PENDING = 'pending'
    ACCEPTED = 'accepted'

    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (ACCEPTED, 'Accepted'),
    ]

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_requestships")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_requestships")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

class Game(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')

    player1 = models.ForeignKey(User, on_delete=models.PROTECT, related_name='games_as_player1')
    player2 = models.ForeignKey(User, on_delete=models.PROTECT, related_name='games_as_player2')

    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)
    
    winner = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='games_as_winner')
    player1_level = models.FloatField(default=1.0)
    player2_level = models.FloatField(default=1.0)

    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    game_duration = models.IntegerField(default=0)
    tournament_round = models.IntegerField(default=0)

    WINNING_SCORE = 7
    LEVELS = [100, 200, 300]
    POINTS = 3
    

    def update_score(self, p1_id:int, p2_id:int, p1_score: int, p2_score: int):
        if self.player1.id == p1_id:
            self.player1_score = p1_score
            self.player2_score = p2_score
        elif self.player1.id == p2_id:       
            self.player1_score = p2_score
            self.player2_score = p1_score
        else:
            return False
        self.save()

        if self.player1_score >= self.WINNING_SCORE:
            self.end_game(self.player1)
        elif self.player2_score >= self.WINNING_SCORE:
            self.end_game(self.player2)

    def end_game(self, winner:User):
        self.winner = winner
        self.end_time = timezone.now()
        self.game_duration = (self.end_time - self.start_time).seconds
        self.status = "completed"
        self.save()
        self.update_winner_profile()

    def abandon_game(self, winner:User):
        if winner == self.player1:
            self.player1_score = self.WINNING_SCORE
            self.player2_score = 0
        elif winner == self.player2:
            self.player2_score = self.WINNING_SCORE
            self.player1_score = 0

        self.end_time = timezone.now()
        self.winner = winner
        self.game_duration = (self.end_time - self.start_time).seconds
        self.status = "completed"
        self.save()
        self.update_winner_profile()

    def update_winner_profile(self):
        if self.winner:
            if self.winner == self.player1:
                winner_profile = self.player1.profile
                loser_profile = self.player2.profile
            elif self.winner == self.player2:
                winner_profile = self.player2.profile
                loser_profile = self.player1.profile

            winner_profile.points += self.POINTS
            winner_profile.wins += 1
            loser_profile.losses += 1
            loser_profile.save()
            if winner_profile.points < self.LEVELS[0]:
                winner_profile.level = 0
                winner_profile.widthlvl = winner_profile.points
            elif winner_profile.points < self.LEVELS[1]:
                winner_profile.level = 1
                winner_profile.widthlvl = winner_profile.points - 100
            elif winner_profile.points < self.LEVELS[2]:
                winner_profile.level = 2
                winner_profile.widthlvl = winner_profile.points - 200
            else:
                winner_profile.level = 4
                winner_profile.widthlvl = winner_profile.points - 300

            if winner_profile.fastVictory > self.game_duration or winner_profile.fastVictory == 0:
                winner_profile.fastVictory = self.game_duration
            cons_wins = self.winnerConsecutiveWins()
            if winner_profile.consecutiveWins < cons_wins:
                winner_profile.consecutiveWins = cons_wins
            winner_profile.save()
            self.player1_level = winner_profile.level if winner_profile == self.player1 else loser_profile.level
            self.player2_level = winner_profile.level if winner_profile == self.player2 else loser_profile.level
            self.save()

    def winnerConsecutiveWins(self):
        games = Game.objects.filter(Q(player1 = self.winner) | Q(player2 = self.winner), status='completed').order_by('-id')[:20]
        cons_win = 0
        for game in games:
            if game.winner == self.winner:
                cons_win += 1
            else:
                break
        return cons_win



    def __str__(self):
        if self.player2:
            return f'Game: {self.player1.id} VS {self.player2.id}'
        return f'Game: {self.player1.id} VS (waiting for player 2)'

class Tournament(models.Model):

    player1 = models.ForeignKey(User, on_delete=models.PROTECT, related_name='player1_in_tournament')
    player2 = models.ForeignKey(User, on_delete=models.PROTECT, related_name='player2_in_tournament')
    player3 = models.ForeignKey(User, on_delete=models.PROTECT, related_name='player3_in_tournament')
    player4 = models.ForeignKey(User, on_delete=models.PROTECT, related_name='player4_in_tournament')


    def create_game_player1_vs_player2(self):
        game = Game.objects.create(
            player1=self.player1,
            player2=self.player2,
            tournament_round=1,
        )
        return game

    def create_game_player3_vs_player4(self):
        game = Game.objects.create(
            player1=self.player3,
            player2=self.player4,
            tournament_round=1,
        )
        return game

    def create_game_final(self, winner1, winner2):
        game = Game.objects.create(
            player1=winner1,
            player2=winner2,
            tournament_round=3,
        )
        Notification.objects.create(
            recipient=winner1,
            sender=winner2,
            notification_type='tournament_final'
        )
        Notification.objects.create(
            recipient=winner2,
            sender=winner1,
            notification_type='tournament_final'
        )
        return game
    
class Achievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="achievements")
    title = models.CharField(max_length=100) 
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)