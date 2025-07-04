import React, { useState } from 'react';
import axios from 'axios';
import './login.css'



const Login = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login/', {
        email: email,
        password: password
      });
      setMensaje('Inicio de sesión exitoso');
      console.log(response.data);
    } catch (error) {
      setMensaje('Credenciales incorrectas');
    }
  };

  return (
    <div className="modal-background">
      <div className="login-modal">
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="logo">
          <img src="/logo censa.png" alt="" />

          {/*<div className="logo-text">CENSA</div>*/}
        </div>
        
        <h2>Iniciar sesión</h2>
        
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Documento de identidad"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <input
            type="date"
            placeholder="Fecha de nacimiento"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
          
          <button type="submit" className="login-button">Ingresar</button>
        </form>
        
        <div className="register-text">
          ¿AÚN NO HACES PARTE? <a href="#">REGÍSTRATE</a>
        </div>
        
        {mensaje && <p style={{color: mensaje.includes('exitoso') ? '#4CAF50' : '#f44336', marginTop: '1rem'}}>{mensaje}</p>}
      </div>
    </div>
  );
};

export default Login;
