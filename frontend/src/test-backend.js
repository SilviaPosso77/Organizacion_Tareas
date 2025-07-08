// Test de conectividad con el backend
import axios from 'axios';

const testBackend = async () => {
  console.log('=== TEST DE CONECTIVIDAD BACKEND ===');
  
  try {
    // Probar endpoint de usuarios
    console.log('Probando GET /api/login/');
    const response = await axios.get('http://127.0.0.1:8000/api/login/');
    console.log('✅ GET usuarios exitoso:', response.data.length, 'usuarios');
    
    // Mostrar estructura de datos
    if (response.data.length > 0) {
      console.log('Estructura del primer usuario:', response.data[0]);
    }
    
    // Probar si el primer usuario se puede actualizar
    if (response.data.length > 0) {
      const firstUser = response.data[0];
      console.log('Probando PUT /api/login/' + firstUser.id + '/');
      
      const updateResponse = await axios.put(`http://127.0.0.1:8000/api/login/${firstUser.id}/`, {
        documento_identidad: firstUser.documento_identidad,
        nombre_completo: firstUser.nombre_completo,
        email: firstUser.email || '',
        fecha_nacimiento: firstUser.fecha_nacimiento,
        rol: firstUser.rol
      });
      console.log('✅ PUT usuario exitoso:', updateResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
  }
};

// Ejecutar test
testBackend();
