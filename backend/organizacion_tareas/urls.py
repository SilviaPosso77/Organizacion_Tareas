from django.urls import path, include
from rest_framework import routers
from django.contrib import admin
from .views import (
    LoginViewSet, TaskViewSet, UserViewSet, TaskDetailsViewSet, 
    CollaboratorViewSet, NotificationViewSet, ReportViewSet, 
    RegisterAPIView, LoginAPIView, TeamViewSet, CalendarViewSet,
    TaskCommentViewSet, TaskHistoryViewSet
)

router = routers.DefaultRouter()
router.register(r'login', LoginViewSet)
router.register(r'task', TaskViewSet)
router.register(r'user', UserViewSet)
router.register(r'task_details', TaskDetailsViewSet)
router.register(r'collaborator', CollaboratorViewSet)   
router.register(r'notification', NotificationViewSet)
router.register(r'report', ReportViewSet)
router.register(r'team', TeamViewSet)
router.register(r'calendar', CalendarViewSet)
router.register(r'comment', TaskCommentViewSet)
router.register(r'history', TaskHistoryViewSet)

urlpatterns = [
    # Router URLs - incluye todos los ViewSets
    path('', include(router.urls)),
    
    # Autenticación
    path('auth/login/', LoginAPIView.as_view(), name='login'),
    path('auth/register/', RegisterAPIView.as_view(), name='register'),
]
