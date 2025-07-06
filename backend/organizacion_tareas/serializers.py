from rest_framework import serializers
from .models import (
    Login, Task, User, TaskDetails, Collaborator, Notification, Report,
    Team, Calendar, TaskComment, TaskHistory
)

class LoginSerializer(serializers.ModelSerializer):
    class Meta:
        model = Login
        fields = '__all__'  

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'
        
class TaskDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskDetails
        fields = '__all__'

class CollaboratorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collaborator
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = '__all__'

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = '__all__'

class CalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calendar
        fields = '__all__'

class TaskCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.nombre_completo', read_only=True)
    
    class Meta:
        model = TaskComment
        fields = '__all__'

class TaskHistorySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.nombre_completo', read_only=True)
    
    class Meta:
        model = TaskHistory
        fields = '__all__'
