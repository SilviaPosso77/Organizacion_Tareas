import React, { useState } from 'react';
import Login from './componentes/login';
import TaskManager from './componentes/TaskManager';

const App = () => {
  const [usuarioId, setUsuarioId] = useState(null);
  const [usuarioData, setUsuarioData] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(true);

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
      {mostrarLogin ? (
        <Login onClose={cerrarLogin} /> 
      ) : (
        <TaskManager 
          userId={usuarioId} 
          userData={usuarioData}
          onLogout={cerrarSesion}
        />
      )}
    </div>
  );
};

export default App;
