#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from organizacion_tareas.models import Login
from datetime import date

def crear_admin():
    """Crear un nuevo usuario administrador"""
    try:
        # Verificar si ya existe un admin
        admin_exists = Login.objects.filter(rol__in=['admin', 'Administrador']).exists()
        
        if admin_exists:
            print("✅ Ya existe un administrador en el sistema.")
            # Mostrar administradores existentes
            admins = Login.objects.filter(rol__in=['admin', 'Administrador'])
            for admin in admins:
                print(f"   👤 {admin.nombre_completo} - Documento: {admin.documento_identidad}")
            return
        
        # Crear nuevo administrador
        nuevo_admin = Login.objects.create(
            documento_identidad='Admin7780',
            nombre_completo='Administrador del Sistema',
            email='admin@sistemascensa.com',
            fecha_nacimiento=date(1990, 1, 1),
            rol='admin',  # Usar 'admin' que está en las opciones del modelo
            is_active=True
        )
        
        print("✅ ¡Administrador creado exitosamente!")
        print(f"📋 Documento: {nuevo_admin.documento_identidad}")
        print(f"👤 Nombre: {nuevo_admin.nombre_completo}")
        print(f"🔑 Rol: {nuevo_admin.rol}")
        print(f"📅 Fecha de nacimiento: {nuevo_admin.fecha_nacimiento}")
        print("\n🚀 Ahora puedes iniciar sesión con:")
        print("   Documento: Admin7780")
        print("   Fecha de nacimiento: 1990-01-01")
        
    except Exception as e:
        print(f"❌ Error al crear administrador: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    crear_admin()
