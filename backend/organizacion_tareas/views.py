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
    """Valida que la fecha de nacimiento sea válida anterior al día de hoy"""
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

def validar_cedula_colombiana(cedula):
    """Valida que la cédula sea un formato válido colombiano"""

    # Remover espacios y caracteres no numéricos
    cedula_limpia = ''.join(filter(str.isdigit, str(cedula)))
    
    # Verificar que tenga entre 6 y 10 dígitos (rango válido en Colombia)
    if len(cedula_limpia) < 6 or len(cedula_limpia) > 10:
        return False, "La cédula debe tener entre 6 y 10 dígitos"
    
    # Verificar que no sea una secuencia de números iguales
    if len(set(cedula_limpia)) == 1:
        return False, "La cédula no puede ser una secuencia de números iguales"
    
    # Verificar que no comience con 0 (excepto para cédulas de menos de 8 dígitos)
    if len(cedula_limpia) >= 8 and cedula_limpia[0] == '0':
        return False, "La cédula no puede comenzar con 0"
    
    return True, cedula_limpia

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
        
        # Validacion para que el documento de identidad sea único y válido
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
# Me permite que el administrador cree usuarios directamente desde la API, y el Panel de administrador

class AdminCreateUserAPIView(APIView):
    """API View para que administradores creen usuarios directamente"""
    def post(self, request):
        # Verificar que quien hace la solicitud es admin
        admin_user_id = request.data.get('admin_user_id')
        
        try:
            admin_user = Login.objects.get(id=admin_user_id)
            if admin_user.rol != 'admin':
                return Response(
                    {'error': 'Solo los administradores pueden crear usuarios'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Login.DoesNotExist:
            return Response(
                {'error': 'Administrador no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener datos del nuevo usuario
        documento_identidad = request.data.get('documento_identidad')
        fecha_nacimiento = request.data.get('fecha_nacimiento')
        nombre_completo = request.data.get('nombre_completo')
        email = request.data.get('email')
        rol = request.data.get('rol', 'user')  # Rol por defecto
        
        # Validaciones
        if not documento_identidad or not fecha_nacimiento or not nombre_completo:
            return Response(
                {'error': 'Documento de identidad, fecha de nacimiento y nombre completo son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar cédula colombiana
        es_valida_cedula, cedula_limpia = validar_cedula_colombiana(documento_identidad)
        if not es_valida_cedula:
            return Response(
                {'error': cedula_limpia},  # cedula_limpia contiene el mensaje de error
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar documento único
        if Login.objects.filter(documento_identidad=cedula_limpia).exists():
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
        es_valida_fecha, fecha_resultado = validar_fecha_nacimiento(fecha_nacimiento)
        if not es_valida_fecha:
            return Response(
                {'error': fecha_resultado},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar rol
        roles_validos = ['user', 'admin', 'usuario', 'dev', 'dev_flask', 'dev_django']
        if rol not in roles_validos:
            return Response(
                {'error': f'Rol no válido. Roles permitidos: {", ".join(roles_validos)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Crear el nuevo usuario
            nuevo_usuario = Login.objects.create(
                documento_identidad=cedula_limpia,
                fecha_nacimiento=fecha_resultado,
                nombre_completo=nombre_completo,
                email=email if email else None,
                rol=rol,
                is_active=True  # Los usuarios creados por admin están activos por defecto
            )
            
            # Log de la acción del admin
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Admin {admin_user.nombre_completo} (ID: {admin_user.id}) creó usuario {nuevo_usuario.nombre_completo} (ID: {nuevo_usuario.id}) con rol {rol}")
            
            return Response({
                'success': True,
                'user_id': nuevo_usuario.id,
                'documento_identidad': nuevo_usuario.documento_identidad,
                'nombre_completo': nuevo_usuario.nombre_completo,
                'email': nuevo_usuario.email,
                'rol': nuevo_usuario.rol,
                'is_active': nuevo_usuario.is_active,
                'created_at': nuevo_usuario.created_at,
                'message': f'Usuario "{nombre_completo}" creado exitosamente con rol "{rol}"'
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
    
    def update(self, request, *args, **kwargs):
        """Actualizar información del usuario (especialmente el rol)"""
        try:
            instance = self.get_object()
            
            # Validar datos requeridos
            documento_identidad = request.data.get('documento_identidad')
            nombre_completo = request.data.get('nombre_completo')
            fecha_nacimiento = request.data.get('fecha_nacimiento')
            rol = request.data.get('rol')
            
            if not documento_identidad or not nombre_completo or not fecha_nacimiento:
                return Response(
                    {'error': 'Documento de identidad, nombre completo y fecha de nacimiento son requeridos'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar fecha de nacimiento
            es_valida, resultado = validar_fecha_nacimiento(fecha_nacimiento)
            if not es_valida:
                return Response(
                    {'error': resultado},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Actualizar los datos
            instance.documento_identidad = documento_identidad
            instance.nombre_completo = nombre_completo
            instance.fecha_nacimiento = resultado
            
            # Manejar email de manera segura
            email_nuevo = request.data.get('email')
            if email_nuevo is not None:
                # Si se proporciona un email vacío, establecer como null
                instance.email = email_nuevo if email_nuevo.strip() else None
            # Si no se proporciona email, mantener el valor actual
            
            if rol:
                instance.rol = rol
            
            instance.save()
            
            return Response({
                'id': instance.id,
                'documento_identidad': instance.documento_identidad,
                'nombre_completo': instance.nombre_completo,
                'email': instance.email,
                'fecha_nacimiento': instance.fecha_nacimiento,
                'rol': instance.rol,
                'message': 'Usuario actualizado exitosamente'
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error al actualizar usuario: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """Eliminar usuario"""
        try:
            instance = self.get_object()
            usuario_nombre = instance.nombre_completo
            
            # Eliminar el usuario
            instance.delete()
            
            return Response(
                {'message': f'Usuario "{usuario_nombre}" eliminado exitosamente'},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'Error al eliminar usuario: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    
    def get_queryset(self):
        """
        Endpoint mejorado para retornar tareas con jerarquía optimizada.
        
        CARACTERÍSTICAS IMPLEMENTADAS:
        - ✅ Devuelve JSON con todos los registros de tasks y sus detalles
        - ✅ Optimización para carga rápida (<300ms) con select_related
        - ✅ Ordenamiento jerárquico: tareas principales primero, luego subtareas
        - ✅ Ordenamiento por ID para lista ordenada consistente
        """
        user_id = self.request.query_params.get('user_id')
        show_all = self.request.query_params.get('show_all', 'false').lower() == 'true'
        
        # OPTIMIZACIÓN: select_related para evitar consultas N+1 y mejorar rendimiento
        # Precarga relaciones user y parent_task en una sola consulta SQL
        base_queryset = Task.objects.select_related('user', 'parent_task', 'team')
        
        if show_all:
            # ADMIN: Mostrar todas las tareas del sistema con jerarquía optimizada
            # Ordenamiento jerárquico: NULL parent_task primero (tareas principales), luego por ID
            return base_queryset.all().order_by('parent_task__id', 'id')
        elif user_id:
            # USUARIO: Mostrar solo las tareas del usuario específico con jerarquía
            # Mantiene el mismo ordenamiento jerárquico para consistencia
            return base_queryset.filter(user__id=user_id).order_by('parent_task__id', 'id')
        else:
            # DEFECTO: Mostrar todas las tareas con ordenamiento jerárquico por ID
            # Las tareas principales (parent_task=NULL) aparecen primero
            return base_queryset.all().order_by('parent_task__id', 'id')
    
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
