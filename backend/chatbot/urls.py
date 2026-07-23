from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth Endpoints
    path('auth/register/', views.register_user, name='register'),
    path('auth/login/', views.login_user, name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', views.get_me, name='get_me'),

    # Roadmap Endpoints
    path('roadmap/generate/', views.generate_roadmap, name='generate_roadmap'),
    path('roadmap/', views.get_roadmap, name='get_roadmap'),
    path('roadmap/items/<int:item_id>/toggle/', views.toggle_roadmap_item, name='toggle_roadmap_item'),

    # Chat Sessions & Doubt Chat Endpoints
    path('chat/sessions/', views.list_or_create_sessions, name='list_or_create_sessions'),
    path('chat/sessions/<int:session_id>/', views.delete_session, name='delete_session'),
    path('chat/', views.doubt_chat, name='doubt_chat'),

    # Quick Generators
    path('chat/flashcards/', views.generate_flashcards, name='generate_flashcards'),
    path('chat/mcqs/', views.generate_mcqs, name='generate_mcqs'),

    # Debugger Endpoints
    path('debug/', views.debug_code, name='debug_code'),

    # ATS Resume Scorer Endpoints
    path('resume/score/', views.score_resume, name='score_resume'),

    # Dashboard Stats
    path('dashboard/', views.get_dashboard_stats, name='get_dashboard_stats'),
]
