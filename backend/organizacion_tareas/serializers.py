from rest_framework import serializers
from .models import Login, taks,  User, task_details, Collaborator,Notification,Report

class LoginSerializer(serializers.ModelSerializer):
    class Meta:
        model = Login
        fields = '__all__'  

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class TaksSerializer(serializers.ModelSerializer):
    class Meta:
        model = taks
        fields = '__all__'

class taskDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = task_details
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