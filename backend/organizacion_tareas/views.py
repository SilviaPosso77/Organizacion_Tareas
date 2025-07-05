from django.shortcuts import render
from rest_framework import viewsets
from .models import Login, Task, TaskDetails, Collaborator, Notification, Report, User
from .serializers import (LoginSerializer, TaskSerializer, UserSerializer, TaskDetailsSerializer, CollaboratorSerializer, NotificationSerializer, ReportSerializer
      )   

#from .serializers import LoginSerializer, TaskSerializer, UserSerializer, taskDetailsSerializer, CollaboratorSerializer, NotificationSerializer, ReportSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

# Create your views here.c

class LoginViewSet(viewsets.ModelViewSet):
    queryset = Login.objects.all()
    serializer_class = LoginSerializer
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
class TaskDetailsViewSet(viewsets.ModelViewSet):
    queryset = TaskDetails.objects.all()
    serializer_class = TaskDetailsSerializer    
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

        if not documento or not fecha:
            return Response({"error": "Documento de identidad y fecha de nacimiento son requeridos"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Convertir fecha string a objeto date si es necesario
            if isinstance(fecha, str):
                from datetime import datetime
                fecha = datetime.strptime(fecha, '%Y-%m-%d').date()
            
            usuario = Login.objects.get(documento_identidad=documento, fecha_nacimiento=fecha)
            return Response({"message": "Login exitoso", "user_id": usuario.id}, status=status.HTTP_200_OK)
        except Login.DoesNotExist:
            return Response({"error": "Credenciales incorrectas"}, status=status.HTTP_401_UNAUTHORIZED)
        except ValueError:
            return Response({"error": "Formato de fecha inválido"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Error interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        
class RegisterAPIView(APIView):
    def post(self, request):
        documento = request.data.get('documento_identidad')
        fecha = request.data.get('fecha_nacimiento')
        nombre = request.data.get('nombre_completo')

        if not documento or not fecha:
            return Response({"error": "Documento de identidad y fecha de nacimiento son requeridos"}, status=status.HTTP_400_BAD_REQUEST)

        # Verificar si el usuario ya existe
        if Login.objects.filter(documento_identidad=documento).exists():
            return Response({"error": "El usuario ya existe"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Convertir fecha string a objeto date si es necesario
            if isinstance(fecha, str):
                from datetime import datetime
                fecha = datetime.strptime(fecha, '%Y-%m-%d').date()
            
            usuario = Login.objects.create(
                documento_identidad=documento, 
                fecha_nacimiento=fecha,
                nombre_completo=nombre or ''
            )
            return Response({"message": "Registro exitoso", "user_id": usuario.id}, status=status.HTTP_201_CREATED)
        except ValueError:
            return Response({"error": "Formato de fecha inválido"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Error interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)