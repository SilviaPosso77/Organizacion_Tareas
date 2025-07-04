from django.db import models

# Create your models here.
#Crear login de usuario
class Login(models.Model):
   id = models.SmallAutoField(primary_key=True)
doc_identidad = models.CharField(max_length=20)
fecha_nacimiento = models.DateField()

def __str__(self):
        return self.doc_identidad


   #Taks- tareas  
class taks(models.Model):
     id = models.AutoField(primary_key=True)
     taks = models.CharField(max_length=200)
def __str__(self):
        return self.taks


#User de la aplicacion
class User(models.Model):
    id = models.AutoField(primary_key=True)
    Login = models.CharField(max_length=150, unique=True)
    nombre = models.CharField(max_length=100)
    email = models.ChardField(max_lengt=255, unique=True)

ROL_CHOICES = [#muchas dudas
        ('user', 'User'),
        ('admin', 'Admin'),
    ]
rol = models.CharField(max_length=10, choices=ROL_CHOICES)


def __str__(self):
        return self.nombre
# Task details- detalles de las tareas
class task_details(models.Model):
    id = models.AutoField(primary_key=True)
    task = models.ForeignKey(taks, on_delete=models.CASCADE)
    priority = models.CharField(max_length=10,choices= PRIORITY_CHOICES, default='medium')
    due_date = models.DateField(null= True, blank=True)
    status = models.CharField(max_length=15, choices= STATUS_CHOICES, default='pending')
    category = models.CharField(max_length=50)

def __str__(self):
    return f"{self.task.taks}({self.status})"

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
    #Colaboradores-Registra asignaciones de tareas a usuarios
class Collaborator(models.Model):   
    id = models.AutoField(primary_key=True)
    task = models.ForeignKey(task_details, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    assigned_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.nombre} assigned to {self.task.task.taks}"
    
    #Notificaciones-Almacena notificaciones para los usuarios
class Notification(models.Model):
     id = models.AutoField(primary_key=True)
     user = models.ForeignKey(User, on_delete=models.CASCADE)   
     task =models.ForeignKey(task_details, on_delete=models.CASCADE)
     message = models.CharField(max_length=255)
     is_sent =models.BooleanField(default=False)

     def __str__(self):
         return f"Notification for {self.user.nombre} - {self.message}"
     
     #reportes-Guarda reportes de productividad
     class Report(models.Model):
         id = models.AutoField(primary_key=True)
         user = models.ForeignKey(User, on_delete=models.CASCADE)#cascad e
         total_tasks = models.IntegerField(default=0)
         completed_tasks = models.IntegerField(default=0)
         productivity_score = models.FloatField(default=0.0)
         auto_now_add = models.DateTimeField(auto_now_add=True)
         message[:30]

     
         def __str__(self):
             return f"Report for {self.user.nombre} - Productivity Score: {self.productivity_score}"