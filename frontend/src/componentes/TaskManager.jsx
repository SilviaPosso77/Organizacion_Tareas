import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './TaskManager.css';

//tareas
const TaskManager = ({ userId, userData, onLogout }) => {
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
    team: null
  });
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
    progress_max: ''
  });
  const [vistaDetalle, setVistaDetalle] = useState(null);
  const [modoCreacion, setModoCreacion] = useState('simple'); // 'simple' o 'avanzado'
  const [teams, setTeams] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [comentarios, setComentarios] = useState({});
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);

  const API_URL = 'http://127.0.0.1:8000/api/task/';
  const TEAM_API_URL = 'http://127.0.0.1:8000/api/team/';
  const COLLABORATOR_API_URL = 'http://127.0.0.1:8000/api/collaborator/';
  const NOTIFICATION_API_URL = 'http://127.0.0.1:8000/api/notification/';
  const COMMENT_API_URL = 'http://127.0.0.1:8000/api/comment/';

  // Opciones para los select
  const prioridadOpciones = [
    { value: 'low', label: 'Baja', color: '#28a745' },
    { value: 'medium', label: 'Media', color: '#ffc107' },
    { value: 'high', label: 'Alta', color: '#fd7e14' },
    { value: 'urgent', label: 'Urgente', color: '#dc3545' }
  ];

  const estadoOpciones = [
    { value: 'pending', label: 'Pendiente', color: '#6c757d' },
    { value: 'in_progress', label: 'En Progreso', color: '#007bff' },
    { value: 'completed', label: 'Completada', color: '#28a745' },
    { value: 'cancelled', label: 'Cancelada', color: '#dc3545' },
    { value: 'on_hold', label: 'En Espera', color: '#ffc107' }
  ];

  const categoriaOpciones = [
    { value: 'principal', label: 'Principal' },
    { value: 'subtarea', label: 'Subtarea' }
  ];

  // Obtener tareas al cargar y cuando cambien los filtros
  useEffect(() => {
    obtenerTareas();
    obtenerTeams();
    obtenerNotifications();
  }, [filtros]);

  // Función para obtener equipos
  const obtenerTeams = async () => {
    try {
      const response = await axios.get(`${TEAM_API_URL}?user_id=${userId}`);
      setTeams(response.data);
    } catch (error) {
      console.error('Error al obtener equipos:', error);
    }
  };

  // Función para obtener notificaciones
  const obtenerNotifications = async () => {
    try {
      const response = await axios.get(`${NOTIFICATION_API_URL}?user_id=${userId}`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
    }
  };

  // Función para obtener comentarios de una tarea
  const obtenerComentarios = async (taskId) => {
    try {
      const response = await axios.get(`${COMMENT_API_URL}?task_id=${taskId}`);
      setComentarios(prev => ({...prev, [taskId]: response.data}));
    } catch (error) {
      console.error('Error al obtener comentarios:', error);
    }
  };

  const construirURLConFiltros = () => {
    let url = `${API_URL}?user_id=${userId}`;
    
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

  const crearTarea = async () => {
    if (!nuevaTarea.task.trim()) {
      alert('El nombre de la tarea es requerido');
      return;
    }

    try {
      const tareaData = {
        task: nuevaTarea.task,
        user_id: userId,
        priority: nuevaTarea.priority,
        status: nuevaTarea.status,
        category: nuevaTarea.category,
        description: nuevaTarea.description,
        progress: parseInt(nuevaTarea.progress) || 0
      };

      // Solo agregar fechas si están definidas
      if (nuevaTarea.due_date) {
        tareaData.due_date = nuevaTarea.due_date;
      }
      if (nuevaTarea.start_date) {
        tareaData.start_date = nuevaTarea.start_date;
      }
      
      // Agregar campos numéricos si están definidos
      if (nuevaTarea.estimated_hours) {
        tareaData.estimated_hours = parseFloat(nuevaTarea.estimated_hours);
      }
      if (nuevaTarea.actual_hours) {
        tareaData.actual_hours = parseFloat(nuevaTarea.actual_hours);
      }
      
      // Agregar campos de texto
      if (nuevaTarea.tags) {
        tareaData.tags = nuevaTarea.tags;
      }
      if (nuevaTarea.parent_task) {
        tareaData.parent_task = nuevaTarea.parent_task;
      }
      if (nuevaTarea.team) {
        tareaData.team = nuevaTarea.team;
      }

      await axios.post(API_URL, tareaData);
      
      // Resetear formulario
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
        team: null
      });
      
      obtenerTareas(); // Refrescar la lista
    } catch (error) {
      console.error('Error al crear tarea:', error);
      alert('Error al crear la tarea');
    }
  };

  const iniciarEdicion = (tarea) => {
    setEditandoTarea(tarea.id);
    setTareaEditada({
      task: tarea.task,
      priority: tarea.priority || 'medium',
      status: tarea.status || 'pending',
      category: tarea.category || 'principal',
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

  const cancelarEdicion = () => {
    setEditandoTarea(null);
    setTareaEditada({});
  };

  const actualizarTarea = async (id) => {
    if (!tareaEditada.task?.trim()) {
      alert('El nombre de la tarea es requerido');
      return;
    }

    try {
      const tareaData = {
        task: tareaEditada.task,
        user_id: userId,
        priority: tareaEditada.priority,
        status: tareaEditada.status,
        category: tareaEditada.category,
        description: tareaEditada.description,
        progress: parseInt(tareaEditada.progress) || 0
      };

      // Solo agregar fechas si están definidas
      if (tareaEditada.due_date) {
        tareaData.due_date = tareaEditada.due_date;
      }
      if (tareaEditada.start_date) {
        tareaData.start_date = tareaEditada.start_date;
      }
      
      // Agregar campos numéricos si están definidos
      if (tareaEditada.estimated_hours) {
        tareaData.estimated_hours = parseFloat(tareaEditada.estimated_hours);
      }
      if (tareaEditada.actual_hours) {
        tareaData.actual_hours = parseFloat(tareaEditada.actual_hours);
      }
      
      // Agregar campos de texto
      if (tareaEditada.tags) {
        tareaData.tags = tareaEditada.tags;
      }
      if (tareaEditada.parent_task) {
        tareaData.parent_task = tareaEditada.parent_task;
      }
      if (tareaEditada.team) {
        tareaData.team = tareaEditada.team;
      }

      await axios.put(`${API_URL}${id}/`, tareaData);
      setEditandoTarea(null);
      setTareaEditada({});
      obtenerTareas();
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
      } catch (error) {
        console.error('Error al eliminar tarea:', error);
        alert('Error al eliminar la tarea');
      }
    }
  };

  const marcarComoCompletada = async (id) => {
    try {
      await axios.put(`${API_URL}${id}/`, {
        status: 'completed',
        user_id: userId
      });
      obtenerTareas();
    } catch (error) {
      console.error('Error al completar tarea:', error);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const obtenerColorPrioridad = (priority) => {
    const opcion = prioridadOpciones.find(p => p.value === priority);
    return opcion ? opcion.color : '#6c757d';
  };

  const obtenerColorEstado = (status) => {
    const opcion = estadoOpciones.find(s => s.value === status);
    return opcion ? opcion.color : '#6c757d';
  };

  const esTareaVencida = (due_date, status) => {
    if (!due_date || status === 'completed') return false;
    return new Date(due_date) < new Date();
  };

  const handleKeyPress = (e, action, id = null) => {
    if (e.key === 'Enter') {
      if (action === 'crear') {
        crearTarea();
      } else if (action === 'actualizar') {
        actualizarTarea(id);
      }
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      search: '',
      priority: '',
      status: '',
      category: '',
      due_date: '',
      tags: '',
      progress_min: '',
      progress_max: ''
    });
  };

  // Función para agregar comentario
  const agregarComentario = async (taskId) => {
    if (!nuevoComentario.trim()) {
      alert('El comentario no puede estar vacío');
      return;
    }

    try {
      await axios.post(COMMENT_API_URL, {
        task: taskId,
        user_id: userId,
        comment: nuevoComentario
      });
      
      setNuevoComentario('');
      obtenerComentarios(taskId);
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      alert('Error al agregar el comentario');
    }
  };

  // Función para asignar colaborador
  const asignarColaborador = async (taskId, collaboratorId, role = 'viewer') => {
    try {
      await axios.post(COLLABORATOR_API_URL, {
        task: taskId,
        user: collaboratorId,
        assigned_by: userId,
        role: role
      });
      
      alert('Colaborador asignado exitosamente');
      obtenerTareas();
    } catch (error) {
      console.error('Error al asignar colaborador:', error);
      alert('Error al asignar el colaborador');
    }
  };

  // Función para marcar notificación como leída
  const marcarNotificacionLeida = async (notificationId) => {
    try {
      await axios.put(`${NOTIFICATION_API_URL}${notificationId}/`, {
        is_read: true
      });
      
      obtenerNotifications();
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  // Función para obtener subtareas
  const obtenerSubtareas = (taskId) => {
    return tareas.filter(t => t.parent_task === taskId);
  };

  // Función para calcular progreso de tarea principal basado en subtareas
  const calcularProgresoSubtareas = (taskId) => {
    const subtareas = obtenerSubtareas(taskId);
    if (subtareas.length === 0) return 0;
    
    const subtareasCompletadas = subtareas.filter(s => s.status === 'completed').length;
    return Math.round((subtareasCompletadas / subtareas.length) * 100);
  };

  return (
    <div className="task-manager">
      {/* Header con información del usuario */}
      <div className="header">
        <div className="user-info">
          <h3>Bienvenido, {userData?.nombre_completo || 'Usuario'}</h3>
          <span className="user-role">Rol: {userData?.rol || 'user'}</span>
          <small>ID: {userId}</small>
        </div>
        
        <div className="header-actions">
          <div className="notifications-section">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="notifications-btn"
            >
              🔔 Notificaciones ({notifications.filter(n => !n.is_read).length})
            </button>
            
            {showNotifications && (
              <div className="notifications-dropdown">
                {notifications.length === 0 ? (
                  <p className="no-notifications">No hay notificaciones</p>
                ) : (
                  notifications.slice(0, 5).map(notification => (
                    <div key={notification.id} className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}>
                      <h5>{notification.title}</h5>
                      <p>{notification.message}</p>
                      <small>{formatearFecha(notification.created_at)}</small>
                      {!notification.is_read && (
                        <button 
                          onClick={() => marcarNotificacionLeida(notification.id)}
                          className="mark-read-btn"
                        >
                          Marcar como leída
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          <button onClick={onLogout} className="logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="filters-section">
        <h3>Filtros y Búsqueda</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Buscar tarea (mín. 3 caracteres):</label>
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={filtros.search}
              onChange={(e) => setFiltros({...filtros, search: e.target.value})}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Prioridad:</label>
            <select
              value={filtros.priority}
              onChange={(e) => setFiltros({...filtros, priority: e.target.value})}
              className="filter-select"
            >
              <option value="">Todas</option>
              {prioridadOpciones.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Estado:</label>
            <select
              value={filtros.status}
              onChange={(e) => setFiltros({...filtros, status: e.target.value})}
              className="filter-select"
            >
              <option value="">Todos</option>
              {estadoOpciones.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Categoría:</label>
            <select
              value={filtros.category}
              onChange={(e) => setFiltros({...filtros, category: e.target.value})}
              className="filter-select"
            >
              <option value="">Todas</option>
              {categoriaOpciones.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Fecha límite:</label>
            <input
              type="date"
              value={filtros.due_date}
              onChange={(e) => setFiltros({...filtros, due_date: e.target.value})}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Etiquetas:</label>
            <input
              type="text"
              placeholder="Buscar por etiquetas..."
              value={filtros.tags}
              onChange={(e) => setFiltros({...filtros, tags: e.target.value})}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Progreso mínimo (%):</label>
            <input
              type="number"
              placeholder="0"
              min="0"
              max="100"
              value={filtros.progress_min}
              onChange={(e) => setFiltros({...filtros, progress_min: e.target.value})}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Progreso máximo (%):</label>
            <input
              type="number"
              placeholder="100"
              min="0"
              max="100"
              value={filtros.progress_max}
              onChange={(e) => setFiltros({...filtros, progress_max: e.target.value})}
              className="filter-input"
            />
          </div>

          <div className="filter-actions">
            <button onClick={limpiarFiltros} className="btn btn-secondary">
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Formulario para crear nueva tarea */}
      <div className="task-form">
        <div className="form-header">
          <h2>Crear Nueva Tarea</h2>
          <div className="mode-toggle">
            <button 
              className={modoCreacion === 'simple' ? 'active' : ''}
              onClick={() => setModoCreacion('simple')}
            >
              Simple
            </button>
            <button 
              className={modoCreacion === 'avanzado' ? 'active' : ''}
              onClick={() => setModoCreacion('avanzado')}
            >
              Avanzado
            </button>
          </div>
        </div>

        <div className="form-content">
          {/* Campos básicos (siempre visibles) */}
          <div className="form-group">
            <label>Nombre de la tarea *:</label>
            <input
              type="text"
              placeholder="Escribe tu nueva tarea..."
              value={nuevaTarea.task}
              onChange={(e) => setNuevaTarea({...nuevaTarea, task: e.target.value})}
              onKeyPress={(e) => handleKeyPress(e, 'crear')}
              className="task-input"
              maxLength="200"
            />
          </div>

          {/* Campos avanzados (solo en modo avanzado) */}
          {modoCreacion === 'avanzado' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Prioridad:</label>
                  <select
                    value={nuevaTarea.priority}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, priority: e.target.value})}
                    className="form-select"
                  >
                    {prioridadOpciones.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Estado:</label>
                  <select
                    value={nuevaTarea.status}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, status: e.target.value})}
                    className="form-select"
                  >
                    {estadoOpciones.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Categoría:</label>
                  <select
                    value={nuevaTarea.category}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, category: e.target.value})}
                    className="form-select"
                  >
                    {categoriaOpciones.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de inicio:</label>
                  <input
                    type="date"
                    value={nuevaTarea.start_date}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, start_date: e.target.value})}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Fecha límite:</label>
                  <input
                    type="date"
                    value={nuevaTarea.due_date}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, due_date: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  placeholder="Descripción detallada de la tarea..."
                  value={nuevaTarea.description}
                  onChange={(e) => setNuevaTarea({...nuevaTarea, description: e.target.value})}
                  className="form-textarea"
                  maxLength="500"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Progreso (%):</label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={nuevaTarea.progress}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, progress: e.target.value})}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Horas estimadas:</label>
                  <input
                    type="number"
                    placeholder="0.0"
                    min="0"
                    step="0.5"
                    value={nuevaTarea.estimated_hours}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, estimated_hours: e.target.value})}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Horas reales:</label>
                  <input
                    type="number"
                    placeholder="0.0"
                    min="0"
                    step="0.5"
                    value={nuevaTarea.actual_hours}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, actual_hours: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Etiquetas (separadas por comas):</label>
                  <input
                    type="text"
                    placeholder="trabajo, urgente, cliente..."
                    value={nuevaTarea.tags}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, tags: e.target.value})}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Tarea principal:</label>
                  <select
                    value={nuevaTarea.parent_task || ''}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, parent_task: e.target.value || null})}
                    className="form-select"
                  >
                    <option value="">Ninguna (tarea principal)</option>
                    {tareas.filter(t => t.category === 'principal').map(t => (
                      <option key={t.id} value={t.id}>{t.task}</option>
                    ))}
                  </select>
                </div>
              </div>

              {teams.length > 0 && (
                <div className="form-group">
                  <label>Asignar a equipo:</label>
                  <select
                    value={nuevaTarea.team || ''}
                    onChange={(e) => setNuevaTarea({...nuevaTarea, team: e.target.value || null})}
                    className="form-select"
                  >
                    <option value="">Tarea personal</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <button onClick={crearTarea} className="btn btn-create">
            Crear Tarea
          </button>
        </div>
      </div>

      {/* Lista de tareas */}
      <div className="tasks-list">
        <h3>Mis Tareas ({tareas.length})</h3>
        {tareas.length === 0 ? (
          <p className="no-tasks">
            {Object.values(filtros).some(f => f) ? 
              'No hay tareas que coincidan con los filtros.' : 
              'No hay tareas creadas aún.'
            }
          </p>
        ) : (
          tareas.map((tarea) => (
            <div 
              key={tarea.id} 
              className={`task-item ${tarea.status} ${esTareaVencida(tarea.due_date, tarea.status) ? 'overdue' : ''}`}
            >
              {editandoTarea === tarea.id ? (
                // Modo edición
                <div className="task-edit-form">
                  <div className="edit-form-group">
                    <label>Nombre:</label>
                    <input
                      type="text"
                      value={tareaEditada.task}
                      onChange={(e) => setTareaEditada({...tareaEditada, task: e.target.value})}
                      onKeyPress={(e) => handleKeyPress(e, 'actualizar', tarea.id)}
                      className="task-input"
                      autoFocus
                      maxLength="200"
                    />
                  </div>

                  <div className="edit-form-row">
                    <div className="edit-form-group">
                      <label>Prioridad:</label>
                      <select
                        value={tareaEditada.priority}
                        onChange={(e) => setTareaEditada({...tareaEditada, priority: e.target.value})}
                        className="form-select"
                      >
                        {prioridadOpciones.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="edit-form-group">
                      <label>Estado:</label>
                      <select
                        value={tareaEditada.status}
                        onChange={(e) => setTareaEditada({...tareaEditada, status: e.target.value})}
                        className="form-select"
                      >
                        {estadoOpciones.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="edit-form-row">
                    <div className="edit-form-group">
                      <label>Fecha límite:</label>
                      <input
                        type="date"
                        value={tareaEditada.due_date}
                        onChange={(e) => setTareaEditada({...tareaEditada, due_date: e.target.value})}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="edit-form-group">
                    <label>Descripción:</label>
                    <textarea
                      value={tareaEditada.description}
                      onChange={(e) => setTareaEditada({...tareaEditada, description: e.target.value})}
                      className="form-textarea"
                      maxLength="500"
                      rows="2"
                    />
                  </div>

                  <div className="edit-form-row">
                    <div className="edit-form-group">
                      <label>Progreso (%):</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={tareaEditada.progress}
                        onChange={(e) => setTareaEditada({...tareaEditada, progress: e.target.value})}
                        className="form-input"
                      />
                    </div>

                    <div className="edit-form-group">
                      <label>Horas estimadas:</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={tareaEditada.estimated_hours}
                        onChange={(e) => setTareaEditada({...tareaEditada, estimated_hours: e.target.value})}
                        className="form-input"
                      />
                    </div>

                    <div className="edit-form-group">
                      <label>Horas reales:</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={tareaEditada.actual_hours}
                        onChange={(e) => setTareaEditada({...tareaEditada, actual_hours: e.target.value})}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="edit-form-group">
                    <label>Etiquetas:</label>
                    <input
                      type="text"
                      value={tareaEditada.tags}
                      onChange={(e) => setTareaEditada({...tareaEditada, tags: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="edit-actions">
                    <button 
                      onClick={() => actualizarTarea(tarea.id)}
                      className="btn btn-create"
                    >
                      Guardar
                    </button>
                    <button 
                      onClick={cancelarEdicion}
                      className="btn btn-cancel"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo visualización
                <div className="task-view">
                  <div className="task-header">
                    <div className="task-title-section">
                      <h4 className="task-title">{tarea.task}</h4>
                      <div className="task-badges">
                        <span 
                          className="priority-badge"
                          style={{ backgroundColor: obtenerColorPrioridad(tarea.priority) }}
                        >
                          {prioridadOpciones.find(p => p.value === tarea.priority)?.label || tarea.priority}
                        </span>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: obtenerColorEstado(tarea.status) }}
                        >
                          {estadoOpciones.find(s => s.value === tarea.status)?.label || tarea.status}
                        </span>
                        {tarea.category === 'subtarea' && (
                          <span className="category-badge">Subtarea</span>
                        )}
                        {tarea.team && (
                          <span className="team-badge">Equipo</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="task-dates">
                      {tarea.due_date && (
                        <div className={`due-date ${esTareaVencida(tarea.due_date, tarea.status) ? 'overdue' : ''}`}>
                          <strong>Vence:</strong> {formatearFecha(tarea.due_date)}
                          {esTareaVencida(tarea.due_date, tarea.status) && (
                            <span className="overdue-label">¡VENCIDA!</span>
                          )}
                        </div>
                      )}
                      {tarea.start_date && (
                        <div className="start-date">
                          <strong>Inicio:</strong> {formatearFecha(tarea.start_date)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="task-progress">
                    <div className="progress-info">
                      <span>Progreso: {tarea.progress || 0}%</span>
                      {tarea.category === 'principal' && obtenerSubtareas(tarea.id).length > 0 && (
                        <span className="subtasks-progress">
                          (Subtareas: {calcularProgresoSubtareas(tarea.id)}%)
                        </span>
                      )}
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${tarea.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Etiquetas */}
                  {tarea.tags && (
                    <div className="task-tags">
                      {tarea.tags.split(',').map((tag, index) => (
                        <span key={index} className="tag">{tag.trim()}</span>
                      ))}
                    </div>
                  )}

                  {tarea.description && (
                    <div className="task-description">
                      <p>{tarea.description}</p>
                    </div>
                  )}

                  {/* Información de tiempo */}
                  {(tarea.estimated_hours || tarea.actual_hours) && (
                    <div className="task-time-info">
                      {tarea.estimated_hours && (
                        <span className="time-estimate">
                          Estimado: {tarea.estimated_hours}h
                        </span>
                      )}
                      {tarea.actual_hours && (
                        <span className="time-actual">
                          Real: {tarea.actual_hours}h
                        </span>
                      )}
                    </div>
                  )}

                  {/* Subtareas */}
                  {tarea.category === 'principal' && obtenerSubtareas(tarea.id).length > 0 && (
                    <div className="subtasks-section">
                      <h5>Subtareas ({obtenerSubtareas(tarea.id).length})</h5>
                      <div className="subtasks-list">
                        {obtenerSubtareas(tarea.id).map(subtarea => (
                          <div key={subtarea.id} className="subtask-item">
                            <span className={`subtask-status ${subtarea.status}`}>
                              {subtarea.status === 'completed' ? '✓' : '○'}
                            </span>
                            <span className="subtask-name">{subtarea.task}</span>
                            <span className="subtask-progress">{subtarea.progress || 0}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="task-meta">
                    <small>
                      Creada: {formatearFecha(tarea.created_at)} | 
                      Actualizada: {formatearFecha(tarea.updated_at)}
                    </small>
                  </div>

                  <div className="task-actions">
                    {tarea.status !== 'completed' && (
                      <button 
                        onClick={() => marcarComoCompletada(tarea.id)}
                        className="btn btn-complete"
                        title="Marcar como completada"
                      >
                        ✓ Completar
                      </button>
                    )}
                    <button 
                      onClick={() => iniciarEdicion(tarea)}
                      className="btn btn-edit"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => eliminarTarea(tarea.id)}
                      className="btn btn-delete"
                    >
                      Eliminar
                    </button>
                    <button 
                      onClick={() => setVistaDetalle(vistaDetalle === tarea.id ? null : tarea.id)}
                      className="btn btn-details"
                    >
                      {vistaDetalle === tarea.id ? 'Ocultar' : 'Detalles'}
                    </button>
                    <button 
                      onClick={() => {
                        setTareaSeleccionada(tarea.id);
                        obtenerComentarios(tarea.id);
                      }}
                      className="btn btn-comments"
                    >
                      💬 Comentarios
                    </button>
                  </div>

                  {/* Detalles expandidos */}
                  {vistaDetalle === tarea.id && (
                    <div className="task-details-expanded">
                      <h5>Información Detallada</h5>
                      <div className="details-grid">
                        <div><strong>ID:</strong> {tarea.id}</div>
                        <div><strong>Orden:</strong> {tarea.order || 0}</div>
                        <div><strong>Progreso:</strong> {tarea.progress || 0}%</div>
                        <div><strong>Categoría:</strong> {tarea.category}</div>
                        <div><strong>Usuario:</strong> {tarea.user}</div>
                        <div><strong>Equipo:</strong> {tarea.team || 'Personal'}</div>
                        {tarea.parent_task && (
                          <div><strong>Tarea padre:</strong> {tarea.parent_task}</div>
                        )}
                        <div><strong>Horas estimadas:</strong> {tarea.estimated_hours || 'N/A'}</div>
                        <div><strong>Horas reales:</strong> {tarea.actual_hours || 'N/A'}</div>
                        <div><strong>Días hasta vencimiento:</strong> {
                          tarea.due_date ? 
                            Math.max(0, Math.ceil((new Date(tarea.due_date) - new Date()) / (1000 * 60 * 60 * 24))) + ' días' : 
                            'N/A'
                        }</div>
                        <div><strong>Creada:</strong> {new Date(tarea.created_at).toLocaleString('es-ES')}</div>
                        <div><strong>Actualizada:</strong> {new Date(tarea.updated_at).toLocaleString('es-ES')}</div>
                      </div>
                    </div>
                  )}

                  {/* Sección de comentarios */}
                  {tareaSeleccionada === tarea.id && (
                    <div className="comments-section">
                      <h5>Comentarios</h5>
                      <div className="comments-list">
                        {comentarios[tarea.id] && comentarios[tarea.id].length > 0 ? (
                          comentarios[tarea.id].map(comentario => (
                            <div key={comentario.id} className="comment-item">
                              <div className="comment-header">
                                <strong>{comentario.user_name}</strong>
                                <small>{formatearFecha(comentario.created_at)}</small>
                              </div>
                              <p>{comentario.comment}</p>
                            </div>
                          ))
                        ) : (
                          <p className="no-comments">No hay comentarios aún</p>
                        )}
                      </div>
                      
                      <div className="add-comment">
                        <textarea
                          value={nuevoComentario}
                          onChange={(e) => setNuevoComentario(e.target.value)}
                          placeholder="Escribe un comentario..."
                          className="comment-input"
                          rows="3"
                        />
                        <button 
                          onClick={() => agregarComentario(tarea.id)}
                          className="btn btn-comment"
                        >
                          Agregar Comentario
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Estadísticas resumidas */}
      <div className="task-stats">
        <h3>Estadísticas</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{tareas.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{tareas.filter(t => t.status === 'pending').length}</span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{tareas.filter(t => t.status === 'in_progress').length}</span>
            <span className="stat-label">En Progreso</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{tareas.filter(t => t.status === 'completed').length}</span>
            <span className="stat-label">Completadas</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{tareas.filter(t => esTareaVencida(t.due_date, t.status)).length}</span>
            <span className="stat-label">Vencidas</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{tareas.filter(t => t.priority === 'urgent').length}</span>
            <span className="stat-label">Urgentes</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{tareas.filter(t => t.category === 'subtarea').length}</span>
            <span className="stat-label">Subtareas</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {tareas.length > 0 ? Math.round(tareas.reduce((sum, t) => sum + (t.progress || 0), 0) / tareas.length) : 0}%
            </span>
            <span className="stat-label">Progreso Promedio</span>
          </div>
        </div>

        {/* Estadísticas de tiempo */}
        <div className="time-stats">
          <h4>Estadísticas de Tiempo</h4>
          <div className="time-stats-grid">
            <div className="time-stat">
              <span className="time-number">
                {tareas.reduce((sum, t) => sum + (parseFloat(t.estimated_hours) || 0), 0).toFixed(1)}h
              </span>
              <span className="time-label">Horas Estimadas</span>
            </div>
            <div className="time-stat">
              <span className="time-number">
                {tareas.reduce((sum, t) => sum + (parseFloat(t.actual_hours) || 0), 0).toFixed(1)}h
              </span>
              <span className="time-label">Horas Reales</span>
            </div>
            <div className="time-stat">
              <span className="time-number">
                {tareas.filter(t => t.due_date && new Date(t.due_date) > new Date()).length}
              </span>
              <span className="time-label">Próximas a Vencer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskManager;
