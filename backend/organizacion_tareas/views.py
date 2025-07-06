from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from datetime import date, datetime
from django.utils import timezone
from .models import (
    Login, Task, User, TaskDetails, Collaborator, Notification, Report,
    Team, Calendar, TaskComment, TaskHistory
)
from .serializers import (
    LoginSerializer, TaskSerializer, UserSerializer, TaskDetailsSerializer, 
    CollaboratorSerializer, NotificationSerializer, ReportSerializer,
    TeamSerializer, CalendarSerializer, TaskCommentSerializer, TaskHistorySerializer
)

# Función de validación
def validar_fecha_nacimiento(fecha):
    """Valida que la fecha de nacimiento sea válida y anterior a hoy"""
    try:
        if isinstance(fecha, str):
            fecha_obj = datetime.strptime(fecha, '%Y-%m-%d').date()
        else:
            fecha_obj = fecha
        
        if fecha_obj >= date.today():
            return False, "La fecha de nacimiento debe ser anterior a la fecha actual"
        
        return True, fecha_obj
    except ValueError:
        return False, "Formato de fecha inválido"

# API Views para autenticación
class LoginAPIView(APIView):
    """API View para autenticación de usuarios"""
    def post(self, request):
        documento_identidad = request.data.get('documento_identidad')
        fecha_nacimiento = request.data.get('fecha_nacimiento')
        
        if not documento_identidad or not fecha_nacimiento:
            return Response(
                {'error': 'Documento de identidad y fecha de nacimiento son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            usuario = Login.objects.get(
                documento_identidad=documento_identidad,
                fecha_nacimiento=fecha_nacimiento
            )
            
            return Response({
                'user_id': usuario.id,
                'documento_identidad': usuario.documento_identidad,
                'nombre_completo': usuario.nombre_completo,
                'email': usuario.email,
                'rol': usuario.rol,
                'message': 'Login exitoso'
            })
        
        except Login.DoesNotExist:
            return Response(
                {'error': 'Credenciales incorrectas'},
                status=status.HTTP_401_UNAUTHORIZED
            )

class RegisterAPIView(APIView):
    """API View para registro de nuevos usuarios"""
    def post(self, request):
        documento_identidad = request.data.get('documento_identidad')
        fecha_nacimiento = request.data.get('fecha_nacimiento')
        nombre_completo = request.data.get('nombre_completo')
        email = request.data.get('email')
        rol = request.data.get('rol', 'user')
        
        if not documento_identidad or not fecha_nacimiento or not nombre_completo:
            return Response(
                {'error': 'Documento de identidad, fecha de nacimiento y nombre completo son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar documento único
        if Login.objects.filter(documento_identidad=documento_identidad).exists():
            return Response(
                {'error': 'Ya existe un usuario con este documento de identidad'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar email único si se proporciona
        if email and Login.objects.filter(email=email).exists():
            return Response(
                {'error': 'Ya existe un usuario con este email'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar fecha de nacimiento
        es_valida, resultado = validar_fecha_nacimiento(fecha_nacimiento)
        if not es_valida:
            return Response(
                {'error': resultado},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            nuevo_usuario = Login.objects.create(
                documento_identidad=documento_identidad,
                fecha_nacimiento=resultado,
                nombre_completo=nombre_completo,
                email=email,
                rol=rol
            )
            
            return Response({
                'user_id': nuevo_usuario.id,
                'documento_identidad': nuevo_usuario.documento_identidad,
                'nombre_completo': nuevo_usuario.nombre_completo,
                'email': nuevo_usuario.email,
                'rol': nuevo_usuario.rol,
                'message': 'Usuario registrado exitosamente'
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'error': f'Error al crear usuario: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ViewSets
class LoginViewSet(viewsets.ModelViewSet):
    queryset = Login.objects.all()
    serializer_class = LoginSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return Task.objects.filter(user__id=user_id).order_by('order', 'created_at')
        return Task.objects.all().order_by('order', 'created_at')
    
    def perform_create(self, serializer):
        user_id = self.request.data.get('user_id')
        if user_id:
            try:
                login_user = Login.objects.get(id=user_id)
                serializer.save(user=login_user)
            except Login.DoesNotExist:
                serializer.save()
        else:
            serializer.save()
    
    def perform_update(self, serializer):
        user_id = self.request.data.get('user_id')
        if user_id:
            try:
                login_user = Login.objects.get(id=user_id)
                serializer.save(user=login_user)
            except Login.DoesNotExist:
                serializer.save()
        else:
            serializer.save()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class TaskDetailsViewSet(viewsets.ModelViewSet):
    queryset = TaskDetails.objects.all()
    serializer_class = TaskDetailsSerializer

class CollaboratorViewSet(viewsets.ModelViewSet):
    queryset = Collaborator.objects.all()
    serializer_class = CollaboratorSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return Notification.objects.filter(user__id=user_id).order_by('-created_at')
        return Notification.objects.all().order_by('-created_at')

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return Report.objects.filter(user__id=user_id).order_by('-created_at')
        return Report.objects.all().order_by('-created_at')

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return Team.objects.filter(members__id=user_id).order_by('-created_at')
        return Team.objects.all().order_by('-created_at')

class CalendarViewSet(viewsets.ModelViewSet):
    queryset = Calendar.objects.all()
    serializer_class = CalendarSerializer
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return Calendar.objects.filter(user__id=user_id).order_by('start_date')
        return Calendar.objects.all().order_by('start_date')

class TaskCommentViewSet(viewsets.ModelViewSet):
    queryset = TaskComment.objects.all()
    serializer_class = TaskCommentSerializer
    
    def get_queryset(self):
        task_id = self.request.query_params.get('task_id')
        if task_id:
            return TaskComment.objects.filter(task__id=task_id).order_by('-created_at')
        return TaskComment.objects.all().order_by('-created_at')
    
    def perform_create(self, serializer):
        user_id = self.request.data.get('user_id')
        if user_id:
            try:
                login_user = Login.objects.get(id=user_id)
                serializer.save(user=login_user)
            except Login.DoesNotExist:
                serializer.save()
        else:
            serializer.save()

class TaskHistoryViewSet(viewsets.ModelViewSet):
    queryset = TaskHistory.objects.all()
    serializer_class = TaskHistorySerializer
    
    def get_queryset(self):
        task_id = self.request.query_params.get('task_id')
        if task_id:
            return TaskHistory.objects.filter(task__id=task_id).order_by('-timestamp')
        return TaskHistory.objects.all().order_by('-timestamp')
