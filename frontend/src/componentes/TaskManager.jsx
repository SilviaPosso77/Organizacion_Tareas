import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './TaskManager.css';


// Este es el estado de las tareas categorizadas
const TaskManager = ({ userId, userData, onLogout }) => {
  // Estados principales
  const [tareas, setTareas] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState({
    task: '',
    priority: 'medium',
    status: 'pending',
    category: 'principal',
    due_date: '',
    description: '',
    start_date: '',
    progress: 0,
    estimated_hours: '',
    actual_hours: '',
    tags: '',
    parent_task: null,
    team: null,
    assigned_to: null
  });

const [showRoleSelector, setShowRoleSelector] = useState(false);
const [availableRoles] = useState([
  'Nuevo usuario',
  'Usuario registrado', 
  'Usuario autenticado',
  'Desarrolladora',
  'Administrador',
  'Desarrolladora (Flask)',
  'Desarrolladora (Django)'
]);



  const [editandoTarea, setEditandoTarea] = useState(null);
  const [tareaEditada, setTareaEditada] = useState({});
  const [filtros, setFiltros] = useState({
    search: '',
    priority: '',
    status: '',
    category: '',
    due_date: '',
    tags: '',
    progress_min: '',
    progress_max: '',
    show_all: false
  });
  const [vistaDetalle, setVistaDetalle] = useState(null);
  const [modoCreacion, setModoCreacion] = useState('simple');
  const [teams, setTeams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [comentarios, setComentarios] = useState({});
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  
  // Estados específicos para admin
  const [usuarios, setUsuarios] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [estadisticasGenerales, setEstadisticasGenerales] = useState({});

  // URLs de API
  const API_URL = 'http://127.0.0.1:8000/api/task/';
  const TEAM_API_URL = 'http://127.0.0.1:8000/api/team/';
  const NOTIFICATION_API_URL = 'http://127.0.0.1:8000/api/notification/';
  const COMMENT_API_URL = 'http://127.0.0.1:8000/api/comment/';

  // Funciones auxiliares
  const esTareaVencida = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    const hoy = new Date();
    const fechaVencimiento = new Date(dueDate);
    return fechaVencimiento < hoy;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const obtenerNombreUsuario = (userId) => {
    const usuario = usuarios.find(u => u.id === userId);
    return usuario ? usuario.nombre_completo : 'Usuario desconocido';
  };
//Funcion de los roles
const handleRoleChange = async (selectedRole) => {
  try {
    // Llamar API para actualizar rol
    await axios.put(`http://127.0.0.1:8000/api/users/${userData.user_id}/role/`, {
      rol: selectedRole
    });
    
    // Mostrar mensaje de éxito y cerrar selector
    alert('Rol actualizado exitosamente. Por favor, inicia sesión nuevamente para ver los cambios.');
    setShowRoleSelector(false);
    
    // Opcional: cerrar sesión automáticamente para que el usuario vuelva a iniciar sesión
    // onLogout();
  } catch (error) {
    console.error('Error updating role:', error);
    alert('Error al actualizar el rol. Por favor, inténtalo de nuevo.');
  }
};

  // Funciones de API
  const construirURLConFiltros = () => {
    let url = `${API_URL}`;
    
    if (userData?.rol === 'admin' && filtros.show_all) {
      url += '?show_all=true';
    } else {
      url += `?user_id=${userId}`;
    }
    
    if (filtros.search && filtros.search.length >= 3) {
      url += `&search=${encodeURIComponent(filtros.search)}`;
    }
    if (filtros.priority) {
      url += `&priority=${filtros.priority}`;
    }
    if (filtros.status) {
      url += `&status=${filtros.status}`;
    }
    if (filtros.category) {
      url += `&category=${filtros.category}`;
    }
    if (filtros.due_date) {
      url += `&due_date=${filtros.due_date}`;
    }
    if (filtros.tags) {
      url += `&tags=${encodeURIComponent(filtros.tags)}`;
    }
    if (filtros.progress_min) {
      url += `&progress_min=${filtros.progress_min}`;
    }
    if (filtros.progress_max) {
      url += `&progress_max=${filtros.progress_max}`;
    }
    
    return url;
  };

  const obtenerTareas = async () => {
    try {
      const url = construirURLConFiltros();
      const response = await axios.get(url);
      setTareas(response.data);
    } catch (error) {
      console.error('Error al obtener tareas:', error);
    }
  };

  const obtenerTeams = async () => {
    try {
      const response = await axios.get(`${TEAM_API_URL}?user_id=${userId}`);
      setTeams(response.data);
    } catch (error) {
      console.error('Error al obtener equipos:', error);
    }
  };

  const obtenerNotifications = async () => {
    try {
      const response = await axios.get(`${NOTIFICATION_API_URL}?user_id=${userId}`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
    }
  };

  const obtenerComentarios = async (taskId) => {
    try {
      const response = await axios.get(`${COMMENT_API_URL}?task_id=${taskId}`);
      setComentarios(prev => ({
        ...prev,
        [taskId]: response.data
      }));
    } catch (error) {
      console.error('Error al obtener comentarios:', error);
    }
  };

  const obtenerUsuarios = async () => {
    if (userData?.rol !== 'admin') return;
    
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/login/');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  const obtenerEstadisticasGenerales = async () => {
    if (userData?.rol !== 'admin') return;
    
    try {
      const response = await axios.get(`${API_URL}?show_all=true`);
      const todasLasTareas = response.data;
      
      setEstadisticasGenerales({
        totalTareas: todasLasTareas.length,
        totalUsuarios: usuarios.length,
        tareasPendientes: todasLasTareas.filter(t => t.status === 'pending').length,
        tareasCompletadas: todasLasTareas.filter(t => t.status === 'completed').length,
        tareasVencidas: todasLasTareas.filter(t => esTareaVencida(t.due_date, t.status)).length,
        promedioProgreso: todasLasTareas.length > 0 ? 
          Math.round(todasLasTareas.reduce((sum, t) => sum + (t.progress || 0), 0) / todasLasTareas.length) : 0
      });
    } catch (error) {
      console.error('Error al obtener estadísticas generales:', error);
    }
  };

  const crearTarea = async (e) => {
    e.preventDefault();
    
    if (!nuevaTarea.task.trim()) {
      alert('El título de la tarea es requerido');
      return;
    }
    
    try {
      const tareaData = {
        ...nuevaTarea,
        user_id: nuevaTarea.assigned_to || userId,
        tags: nuevaTarea.tags || '',
        progress: parseInt(nuevaTarea.progress) || 0,
        estimated_hours: parseFloat(nuevaTarea.estimated_hours) || null,
        actual_hours: parseFloat(nuevaTarea.actual_hours) || null,
        parent_task: nuevaTarea.parent_task || null,
        team: nuevaTarea.team || null,
        due_date: nuevaTarea.due_date || null,
        start_date: nuevaTarea.start_date || null,
        description: nuevaTarea.description || ''
      };
      
      delete tareaData.assigned_to;
      
      await axios.post(API_URL, tareaData);
      
      setNuevaTarea({
        task: '',
        priority: 'medium',
        status: 'pending',
        category: 'principal',
        due_date: '',
        description: '',
        start_date: '',
        progress: 0,
        estimated_hours: '',
        actual_hours: '',
        tags: '',
        parent_task: null,
        team: null,
        assigned_to: null
      });
      
      obtenerTareas();
      alert('Tarea creada exitosamente');
    } catch (error) {
      console.error('Error al crear tarea:', error);
      alert('Error al crear la tarea');
    }
  };

  const iniciarEdicion = (tarea) => {
    setEditandoTarea(tarea.id);
    setTareaEditada({
      task: tarea.task,
      priority: tarea.priority,
      status: tarea.status,
      category: tarea.category,
      due_date: tarea.due_date || '',
      description: tarea.description || '',
      start_date: tarea.start_date || '',
      progress: tarea.progress || 0,
      estimated_hours: tarea.estimated_hours || '',
      actual_hours: tarea.actual_hours || '',
      tags: tarea.tags || '',
      parent_task: tarea.parent_task || null,
      team: tarea.team || null
    });
  };

  const guardarEdicion = async (id) => {
    try {
      const tareaData = {
        ...tareaEditada,
        user_id: userId,
        tags: tareaEditada.tags || '',
        progress: parseInt(tareaEditada.progress) || 0,
        estimated_hours: parseFloat(tareaEditada.estimated_hours) || null,
        actual_hours: parseFloat(tareaEditada.actual_hours) || null,
        parent_task: tareaEditada.parent_task || null,
        team: tareaEditada.team || null,
        due_date: tareaEditada.due_date || null,
        start_date: tareaEditada.start_date || null,
        description: tareaEditada.description || ''
      };
      
      await axios.put(`${API_URL}${id}/`, tareaData);
      setEditandoTarea(null);
      setTareaEditada({});
      obtenerTareas();
      alert('Tarea actualizada exitosamente');
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      alert('Error al actualizar la tarea');
    }
  };

  const eliminarTarea = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      try {
        await axios.delete(`${API_URL}${id}/`);
        obtenerTareas();
        alert('Tarea eliminada exitosamente');
      } catch (error) {
        console.error('Error al eliminar tarea:', error);
        alert('Error al eliminar la tarea');
      }
    }
  };
{/* Eliminar las tareas- Administrador*/}
  const eliminarTareaAdmin = async (id) => {
    if (userData?.rol !== 'admin', 'user') {
      alert('No tienes permisos para eliminar esta tarea');
      return;
    }

    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea? (Acción de administrador)')) {
      try {
        await axios.delete(`${API_URL}${id}/`);
        obtenerTareas();
        alert('Tarea eliminada exitosamente');
      } catch (error) {
        console.error('Error al eliminar tarea:', error);
        alert('Error al eliminar la tarea');
      }
    }
  };

{/* Eliminar las tareas- Usuarios*/}
  const eliminarTareaUser = async (id) => {
    if (userData?.rol !== 'user') {
      alert('No tienes permisos para eliminar esta tarea');
      return;
    }

    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      try {
        await axios.delete(`${API_URL}${id}/`);
        obtenerTareas();
        alert('Tarea eliminada exitosamente');
      } catch (error) {
        console.error('Error al eliminar tarea:', error);
        alert('Error al eliminar la tarea');
      }
    }
  };




  const reasignarTarea = async (tareaId, nuevoUsuarioId) => {
    if (userData?.rol !== 'admin') {
      alert('No tienes permisos para reasignar tareas');
      return;
    }

    try {
      await axios.put(`${API_URL}${tareaId}/`, {
        user_id: nuevoUsuarioId
      });
      
      alert('Tarea reasignada exitosamente');
      obtenerTareas();
    } catch (error) {
      console.error('Error al reasignar tarea:', error);
      alert('Error al reasignar la tarea');
    }
  };

  const cambiarEstadoUsuario = async (usuarioId, nuevoEstado) => {
    if (userData?.rol !== 'admin') {
      alert('No tienes permisos para cambiar el estado de usuarios');
      return;
    }

    try {
      await axios.put(`http://127.0.0.1:8000/api/login/${usuarioId}/`, {
        estado: nuevoEstado
      });
      
      alert(`Usuario ${nuevoEstado === 'approved' ? 'aprobado' : 'rechazado'} exitosamente`);
      obtenerUsuarios();
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      alert('Error al cambiar el estado del usuario');
    }
  };

  const verDetalleTarea = async (id) => {
    try {
      const response = await axios.get(`${API_URL}${id}/`);
      setVistaDetalle(response.data);
      setTareaSeleccionada(id);
      obtenerComentarios(id);
    } catch (error) {
      console.error('Error al obtener detalle:', error);
    }
  };

  const cerrarVistaDetalle = () => {
    setVistaDetalle(null);
    setTareaSeleccionada(null);
  };

  const agregarComentario = async (taskId) => {
    if (!nuevoComentario.trim()) return;
    
    try {
      await axios.post(COMMENT_API_URL, {
        task_id: taskId,
        user_id: userId,
        comment: nuevoComentario,
        created_at: new Date().toISOString()
      });
      
      setNuevoComentario('');
      obtenerComentarios(taskId);
    } catch (error) {
      console.error('Error al agregar comentario:', error);
    }
  };

  const cancelarEdicion = () => {
    setEditandoTarea(null);
    setTareaEditada({});
  };

  // Filtrar tareas
  const tareasFiltradas = tareas.filter(tarea => {
    const matchesSearch = !filtros.search || 
                         tarea.task.toLowerCase().includes(filtros.search.toLowerCase()) ||
                         (tarea.description && tarea.description.toLowerCase().includes(filtros.search.toLowerCase()));
    const matchesPriority = !filtros.priority || tarea.priority === filtros.priority;
    const matchesStatus = !filtros.status || tarea.status === filtros.status;
    const matchesCategory = !filtros.category || tarea.category === filtros.category;
    const matchesDueDate = !filtros.due_date || tarea.due_date === filtros.due_date;
    const matchesTags = !filtros.tags || (tarea.tags && tarea.tags.toLowerCase().includes(filtros.tags.toLowerCase()));
    const matchesProgressMin = !filtros.progress_min || tarea.progress >= parseInt(filtros.progress_min);
    const matchesProgressMax = !filtros.progress_max || tarea.progress <= parseInt(filtros.progress_max);
    
    return matchesSearch && matchesPriority && matchesStatus && matchesCategory && 
           matchesDueDate && matchesTags && matchesProgressMin && matchesProgressMax;
  });

  // Effects
  useEffect(() => {
    obtenerTareas();
    obtenerTeams();
    obtenerNotifications();
    
    if (userData?.rol === 'admin') {
      obtenerUsuarios();
    }
  }, [filtros, userData]);

  useEffect(() => {
    if (userData?.rol === 'admin' && usuarios.length > 0) {
      obtenerEstadisticasGenerales();
    }
  }, [usuarios, userData]);

  return (
    <div className="task-manager">
      <div className="header">

        {/* Selector de rol para nuevos usuarios */}
  {showRoleSelector && (
  <div className="role-selector-modal">
    <div className="role-selector-content">
      <h3>Selecciona tu rol</h3>
      <select onChange={(e) => handleRoleChange(e.target.value)}>
        <option value="">Seleccionar rol...</option>
        {availableRoles.map(role => (
          <option key={role} value={role}>{role}</option>
        ))}
      </select>
    </div>
  </div>
)}


        <div className="user-info">
          <h2>Bienvenido, {userData.nombre_completo}</h2>
          <p>Rol: <span className={`role-badge ${userData.rol}`}>{userData.rol}</span></p>
          {userData.rol === 'admin' && (
            <button 
              className="admin-panel-btn"
              onClick={() => setShowAdminPanel(!showAdminPanel)}
            >
              {showAdminPanel ? 'Ocultar' : 'Mostrar'} Panel de Admin
            </button>
          )}
        </div>
        <div className="header-actions">
          <button className="notifications-btn" onClick={() => setShowNotifications(!showNotifications)}>
            🔔 Notificaciones {notifications.length > 0 && `(${notifications.length})`}
          </button>
          <button className="logout-btn" onClick={onLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Panel de Admin */}
      {userData.rol === 'admin' && showAdminPanel && (
        <div className="admin-panel">
          <h3>Panel de Administrador</h3>
          
          {/* Estadísticas Generales */}
          <div className="admin-stats">
            <div className="stat-card">
              <h4>Total de Tareas</h4>
              <p>{estadisticasGenerales.totalTareas || 0}</p>
            </div>
            <div className="stat-card">
              <h4>Total de Usuarios</h4>
              <p>{estadisticasGenerales.totalUsuarios || 0}</p>
            </div>
            <div className="stat-card">
              <h4>Tareas Pendientes</h4>
              <p>{estadisticasGenerales.tareasPendientes || 0}</p>
            </div>
            <div className="stat-card">
              <h4>Tareas Completadas</h4>
              <p>{estadisticasGenerales.tareasCompletadas || 0}</p>
            </div>
            <div className="stat-card">
              <h4>Tareas Vencidas</h4>
              <p>{estadisticasGenerales.tareasVencidas || 0}</p>
            </div>
            
            <div className="stat-card">
              <h4>Progreso Promedio</h4>
              <p>{estadisticasGenerales.promedioProgreso || 10}%</p>
            </div>
          </div>

          {/* Gestión de Usuarios */}
          <div className="admin-users">
            <h4>Gestión de Usuarios</h4>
            <div className="users-list">
              {usuarios.map(usuario => (
                <div key={usuario.id} className="user-item">
                  <div className="user-info">
                    <span className="user-name">{usuario.nombre_completo}</span>
                    <span className="user-login">{usuario.documento_identidad}</span>
                    <span className={`user-role ${usuario.rol}`}>{usuario.rol}</span>
                    <span className={`user-status ${usuario.estado}`}>{usuario.estado}</span>
                  </div>
                  <div className="user-actions">
                    {usuario.estado === 'pending' && (
                      <>
                        <button 
                          className="approve-btn"
                          onClick={() => cambiarEstadoUsuario(usuario.id, 'approved')}
                        >
                          Aprobar
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => cambiarEstadoUsuario(usuario.id, 'rejected')}
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notificaciones */}
      {showNotifications && (
        <div className="notifications-panel">
          <h3>Notificaciones</h3>
          {notifications.length === 0 ? (
            <p>No hay notificaciones</p>
          ) : (
            notifications.map(notification => (
              <div key={notification.id} className="notification-item">
                <span className={`notification-type ${notification.type}`}>
                  {notification.type === 'task_due' && '⏰'}
                  {notification.type === 'task_assigned' && '👤'}
                  {notification.type === 'task_completed' && '✅'}
                  {notification.type === 'task_commented' && '💬'}
                </span>
                <span className="notification-message">{notification.message}</span>
                <span className="notification-date">{new Date(notification.created_at).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="filters-container">
        <div className="filters">
          <div className="filter-group">
            <input 
              type="text" 
              placeholder="Buscar tareas..."
              value={filtros.search}
              onChange={(e) => setFiltros({...filtros, search: e.target.value})}
            />
            <select 
              value={filtros.priority}
              onChange={(e) => setFiltros({...filtros, priority: e.target.value})}
            >
              <option value="">Todas las prioridades</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
            <select 
              value={filtros.status}
              onChange={(e) => setFiltros({...filtros, status: e.target.value})}
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
          
          {/* Filtro especial para admin */}
          {userData.rol === 'admin' && (
            <div className="admin-filter">
              <label className="checkbox-label">
                <input 
                  type="checkbox"
                  checked={filtros.show_all}
                  onChange={(e) => setFiltros({...filtros, show_all: e.target.checked})}
                />
                Ver todas las tareas del sistema
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-container">
        <div className="stats-item">
          <h4>Total de Tareas</h4>
          <p>{tareas.length}</p>
        </div>
        <div className="stats-item">
          <h4>Completadas</h4>
          <p>{tareas.filter(t => t.status === 'completed').length}</p>
        </div>
        <div className="stats-item">
          <h4>Pendientes</h4>
          <p>{tareas.filter(t => t.status === 'pending').length}</p>
        </div>
        <div className="stats-item">
          <h4>En Progreso</h4>
          <p>{tareas.filter(t => t.status === 'in_progress').length}</p>
        </div>
        <div className="stats-item">
          <h4>Vencidas</h4>
          <p>{tareas.filter(t => esTareaVencida(t.due_date, t.status)).length}</p>
        </div>
      </div>

      {/* Formulario de nueva tarea */}
      <div className="new-task-form">
        <div className="form-header">
          <h3>Nueva Tarea</h3>
          <div className="form-mode-toggle">
            <button 
              className={`mode-btn ${modoCreacion === 'simple' ? 'active' : ''}`}
              onClick={() => setModoCreacion('simple')}
            >
              Simple
            </button>
            <button 
              className={`mode-btn ${modoCreacion === 'avanzado' ? 'active' : ''}`}
              onClick={() => setModoCreacion('avanzado')}
            >
              Avanzado
            </button>
          </div>
        </div>
        
        <form onSubmit={crearTarea} className="task-form">
          <div className="form-row">
            <input 
              type="text" 
              placeholder="Título de la tarea"
              value={nuevaTarea.task}
              onChange={(e) => setNuevaTarea({...nuevaTarea, task: e.target.value})}
              required
            />
            <select 
              value={nuevaTarea.priority}
              onChange={(e) => setNuevaTarea({...nuevaTarea, priority: e.target.value})}
            >
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
            <select 
              value={nuevaTarea.status}
              onChange={(e) => setNuevaTarea({...nuevaTarea, status: e.target.value})}
            >
              <option value="pending">Pendiente</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
          
          {modoCreacion === 'avanzado' && (
            <>
              <div className="form-row">
                <input 
                  type="date" 
                  value={nuevaTarea.due_date}
                  onChange={(e) => setNuevaTarea({...nuevaTarea, due_date: e.target.value})}
                  title="Fecha de vencimiento"
                />
                <select 
                  value={nuevaTarea.category}
                  onChange={(e) => setNuevaTarea({...nuevaTarea, category: e.target.value})}
                >
                  <option value="principal">Principal</option>
                  <option value="secundaria">Secundaria</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              
              {/* Campo para asignar a otros usuarios (solo admin) */}
              {userData.rol === 'admin' && (
                <div className="form-row">
                  <select 
                    value={nuevaTarea.assigned_to || ''}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, assigned_to: e.target.value || null})}
                  >
                    <option value="">Asignar a mi mismo</option>
                    {usuarios.filter(u => u.estado === 'approved').map(usuario => (
                      <option key={usuario.id} value={usuario.id}>{usuario.nombre_completo}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="form-row">
                <textarea 
                  placeholder="Descripción de la tarea"
                  value={nuevaTarea.description}
                  onChange={(e) => setNuevaTarea({...nuevaTarea, description: e.target.value})}
                  rows={3}
                />
              </div>
            </>
          )}
          
          <button type="submit" className="submit-btn">
            Crear Tarea
          </button>
        </form>
      </div>

      {/* Lista de tareas */}
      <div className="tasks-list">
        {tareasFiltradas.length === 0 ? (
          <p className="no-tasks">No hay tareas que coincidan con los filtros.</p>
        ) : (
          tareasFiltradas.map(tarea => (
            <div key={tarea.id} className={`task-item ${tarea.status} priority-${tarea.priority}`}>
              {editandoTarea === tarea.id ? (
                // Formulario de edición
                <div className="edit-form">
                  <input 
                    type="text"
                    value={tareaEditada.task}
                    onChange={(e) => setTareaEditada({...tareaEditada, task: e.target.value})}
                  />
                  <select 
                    value={tareaEditada.priority}
                    onChange={(e) => setTareaEditada({...tareaEditada, priority: e.target.value})}
                  >
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                  <select 
                    value={tareaEditada.status}
                    onChange={(e) => setTareaEditada({...tareaEditada, status: e.target.value})}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                  <div className="edit-actions">
                    <button onClick={() => guardarEdicion(tarea.id)}>Guardar</button>
                    <button onClick={cancelarEdicion}>Cancelar</button>
                  </div>
                </div>
              ) : (
                // Vista normal de tarea para usuarios
                <>
                  <div className="task-header">
                    <h4 className="task-title">{tarea.task}</h4>
                    <div className="task-badges">
                      <span className={`priority-badge ${tarea.priority}`}>
                        {tarea.priority === 'high' && '🔴'}
                        {tarea.priority === 'medium' && '🟡'}
                        {tarea.priority === 'low' && '🟢'}
                        {tarea.priority}
                      </span>
                      <span className={`status-badge ${tarea.status}`}>
                        {tarea.status === 'completed' && '✅'}
                        {tarea.status === 'in_progress' && '🔄'}
                        {tarea.status === 'pending' && '⏳'}
                        {tarea.status === 'cancelled' && '❌'}
                        {tarea.status}
                      </span>

                       <button 
                      className="action-btn view-btn"
                      onClick={() => verDetalleTarea(tarea.id)}
                    >
                      Ver
                    </button>
                    
                    {/* Botones para tareas usuarios */}
                    {(tarea.user_id === userId || userData.rol === 'user') && (
                      <>
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => iniciarEdicion(tarea)}
                        >
                          Editar
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => userData.rol === 'user' ? eliminarTareaUser(tarea.id) : eliminarTarea(tarea.id)}
                        >
                          Eliminar
                        </button>
                      </>
                    )}

                    </div>
                  </div>


                  <div className="task-info">
                    {tarea.due_date && (
                      <span className={`due-date ${esTareaVencida(tarea.due_date, tarea.status) ? 'overdue' : ''}`}>
                        📅 Vence: {formatearFecha(tarea.due_date)}
                      </span>
                    )}
                    
                    <div className="task-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${tarea.progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{tarea.progress}%</span>
                    </div>
                    
                    {tarea.description && (
                      <p className="task-description">{tarea.description}</p>
                    )}
                    
                    {/* Información adicional para admin -asignar tareas a usuarios*/}
                    {userData.rol === 'admin' && filtros.show_all && (
                      <div className="task-admin-info">
                        <span className="assigned-user">
                          👤 Asignado a: {obtenerNombreUsuario(tarea.user_id)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="task-actions">
                    <button 
                      className="action-btn view-btn"
                      onClick={() => verDetalleTarea(tarea.id)}
                    >
                      👁️ Ver
                    </button>
                    
                    {/* Botones para tareas propias o admin */}
                    {(tarea.user_id === userId || userData.rol === 'admin') && (
                      <>
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => iniciarEdicion(tarea)}
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => userData.rol === 'admin' ? eliminarTareaAdmin(tarea.id) : eliminarTarea(tarea.id)}
                        >
                          🗑️ Eliminar
                        </button>
                      </>
                    )}
                    
                    {/* Botón para reasignar (solo admin) */}
                    {userData.rol === 'admin' && (
                      <select 
                        className="reassign-select"
                        onChange={(e) => {
                          if (e.target.value && window.confirm('¿Reasignar esta tarea?')) {
                            reasignarTarea(tarea.id, e.target.value);
                          }
                          e.target.value = '';
                        }}
                      >
                        <option value="">Reasignar a...</option>
                        {usuarios.filter(u => u.estado === 'approved' && u.id !== tarea.user_id).map(usuario => (
                          <option key={usuario.id} value={usuario.id}>{usuario.nombre_completo}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Vista detalle de tarea */}
      {vistaDetalle && (
        <div className="task-detail-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{vistaDetalle.task}</h3>
              <button className="close-btn" onClick={cerrarVistaDetalle}>×</button>
            </div>
            <div className="modal-body">
              <div className="task-details">
                <p><strong>Prioridad:</strong> {vistaDetalle.priority}</p>
                <p><strong>Estado:</strong> {vistaDetalle.status}</p>
                <p><strong>Categoría:</strong> {vistaDetalle.category}</p>
                <p><strong>Progreso:</strong> {vistaDetalle.progress}%</p>
                {vistaDetalle.due_date && (
                  <p><strong>Fecha de vencimiento:</strong> {formatearFecha(vistaDetalle.due_date)}</p>
                )}
                {vistaDetalle.description && (
                  <p><strong>Descripción:</strong> {vistaDetalle.description}</p>
                )}
              </div>
              
              {/* Comentarios */}
              <div className="task-comments">
                <h4>Comentarios</h4>
                {comentarios[tareaSeleccionada] && comentarios[tareaSeleccionada].map(comentario => (
                  <div key={comentario.id} className="comment">
                    <p>{comentario.comment}</p>
                    <span className="comment-date">{new Date(comentario.created_at).toLocaleString()}</span>
                  </div>
                ))}
                
                <div className="add-comment">
                  <textarea 
                    placeholder="Agregar comentario..."
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    rows={2}
                  />
                  <button 
                    onClick={() => agregarComentario(tareaSeleccionada)}
                    disabled={!nuevoComentario.trim()}
                  >
                    Agregar Comentario
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
