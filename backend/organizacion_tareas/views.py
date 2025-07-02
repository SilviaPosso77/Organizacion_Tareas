from django.shortcuts import render
from rest_framework import viewsets
from .models import Login, taks, User, task_details, Collaborator, Notification, Report
from .serializers import LoginSerializer, TaksSerializer, UserSerializer, taskDetailsSerializer, CollaboratorSerializer, NotificationSerializer, ReportSerializer

# Create your views here.c

class LoginViewSet(viewsets.ModelViewSet):
    queryset = Login.objects.all()
    serializer_class = LoginSerializer
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
class TaksViewSet(viewsets.ModelViewSet):
    queryset = taks.objects.all()
    serializer_class = TaksSerializer
class TaskDetailsViewSet(viewsets.ModelViewSet):
    queryset = task_details.objects.all()
    serializer_class = taskDetailsSerializer    
class CollaboratorViewSet(viewsets.ModelViewSet):
    queryset = Collaborator.objects.all()
    serializer_class = CollaboratorSerializer   
class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer           
class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer

            
