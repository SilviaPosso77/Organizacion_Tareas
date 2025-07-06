#!/usr/bin/env python
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from organizacion_tareas.models import *

def test_models():
    print("=== TESTING MODELS ===")
    
    # Test Login model
    print("\n1. Testing Login model...")
    login_count = Login.objects.count()
    print(f"   Usuarios existentes: {login_count}")
    
    # Test Task model
    print("\n2. Testing Task model...")
    task_count = Task.objects.count()
    print(f"   Tareas existentes: {task_count}")
    
    # Test Team model
    print("\n3. Testing Team model...")
    team_count = Team.objects.count()
    print(f"   Equipos existentes: {team_count}")
    
    # Test Notification model
    print("\n4. Testing Notification model...")
    notification_count = Notification.objects.count()
    print(f"   Notificaciones existentes: {notification_count}")
    
    # Test Calendar model
    print("\n5. Testing Calendar model...")
    calendar_count = Calendar.objects.count()
    print(f"   Eventos de calendario existentes: {calendar_count}")
    
    # Test Report model
    print("\n6. Testing Report model...")
    report_count = Report.objects.count()
    print(f"   Reportes existentes: {report_count}")
    
    # Test Collaborator model
    print("\n7. Testing Collaborator model...")
    collaborator_count = Collaborator.objects.count()
    print(f"   Colaboradores existentes: {collaborator_count}")
    
    # Test TaskComment model
    print("\n8. Testing TaskComment model...")
    comment_count = TaskComment.objects.count()
    print(f"   Comentarios existentes: {comment_count}")
    
    # Test TaskHistory model
    print("\n9. Testing TaskHistory model...")
    history_count = TaskHistory.objects.count()
    print(f"   Entradas de historial existentes: {history_count}")
    
    print("\n=== ALL MODELS TESTED SUCCESSFULLY ===")

if __name__ == "__main__":
    test_models()
