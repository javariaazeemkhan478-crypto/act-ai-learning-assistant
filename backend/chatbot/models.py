from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    current_streak = models.IntegerField(default=1)
    last_active_date = models.DateField(default=timezone.now)

    def update_streak(self):
        today = timezone.now().date()
        if self.last_active_date == today:
            return
        elif self.last_active_date == today - timezone.timedelta(days=1):
            self.current_streak += 1
        else:
            self.current_streak = 1
        self.last_active_date = today
        self.save()

    def __str__(self):
        return f"{self.user.username} - {self.current_streak} day streak"

class Roadmap(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='roadmaps')
    goal = models.CharField(max_length=200)
    level = models.CharField(max_length=50) # beginner, intermediate, advanced
    hours_per_week = models.IntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)
    json_content = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.user.username} - {self.goal} ({self.level})"

class RoadmapItem(models.Model):
    roadmap = models.ForeignKey(Roadmap, on_delete=models.CASCADE, related_name='items')
    week_number = models.IntegerField(default=1)
    topic = models.CharField(max_length=255)
    subtopics = models.JSONField(default=list)
    resource_link = models.CharField(max_length=500, blank=True, default='')
    resources = models.JSONField(default=list) # 2-3 specific free resources
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"Week {self.week_number}: {self.topic} [{'Done' if self.is_completed else 'Pending'}]"

class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions')
    title = models.CharField(max_length=200, default='New Chat')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.title}"

class ChatMessage(models.Model):
    ROLE_CHOICES = [('user', 'User'), ('assistant', 'Assistant')]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    image_url = models.TextField(blank=True, default='') # Base64 or image link
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} [{self.role}]: {self.content[:40]}"

class DebugQuery(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='debug_queries')
    input_code = models.TextField()
    framework = models.CharField(max_length=100, default='Auto-Detect')
    ai_response = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - Debug {self.framework} @ {self.timestamp}"

class ResumeScan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resume_scans')
    resume_text = models.TextField()
    job_description = models.TextField(blank=True, default='')
    ats_score = models.IntegerField(default=0)
    feedback_json = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - ATS Score {self.ats_score}/100"