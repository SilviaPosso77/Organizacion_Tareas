from django.db import models
from datetime import date



class Login(models.Model):
    id = models.SmallAutoField(primary_key=True)
    documento_identidad = models.CharField(max_length=20, default='000000')
    fecha_nacimiento = models.DateField(default='2000-01-01')  # Fecha por defecto
    nombre_completo = models.CharField(max_length=200, blank=True, null=True)  # Campo para registro

    def __str__(self):
        return self.documento_identidad


class Task(models.Model):  # Renombrado a mayúscula
    id = models.AutoField(primary_key=True)
    task = models.CharField(max_length=200)
    
    def __str__(self):
        return self.task


#User de la aplicacion
class User(models.Model):
    ROL_CHOICES = [
        ('user', 'User'),
        ('admin', 'Admin'),
    ]
    
    id = models.AutoField(primary_key=True)
    Login = models.CharField(max_length=150, unique=True)
    nombre = models.CharField(max_length=100)
    email = models.CharField(max_length=255, unique=True)
    rol = models.CharField(max_length=10, choices=ROL_CHOICES)

    def __str__(self):
        return self.nombre


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


class Collaborator(models.Model):
    id = models.AutoField(primary_key=True)
    task = models.ForeignKey(TaskDetails, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    assigned_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.nombre} assigned to {self.task.task.task}"


class Notification(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    task = models.ForeignKey(TaskDetails, on_delete=models.CASCADE)
    message = models.CharField(max_length=255)
    is_sent = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification for {self.user.nombre} - {self.message}"


class Report(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    total_task = models.IntegerField(default=0)
    completed_task = models.IntegerField(default=0)
    productivity_score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Report for {self.user.nombre} - Productivity Score: {self.productivity_score}"
