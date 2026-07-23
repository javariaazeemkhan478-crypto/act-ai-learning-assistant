from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Roadmap, RoadmapItem, ChatSession, ChatMessage, DebugQuery, ResumeScan

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['current_streak', 'last_active_date']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        UserProfile.objects.create(user=user)
        return user

class RoadmapItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapItem
        fields = ['id', 'week_number', 'topic', 'subtopics', 'resource_link', 'resources', 'is_completed']

class RoadmapSerializer(serializers.ModelSerializer):
    items = RoadmapItemSerializer(many=True, read_only=True)

    class Meta:
        model = Roadmap
        fields = ['id', 'goal', 'level', 'hours_per_week', 'created_at', 'json_content', 'items']

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'session', 'role', 'content', 'image_url', 'timestamp']

class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at', 'updated_at', 'messages']

class DebugQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = DebugQuery
        fields = ['id', 'input_code', 'framework', 'ai_response', 'timestamp']

class ResumeScanSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeScan
        fields = ['id', 'resume_text', 'job_description', 'ats_score', 'feedback_json', 'created_at']