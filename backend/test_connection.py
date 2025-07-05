import psycopg2
import sys

try:
    # Intentar conectar a PostgreSQL
    conn = psycopg2.connect(
        host='localhost',
        database='organizacion_tareas',
        user='postgres',
        password='1037778057',
        port='5432'
    )
    print("✅ Conexión a PostgreSQL exitosa!")
    
    # Verificar que la base de datos existe
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    record = cursor.fetchone()
    print(f"📊 PostgreSQL version: {record}")
    
    cursor.close()
    conn.close()
    
except psycopg2.OperationalError as e:
    print(f"❌ Error de conexión: {e}")
    print("\n🔧 Posibles soluciones:")
    print("1. Verificar que PostgreSQL esté ejecutándose")
    print("2. Crear la base de datos 'organizacion_tareas' en pgAdmin")
    print("3. Verificar usuario y contraseña")
    
except Exception as e:
    print(f"❌ Error inesperado: {e}")
