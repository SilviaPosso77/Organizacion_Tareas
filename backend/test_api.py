import requests
import json

# URL base del API
BASE_URL = "http://127.0.0.1:8000/api/auth"

# Datos de prueba
test_data = {
    "documento_identidad": "12345678",
    "fecha_nacimiento": "1990-01-01",
    "nombre_completo": "Juan Pérez"
}

print("=== PRUEBA DE REGISTRO ===")
try:
    response = requests.post(f"{BASE_URL}/register/", json=test_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error en registro: {e}")

print("\n=== PRUEBA DE LOGIN ===")
try:
    login_data = {
        "documento_identidad": "12345678",
        "fecha_nacimiento": "1990-01-01"
    }
    response = requests.post(f"{BASE_URL}/login/", json=login_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error en login: {e}")

print("\n=== PRUEBA DE LOGIN CON DATOS INCORRECTOS ===")
try:
    wrong_data = {
        "documento_identidad": "99999999",
        "fecha_nacimiento": "1990-01-01"
    }
    response = requests.post(f"{BASE_URL}/login/", json=wrong_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error en login con datos incorrectos: {e}")
