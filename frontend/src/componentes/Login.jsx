import React, { useState } from 'react';
import axios from 'axios';
import './login.css'

const Login = () => {
  const [documento, setDocumento] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login/', {
        documento_identidad: documento,
        fecha_nacimiento: fechaNacimiento
      });
      setMensaje('Inicio de sesión exitoso');
      console.log(response.data);
    } catch (error) {
      setMensaje('Credenciales incorrectas');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-container">
          
          <div className="login-icon">
            <img src="/image.png" alt="Logo de la aplicación" className="login-logo" /> 
            <svg width="0" height="100" viewBox="5 0 50 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#1aa310" strokeWidth="2" fill="none"/>
            </svg>
          </div>
        </div>

        <h2 className="login-title">Iniciar Sesión</h2>
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="documento" className="input-label">Documento de Identidad</label>
            <input
              id="documento"
              type="text"
              className="input-field"
              placeholder="Ingrese su documento"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="fecha" className="input-label">Fecha de Nacimiento</label>
            <input
              id="fecha"
              type="date"
              className="input-field"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="login-button">
            Ingresar
          </button>
        </form>
        {mensaje && <p className={`mensaje ${mensaje.includes('exitoso') ? 'success' : 'error'}`}>{mensaje}</p>}
      </div>
    </div>
  );
};

export default Login;
