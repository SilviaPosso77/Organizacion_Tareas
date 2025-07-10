from django.db import models
from datetime import date, datetime
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver



class Login(models.Model):
    ROL_CHOICES = [
        ('user', 'Usuario'),
        ('admin', 'Administrador'),
        ('manager', ''),#Antes tenía gerente en manager- 
    ]
    
    id = models.SmallAutoField(primary_key=True)
    documento_identidad = models.CharField(max_length=20, default='000000', unique=True)  # Documento único
    fecha_nacimiento = models.DateField(default='2000-01-01')  
    nombre_completo = models.CharField(max_length=200, blank=True, null=True)  
    email = models.EmailField(max_length=255, unique=True, null=True, blank=True)  
    rol = models.CharField(max_length=10, choices=ROL_CHOICES, default='user')  
    is_active = models.BooleanField(default=True)  # Para activar/desactivar usuarios
    # profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)  # Foto de perfil (comentado por Pillow)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre_completo} ({self.rol})"

    class Meta:
        db_table = 'login'


class Team(models.Model):
    """Modelo para equipos de trabajo"""
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    description = models.TextField(max_length=500, blank=True, null=True)
    created_by = models.ForeignKey(Login, on_delete=models.CASCADE, related_name='teams_created')
    members = models.ManyToManyField(Login, related_name='teams', blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'team'


class Task(models.Model):
    CATEGORY_CHOICES = [
        ('principal', 'Principal'),
        ('subtarea', 'Subtarea'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Baja'),
        ('medium', 'Media'),
        ('high', 'Alta'),
        ('urgent', 'Urgente'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('in_progress', 'En Progreso'),
        ('completed', 'Completada'),
        ('cancelled', 'Cancelada'),
        ('on_hold', 'En Espera'),
    ]
    
    id = models.AutoField(primary_key=True)
    task = models.CharField(max_length=200)
    user = models.ForeignKey(Login, on_delete=models.CASCADE, null=True, blank=True, related_name='tasks')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, null=True, blank=True, related_name='tasks')  # Tareas de equipo
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='principal')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    due_date = models.DateField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)  # Fecha de inicio
    description = models.TextField(max_length=500, blank=True, null=True)
    parent_task = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')
    order = models.IntegerField(default=0)
    progress = models.IntegerField(default=0)  # Progreso en porcentaje (0-100)
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # Horas estimadas
    actual_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # Horas reales
    tags = models.CharField(max_length=200, blank=True, null=True)  # Etiquetas separadas por comas
    # attachment = models.FileField(upload_to='task_attachments/', null=True, blank=True)  # Archivos adjuntos (comentado por simplicidad)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'created_at']
        db_table = 'task'
    
    def __str__(self):
        return self.task

    @property
    def is_overdue(self):
        """Verifica si la tarea está vencida"""
        if self.due_date and self.status != 'completed':
            return date.today() > self.due_date
        return False

    @property
    def days_until_due(self):
        """Calcula días hasta vencimiento"""
        if self.due_date:
            return (self.due_date - date.today()).days
        return None

    def get_subtasks(self):
        """Obtiene todas las subtareas"""
        return self.subtasks.all()

    def get_completion_percentage(self):
        """Calcula porcentaje de completación incluyendo subtareas"""
        if self.subtasks.exists():
            total_subtasks = self.subtasks.count()
            completed_subtasks = self.subtasks.filter(status='completed').count()
            return (completed_subtasks / total_subtasks) * 100 if total_subtasks > 0 else 0
        return self.progress

    def clean(self):
        """
        ✅ VALIDACIONES PARA SUBTAREAS: Implementa reglas de jerarquía
        - Solo tareas principales pueden tener subtareas
        - Profundidad máxima de 1 nivel
        - Validación de categorías coherentes
        """
        from django.core.exceptions import ValidationError
        
        # Validar que las subtareas solo tengan tareas principales como padres
        if self.parent_task and self.parent_task.category != 'principal':
            raise ValidationError(
                'Las subtareas solo pueden tener tareas principales como padres.'
            )
        
        # Validar que las subtareas no puedan tener hijos (máximo 1 nivel)
        if self.parent_task and self.parent_task.parent_task:
            raise ValidationError(
                'No se permite más de un nivel de profundidad en las subtareas.'
            )
        
        # Validar coherencia: si tiene parent_task, debe ser subtarea
        if self.parent_task and self.category != 'subtarea':
            raise ValidationError(
                'Las tareas con parent_task deben tener category="subtarea".'
            )
        
        # Validar coherencia: si es subtarea, debe tener parent_task
        if self.category == 'subtarea' and not self.parent_task:
            raise ValidationError(
                'Las subtareas deben tener un parent_task asignado.'
            )

    def save(self, *args, **kwargs):
        """Ejecutar validaciones antes de guardar"""
        self.clean()
        super().save(*args, **kwargs)


#User de la aplicacion - MODELO LEGACY (se puede eliminar después)
class User(models.Model):
    ROL_CHOICES = [
        ('user', 'User'),
        ('admin', 'Admin'),
    ]
    
    id = models.AutoField(primary_key=True)
    Login = models.ForeignKey('Login', on_delete=models.CASCADE, db_column='login_id')
    nombre = models.CharField(max_length=100)
    email = models.CharField(max_length=255, unique=True)
    rol = models.CharField(max_length=10, choices=ROL_CHOICES)

    def __str__(self):
        return self.nombre


# MODELO LEGACY - se puede eliminar después (funcionalidad incluida en Task)
class TaskDetails(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    id = models.AutoField(primary_key=True)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    category = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.task.task} ({self.status})"


class Calendar(models.Model):
    """Modelo para eventos de calendario"""
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=200)
    description = models.TextField(max_length=500, blank=True, null=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    all_day = models.BooleanField(default=False)
    user = models.ForeignKey(Login, on_delete=models.CASCADE, related_name='calendar_events')
    task = models.ForeignKey(Task, on_delete=models.CASCADE, null=True, blank=True, related_name='calendar_events')
    color = models.CharField(max_length=7, default='#007bff')  # Color hex
    reminder_minutes = models.IntegerField(null=True, blank=True)  # Minutos antes del evento
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(max_length=50, blank=True, null=True)  # daily, weekly, monthly
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.start_date.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        ordering = ['start_date']
        db_table = 'calendar'


class Collaborator(models.Model):
    """Modelo para colaboradores en tareas"""
    ROLE_CHOICES = [
        ('owner', 'Propietario'),
        ('editor', 'Editor'),
        ('viewer', 'Observador'),
    ]
    
    id = models.AutoField(primary_key=True)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='collaborators')
    user = models.ForeignKey(Login, on_delete=models.CASCADE, related_name='collaborations')
    assigned_by = models.ForeignKey(Login, on_delete=models.CASCADE, related_name='assigned_tasks')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='viewer')
    assigned_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(max_length=500, blank=True, null=True)

    def __str__(self):
        return f"{self.user.nombre_completo} - {self.task.task} ({self.role})"

    class Meta:
        unique_together = ['task', 'user']
        db_table = 'collaborator'


class Notification(models.Model):
    """Modelo para notificaciones"""
    TYPE_CHOICES = [
        ('task_assigned', 'Tarea Asignada'),
        ('task_due', 'Tarea Vencida'),
        ('task_completed', 'Tarea Completada'),
        ('task_updated', 'Tarea Actualizada'),
        ('reminder', 'Recordatorio'),
        ('team_invite', 'Invitación a Equipo'),
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Login, on_delete=models.CASCADE, related_name='notifications')
    task = models.ForeignKey(Task, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.CharField(max_length=500)
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='reminder')
    is_read = models.BooleanField(default=False)
    is_sent = models.BooleanField(default=False)
    send_email = models.BooleanField(default=False)
    scheduled_for = models.DateTimeField(null=True, blank=True)  # Para programar notificaciones
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.nombre_completo} - {self.title}"

    class Meta:
        ordering = ['-created_at']
        db_table = 'notification'


class Report(models.Model):
    """Modelo para reportes de productividad"""
    REPORT_TYPE_CHOICES = [
        ('daily', 'Diario'),
        ('weekly', 'Semanal'),
        ('monthly', 'Mensual'),
        ('custom', 'Personalizado'),
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Login, on_delete=models.CASCADE, related_name='reports')
    report_type = models.CharField(max_length=10, choices=REPORT_TYPE_CHOICES, default='weekly')
    total_tasks = models.IntegerField(default=0)
    completed_tasks = models.IntegerField(default=0)
    overdue_tasks = models.IntegerField(default=0)
    in_progress_tasks = models.IntegerField(default=0)
    productivity_score = models.FloatField(default=0.0)
    total_hours = models.DecimalField(max_digits=8, decimal_places=2, default=0.0)
    period_start = models.DateField()
    period_end = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Reporte {self.report_type} - {self.user.nombre_completo} ({self.period_start} - {self.period_end})"

    @property
    def completion_rate(self):
        """Calcula el porcentaje de completación"""
        if self.total_tasks > 0:
            return (self.completed_tasks / self.total_tasks) * 100
        return 0

    class Meta:
        ordering = ['-created_at']
        db_table = 'report'


class TaskComment(models.Model):
    """Modelo para comentarios en tareas"""
    id = models.AutoField(primary_key=True)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(Login, on_delete=models.CASCADE, related_name='task_comments')
    comment = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.nombre_completo} - {self.task.task[:50]}..."

    class Meta:
        ordering = ['-created_at']
        db_table = 'task_comment'


class TaskHistory(models.Model):
    """Modelo para historial de cambios en tareas"""
    ACTION_CHOICES = [
        ('created', 'Creada'),
        ('updated', 'Actualizada'),
        ('status_changed', 'Estado Cambiado'),
        ('assigned', 'Asignada'),
        ('completed', 'Completada'),
        ('deleted', 'Eliminada'),
    ]
    
    id = models.AutoField(primary_key=True)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='history')
    user = models.ForeignKey(Login, on_delete=models.CASCADE, related_name='task_actions')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    old_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)
    field_changed = models.CharField(max_length=50, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.task.task} - {self.action} por {self.user.nombre_completo}"

    class Meta:
        ordering = ['-timestamp']
        db_table = 'task_history'


# Señales para crear automáticamente notificaciones y historial
@receiver(post_save, sender=Task)
def create_task_notification(sender, instance, created, **kwargs):
    """Crea notificación cuando se crea o actualiza una tarea"""
    if created:
        # Notificación para el creador
        if instance.user:
            Notification.objects.create(
                user=instance.user,
                task=instance,
                title="Nueva tarea creada",
                message=f"Has creado la tarea: {instance.task}",
                notification_type='task_assigned'
            )
        
        # Crear entrada en historial
        TaskHistory.objects.create(
            task=instance,
            user=instance.user,
            action='created',
            new_value=instance.task
        )


@receiver(post_save, sender=Collaborator)
def create_collaborator_notification(sender, instance, created, **kwargs):
    """Crea notificación cuando se asigna un colaborador"""
    if created:
        Notification.objects.create(
            user=instance.user,
            task=instance.task,
            title="Tarea asignada",
            message=f"Se te ha asignado la tarea: {instance.task.task}",
            notification_type='task_assigned',
            send_email=True
        )
        
        # Crear entrada en historial
        TaskHistory.objects.create(
            task=instance.task,
            user=instance.assigned_by,
            action='assigned',
            new_value=f"Asignado a {instance.user.nombre_completo}"
        )
