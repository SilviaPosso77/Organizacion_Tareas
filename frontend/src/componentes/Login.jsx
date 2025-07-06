import React, { useState } from 'react';

import axios from 'axios';
import './login.css'

const Login = ({ onClose }) => {
  const [name, setName] = useState("");
  const [documento, setDocumento] = useState('');
  const [fecha, setFecha] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [rol, setRol] = useState('user');

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  console.log('=== DATOS DEL FORMULARIO ===');
  console.log('Documento:', documento);
  console.log('Fecha:', fecha);
  console.log('Nombre:', name);
  console.log('Es registro:', isRegister);
  
  const url = isRegister 
    ? 'http://127.0.0.1:8000/api/auth/register/'
    : 'http://127.0.0.1:8000/api/auth/login/';
  
  console.log('URL:', url);
  
  try {
    // Preparar datos según el modo (login o registro)
    const data = {
      documento_identidad: documento,
      fecha_nacimiento: fecha
    };
    
    // Solo agregar el nombre si es registro
    if (isRegister) {
      data.nombre_completo = name;
      data.rol = rol;
    }
    
    console.log('Datos a enviar:', data);
    
    const response = await axios.post(url, data);
    
    console.log('Respuesta exitosa:', response.data);
    
    if (isRegister) {
      setMensaje('¡Usuario registrado exitosamente!');
      setTimeout(() => {
        setIsRegister(false);
        setMensaje('');
      }, 2000);
    } else {
      setMensaje('¡Inicio de sesión exitoso!');
      setTimeout(() => {
        // Enviar datos completos del usuario
        const userData = {
          user_id: response.data.user_id,
          documento_identidad: documento,
          nombre_completo: response.data.nombre_completo || 'Usuario',
          rol: response.data.rol || 'user',
          estado: response.data.estado || 'approved'
        };
        onClose && onClose(userData);
      }, 1500);
    }
    
  } catch (error) {
    console.error('Error completo:', error);
    console.error('Error response:', error.response);
    console.error('Error response data:', error.response?.data);
    
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        'Error en la operación';
    setMensaje(errorMessage);
  }
};
    
  const toggleMode = () => {
    setIsRegister(!isRegister);
    setMensaje('');
    setDocumento('');
    setFecha('');
    setName('');
    setRol('user'); // Resetear el rol al valor por defecto
  };

  return (
    <div className="modal-background">
      <div className="login-modal">
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="logo"><br/>
        
          <div className="logo-text">CENSA SAS</div>
        
        </div>


         {/* formulario de resgistrarse*/}
        <h2>{isRegister ? 'Registrarse' : 'Ingresar'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Documento de identidad"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            required
          />
          {/* Campo para nombres y apellidos - solo en registro */}
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Nombres y apellidos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              
              {/* Campo para seleccionar el rol */}
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                required
                className="role-select"
              >
                <option value="user">Usuario Regular</option>
                <option value="admin">Administrador</option>
                <option value="manager">Gerente</option>
              </select>
            </>
          )}
           {/* Campo para fecha de nacimiento */}

          <input
            type="date"
            placeholder="Fecha de nacimiento"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />


          {/* Campo para contraseña */}

          
          
          {!isRegister && (
            <a href="#" className="forgot-password">¿Olvidaste tu documento?</a>
          )}
          
          <button type="submit" className="login-button">
            {isRegister ? 'REGISTRARSE' : 'INGRESAR'}
          </button>
        </form>
        
        <div className="register-text">
          {isRegister ? '¿Ya tienes cuenta?' : '¿AÚN NO HACES PARTE?'}{' '}
          <a href="#" onClick={toggleMode}>
            {isRegister ? 'INICIAR SESIÓN' : 'REGÍSTRATE'}
          </a>
        </div>
        
        {mensaje && (
          <p style={{
            color: mensaje.includes('exitoso') ? '#4CAF50' : '#f44336', 
            marginTop: '1rem'
          }}>
            {mensaje}
          </p>
        )}
      </div>
    </div>
  );
};



export default Login;