from django.shortcuts import render
from rest_framework import viewsets
from .models import Login, taks, User, task_details, Collaborator, Notification, Report
from .serializers import LoginSerializer, TaksSerializer, UserSerializer, taskDetailsSerializer, CollaboratorSerializer, NotificationSerializer, ReportSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.contrib.auth.models import User

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

    
class LoginAPIView(APIView):
    def post(self, request):
        documento = request.data.get('documento_identidad')
        fecha = request.data.get('fecha_nacimiento')

        try:
            usuario = Login.objects.get(documento_identidad=documento, fecha_nacimiento=fecha)
            return Response({"message": "Login exitoso", "user_id": usuario.id}, status=status.HTTP_200_OK)
        except Login.DoesNotExist:
            return Response({"error": "Credenciales incorrectas"}, status=status.HTTP_401_UNAUTHORIZED)