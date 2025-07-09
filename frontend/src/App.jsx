import React, { useState, useEffect } from 'react';
import Login from './componentes/Login';
import TaskManager from './componentes/TaskManager';
import ThemeToggle from './componentes/ThemeToggle';

const App = () => {
  const [usuarioId, setUsuarioId] = useState(null);
  const [usuarioData, setUsuarioData] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Cargar tema desde localStorage al iniciar
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Aplicar tema al body
  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-theme' : 'light-theme';
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const cerrarLogin = (userData) => {
    setUsuarioId(userData.user_id);
    setUsuarioData(userData);
    setMostrarLogin(false);
  };

  const cerrarSesion = () => {
    setUsuarioId(null);
    setUsuarioData(null);
    setMostrarLogin(true);
  };

  return (
    <div className="App">
      <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      {mostrarLogin ? (
        <Login onClose={cerrarLogin} /> 
      ) : (
        <TaskManager 
          userId={usuarioId} 
          userData={usuarioData}
          onLogout={cerrarSesion}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      )}
    </div>
  );
};

export default App;
