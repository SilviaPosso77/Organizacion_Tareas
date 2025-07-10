import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ThemeToggle from './ThemeToggle';
import './TaskManager.css';

// Este es el estado de las tareas categorizadas
const TaskManager = ({ userId, userData, onLogout, isDarkMode, toggleTheme }) => {
  // Estados principales para asignar tareas a los usuarios
  const [tareas, setTareas] = useState([]);
  const [cargandoTareas, setCargandoTareas] = useState(false);
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
  const [mostrarFormularioSubtarea, setMostrarFormularioSubtarea] = useState(null); // ID de la tarea principal para el formulario de subtareas
  const [nuevaSubtarea, setNuevaSubtarea] = useState({
    task: '',
    priority: 'medium',
    status: 'pending',
    due_date: '',
    description: '',
    start_date: '',
    progress: 0,
    estimated_hours: '',
    actual_hours: '',
    tags: '',
    team: null
  });
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [availableRoles] = useState(['usuario', 'dev', 'admin', 'dev_flask', 'dev_django']);
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
  const [usuarios, setUsuarios] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [estadisticasGenerales, setEstadisticasGenerales] = useState({});
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    documento_identidad: '',
    fecha_nacimiento: '',
    nombre_completo: '',
    email: '',
    rol: 'usuario'
  });

  // URLs de API
  const API_URL = 'http://127.0.0.1:8000/api/task/';
  const TEAM_API_URL = 'http://127.0.0.1:8000/api/team/';
  const NOTIFICATION_API_URL = 'http://127.0.0.1:8000/api/notification/';
  const COMMENT_API_URL = 'http://127.0.0.1:8000/api/comment/';

  // Funciones auxiliares
  const generarIdPorRol = (tareas, rol) => {
    const tareasPorRol = tareas.filter(t => {
      const usuario = usuarios.find(u => u.id === t.user_id);
      return usuario && usuario.rol === rol;
    });
    
    // Reorganizar IDs secuencialmente
    const idsUsados = tareasPorRol.map((_, index) => index + 1);
    return Math.max(...idsUsados, 0) + 1;
  };

  const asignarIdsPorRol = (tareasRaw) => {
    if (!usuarios || usuarios.length === 0) {
      // Si no hay usuarios cargados, usar IDs simpless
      return tareasRaw.map((tarea, index) => ({
        ...tarea,
        idPorRol: ` ${String(index + 1).padStart(3, '')}`,
        numeroSecuencial: index + 1
      }));
    }

    const tareasPorRol = {};
    
    // Agrupar tareas por rol del usuario asignado
    tareasRaw.forEach(tarea => {
      const usuario = usuarios.find(u => u.id === tarea.user_id);
      const rol = usuario ? usuario.rol : 'sin_rol';
      
      if (!tareasPorRol[rol]) {
        tareasPorRol[rol] = [];
      }
      tareasPorRol[rol].push(tarea);
    });
    
    // Asignar IDs secuenciales por rol
    const tareasConIdPorRol = [];
    Object.keys(tareasPorRol).forEach(rol => {
      tareasPorRol[rol].forEach((tarea, index) => {
        const idPorRol = String(index + 1).padStart(3, '0');
        tareasConIdPorRol.push({
          ...tarea,
          idPorRol: `${rol.toUpperCase()}-${idPorRol}`,
          numeroSecuencial: index + 1
        });
      });
    });
    
    return tareasConIdPorRol;
  };

  const procesarJerarquiaTareas = (tareasRaw) => {
    // Primero asignar IDs por rol
    const tareasConIds = asignarIdsPorRol(tareasRaw);
    
    const mapaDeTareas = {};
    tareasConIds.forEach(tarea => {
      mapaDeTareas[tarea.id] = { ...tarea, nivel: 0, hijos: [] };
    });
    
    const calcularNivel = (tareaId, visitados = new Set()) => {
      if (visitados.has(tareaId)) return 0;
      visitados.add(tareaId);
      const tarea = mapaDeTareas[tareaId];
      if (!tarea || !tarea.parent_task) return 0;
      return 1 + calcularNivel(tarea.parent_task, visitados);
    };
    
    Object.keys(mapaDeTareas).forEach(tareaId => {
      mapaDeTareas[tareaId].nivel = calcularNivel(parseInt(tareaId));
    });
    
    const tareasJerarquicas = [];
    Object.values(mapaDeTareas).forEach(tarea => {
      if (tarea.parent_task) {
        const padre = mapaDeTareas[tarea.parent_task];
        if (padre) {
          padre.hijos = padre.hijos || [];
          padre.hijos.push(tarea);
        }
      } else {
        tareasJerarquicas.push(tarea);
      }
    });
    
    tareasJerarquicas.sort((a, b) => a.id - b.id);
    tareasJerarquicas.forEach(tarea => {
      if (tarea.hijos) {
        tarea.hijos.sort((a, b) => a.id - b.id);
      }
    });
    
    const tareasAplanadas = [];
    const aplanarJerarquia = (tarea) => {
      tareasAplanadas.push(tarea);
      if (tarea.hijos) {
        tarea.hijos.forEach(hijo => aplanarJerarquia(hijo));
      }
    };
    
    tareasJerarquicas.forEach(tarea => aplanarJerarquia(tarea));
    return tareasAplanadas;
  };

  const obtenerTareasPrincipales = () => {
    return tareas.filter(tarea => 
      tarea.category === 'principal' && 
      tarea.parent_task === null && 
      (tarea.user_id === userId || esAdministrador())
    );
  };

  const crearSubtarea = async (e, parentTaskId) => {
    e.preventDefault();
    if (!puedeCrearTareas()) {
      alert('No tienes permisos para crear subtareas');
      return;
    }
    if (!nuevaSubtarea.task.trim()) {
      alert('El título de la subtarea es requerido');
      return;
    }
    const tareaPadre = tareas.find(t => t.id === parseInt(parentTaskId));
    if (!tareaPadre || tareaPadre.category !== 'principal' || tareaPadre.parent_task !== null) {
      alert('La tarea principal seleccionada no es válida');
      return;
    }
    try {
      const subtareaData = {
        task: nuevaSubtarea.task,
        category: 'subtarea',
        parent_task: parseInt(parentTaskId),
        user_id: nuevaSubtarea.assigned_to || userId,
        priority: nuevaSubtarea.priority,
        status: nuevaSubtarea.status,
        description: nuevaSubtarea.description || '',
        progress: parseInt(nuevaSubtarea.progress) || 0,
        estimated_hours: parseFloat(nuevaSubtarea.estimated_hours) || null,
        actual_hours: parseFloat(nuevaSubtarea.actual_hours) || null,
        tags: nuevaSubtarea.tags || '',
        due_date: nuevaSubtarea.due_date || null,
        start_date: nuevaSubtarea.start_date || null,
        team: nuevaSubtarea.team || null
      };
      await axios.post(API_URL, subtareaData);
      setNuevaSubtarea({
        task: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
        description: '',
        start_date: '',
        progress: 0,
        estimated_hours: '',
        actual_hours: '',
        tags: '',
        team: null
      });
      setMostrarFormularioSubtarea(null);
      obtenerTareas();
      alert('Subtarea creada exitosamente y vinculada a la tarea principal');
    } catch (error) {
      console.error('Error al crear subtarea:', error);
      alert('Error al crear la subtarea');
    }
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
      
      const tarea = tareas.find(t => t.id === id);
      
      // Si es una tarea principal y se marca como completada, completar todas sus subtareas
      if (tarea && tarea.category === 'principal' && tarea.parent_task === null && tareaData.status === 'completed') {
        const subtareas = tareas.filter(t => t.parent_task === id && t.status !== 'completed');
        
        if (subtareas.length > 0) {
          const promesasSubtareas = subtareas.map(subtarea => 
            axios.put(`${API_URL}${subtarea.id}/`, {
              ...subtarea,
              status: 'completed',
              progress: 100
            })
          );
          
          await Promise.all(promesasSubtareas);
          alert(`Tarea principal completada. Se han marcado como completadas ${subtareas.length} subtareas automáticamente.`);
        } else {
          alert('Tarea actualizada exitosamente');
        }
      } else {
        alert('Tarea actualizada exitosamente');
      }
      
      setEditandoTarea(null);
      setTareaEditada({});
      obtenerTareas();
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      alert('Error al actualizar la tarea');
    }
  };

  const crearTarea = async (e) => {
    e.preventDefault();
    if (!puedeCrearTareas()) {
      alert('No tienes permisos para crear tareas');
      return;
    }
    if (!nuevaTarea.task.trim()) {
      alert('El título de la tarea es requerido');
      return;
    }
    try {
      const tareaData = {
        ...nuevaTarea,
        category: nuevaTarea.category,
        user_id: nuevaTarea.assigned_to || userId,
        tags: nuevaTarea.tags || '',
        progress: parseInt(nuevaTarea.progress) || 0,
        estimated_hours: parseFloat(nuevaTarea.estimated_hours) || null,
        actual_hours: parseFloat(nuevaTarea.actual_hours) || null,
        parent_task: null,
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

  const obtenerNombreRol = (rol) => {
    const nombres = {
      'usuario': 'Usuario',
      'dev': 'Desarrolladora',
      'dev_flask': 'Desarrolladora Flask',
      'dev_django': 'Desarrolladora Django',
      'admin': 'Administrador',
      'pendiente': 'Pendiente'
    };
    return nombres[rol] || rol;
  };

  const handleRoleChange = async (selectedRole) => {
    try {
      await axios.put(`http://127.0.0.1:8000/api/users/${userData.user_id}/role/`, {
        rol: selectedRole
      });
      alert('Rol actualizado exitosamente. Por favor, inicia sesión nuevamente para ver los cambios.');
      setShowRoleSelector(false);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Error al actualizar el rol. Por favor, inténtalo de nuevo.');
    }
  };

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
      setCargandoTareas(true);
      const url = construirURLConFiltros();
      const response = await axios.get(url);
      const tareasConJerarquia = procesarJerarquiaTareas(response.data);
      setTareas(tareasConJerarquia);
    } catch (error) {
      console.error('Error al obtener tareas:', error);
    } finally {
      setCargandoTareas(false);
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
    if (!esAdministrador()) return;
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/login/');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  const obtenerEstadisticasGenerales = async () => {
    if (!esAdministrador()) return;
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

  const eliminarTareaAdmin = async (id) => {
    if (!esAdministrador()) {
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

  const reasignarTarea = async (tareaId, nuevoUsuarioId) => {
    if (!esAdministrador()) {
      alert('No tienes permisos para reasignar tareas');
      return;
    }
    try {
      const tareaResponse = await axios.get(`${API_URL}${tareaId}/`);
      const tareaCompleta = tareaResponse.data;
      const tareaActualizada = {
        ...tareaCompleta,
        user_id: nuevoUsuarioId
      };
      await axios.put(`${API_URL}${tareaId}/`, tareaActualizada);
      alert('Tarea reasignada exitosamente');
      obtenerTareas();
    } catch (error) {
      console.error('Error al reasignar tarea:', error);
      alert('Error al reasignar la tarea');
    }
  };

  const cambiarRolUsuario = async (usuarioId, nuevoRol) => {
    if (!esAdministrador()) {
      alert('No tienes permisos para cambiar roles de usuarios');
      return;
    }
    try {
      const usuarioActual = usuarios.find(u => u.id === usuarioId);
      if (!usuarioActual) {
        alert('Usuario no encontrado');
        return;
      }
      const datosActualizacion = {
        documento_identidad: usuarioActual.documento_identidad,
        nombre_completo: usuarioActual.nombre_completo,
        fecha_nacimiento: usuarioActual.fecha_nacimiento,
        rol: nuevoRol
      };
      if (usuarioActual.email && usuarioActual.email.trim() !== '') {
        datosActualizacion.email = usuarioActual.email;
      }
      await axios.put(`http://127.0.0.1:8000/api/login/${usuarioId}/`, datosActualizacion);
      if (nuevoRol === 'pendiente') {
        alert(`Usuario "${usuarioActual.nombre_completo}" ha sido desactivado. Ahora está en estado pendiente.`);
      } else {
        alert(`Rol actualizado exitosamente. "${usuarioActual.nombre_completo}" ahora es: ${obtenerNombreRol(nuevoRol)}`);
      }
      obtenerUsuarios();
    } catch (error) {
      console.error('Error al cambiar rol:', error);
      alert('Error al cambiar el rol del usuario.');
    }
  };

  const eliminarUsuario = async (usuarioId, nombreUsuario) => {
    if (!esAdministrador()) {
      alert('No tienes permisos para eliminar usuarios');
      return;
    }
    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente al usuario "${nombreUsuario}"?\n\n` +
      'Esta acción no se puede deshacer y eliminará:\n' +
      '- El usuario y toda su información\n' +
      '- Todas sus tareas asociadas\n' +
      '- Todos sus comentarios\n\n' +
      'Haz clic en "Aceptar" para confirmar o "Cancelar" para abortar.'
    );
    if (!confirmacion) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/login/${usuarioId}/`);
      alert(`Usuario "${nombreUsuario}" eliminado exitosamente del sistema.`);
      obtenerUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Error al eliminar el usuario.');
    }
  };

  const crearUsuario = async (e) => {
    e.preventDefault();
    if (!esAdministrador()) {
      alert('No tienes permisos para crear usuarios');
      return;
    }
    if (!nuevoUsuario.documento_identidad || !nuevoUsuario.fecha_nacimiento || !nuevoUsuario.nombre_completo) {
      alert('Documento, fecha de nacimiento y nombre completo son requeridos');
      return;
    }
    try {
      await axios.post('http://127.0.0.1:8000/api/admin/create-user/', {
        ...nuevoUsuario,
        admin_user_id: userData.user_id
      });
      alert('Usuario creado exitosamente');
      setNuevoUsuario({
        documento_identidad: '',
        fecha_nacimiento: '',
        nombre_completo: '',
        email: '',
        rol: 'usuario'
      });
      setShowCreateUserForm(false);
      obtenerUsuarios();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      alert('Error al crear el usuario');
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
//Boton para editar
  const iniciarEdicion = (tarea) => {
    // Verificar permisos
    if (!puedeEditarTareas() && tarea.user_id !== userId) {
      alert('No tienes permisos para editar esta tarea');
      return;
    }
    
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

  useEffect(() => {
    obtenerTareas();
    obtenerTeams();
    obtenerNotifications();
    if (esAdministrador()) {
      obtenerUsuarios();
    }
  }, [filtros, userData]);

  useEffect(() => {
    if (esAdministrador() && usuarios.length > 0) {
      obtenerEstadisticasGenerales();
    }
  }, [usuarios, userData]);

  const obtenerFuncionalidadesPorRol = (rol) => {
    switch (rol) {
      case 'usuario':
        return {
          puedeCrearTareas: true,
          puedeVerTodasSusTareas: true,
          puedeBuscarTareas: true,
          puedeModificarTareas: true,
          puedeEliminarTareas: true,
          puedeAsignarFechas: true,
          puedeMarcarCompletadas: true,
          puedeFiltrarPorPrioridad: true,
          puedeAgregarSubtareas: true,
          puedeVerCalendario: true,
          puedeGenerarReportes: true,
          puedeFiltrarPorCategoria: true,
          puedeVerPerfil: true,
          puedeExportarCSV: true,
          puedeOrdenarPorFecha: true,
          puedeVerTareasAsignadas: true,
          puedeAgregarNotas: true,
          puedeRecibirNotificaciones: true,
          puedeRecibirResumenDiario: true
        };
      case 'dev':
      case 'dev_flask':
      case 'dev_django':
        return {
          puedeCrearTareas: true,
          puedeVerTodasSusTareas: true,
          puedeBuscarTareas: true,
          puedeModificarTareas: true,
          puedeEliminarTareas: true,
          puedeAsignarFechas: true,
          puedeMarcarCompletadas: true,
          puedeFiltrarPorPrioridad: true,
          puedeAgregarSubtareas: true,
          puedeVerCalendario: true,
          puedeGenerarReportes: true,
          puedeFiltrarPorCategoria: true,
          puedeVerPerfil: true,
          puedeExportarCSV: true,
          puedeOrdenarPorFecha: true,
          puedeVerTareasAsignadas: true,
          puedeAgregarNotas: true,
          puedeRecibirNotificaciones: true,
          puedeRecibirResumenDiario: true,
          puedeValidarEntradas: true,
          puedeImplementarDragDrop: true,
          puedeValidarEmail: true,
          puedeCrearEndpointsPDF: true,
          puedeImplementarBusquedaTiempoReal: true,
          puedeAgregarPruebas: true
        };
      case 'admin':
        return {
          puedeCrearTareas: true,
          puedeVerTodasSusTareas: true,
          puedeBuscarTareas: true,
          puedeModificarTareas: true,
          puedeEliminarTareas: true,
          puedeAsignarFechas: true,
          puedeMarcarCompletadas: true,
          puedeFiltrarPorPrioridad: true,
          puedeAgregarSubtareas: true,
          puedeVerCalendario: true,
          puedeGenerarReportes: true,
          puedeFiltrarPorCategoria: true,
          puedeVerPerfil: true,
          puedeExportarCSV: true,
          puedeOrdenarPorFecha: true,
          puedeVerTareasAsignadas: true,
          puedeAgregarNotas: true,
          puedeRecibirNotificaciones: true,
          puedeRecibirResumenDiario: true,
          puedeGestionarUsuarios: true,
          puedeEliminarUsuarios: true,
          puedeInactivarUsuarios: true,
          puedeVerEstadisticas: true,
          puedeCrearRoles: true,
          puedeAsignarTareas: true,
          puedeVerTodasLasTareas: true,
          puedeReasignarTareas: true
        };
      case 'pendiente':
        return {
          puedeCrearTareas: false,
          puedeVerTodasSusTareas: false,
          esperandoAprobacion: true
        };
      default:
        return {
          puedeCrearTareas: false,
          puedeVerTodasSusTareas: false,
          rolNoValido: true
        };
    }
  };

  const funcionalidades = obtenerFuncionalidadesPorRol(userData?.rol);
  const esAdministrador = () => userData?.rol === 'admin';
  const puedeEditarTareas = () => ['usuario', 'dev', 'dev_flask', 'dev_django', 'admin'].includes(userData?.rol);
  const puedeCrearTareas = () => ['usuario', 'dev', 'dev_flask', 'dev_django', 'admin'].includes(userData?.rol);

  if (funcionalidades.esperandoAprobacion) {
    return (
      <div className="pending-approval-screen">
        <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        <div className="pending-content">
          <h2>¡Registro Exitoso!</h2>
          <div className="pending-icon">⏳</div>
          <p>Tu cuenta ha sido creada exitosamente.</p>
          <p>Tu solicitud está en revisión.</p>
          <p>Un administrador asignará tu rol y te dará acceso pronto.</p>
          <div className="user-info-pending">
            <p><strong>Nombre:</strong> {userData.nombre_completo}</p>
            <p><strong>Documento:</strong> {userData.documento_identidad}</p>
            <p><strong>Estado:</strong> Pendiente de aprobación</p>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  if (funcionalidades.rolNoValido) {
    return (
      <div className="invalid-role-screen">
        <div className="invalid-content">
          <h2>Acceso Restringido</h2>
          <div className="invalid-icon">🚫</div>
          <p>Tu cuenta no tiene un rol válido asignado.</p>
          <p>Por favor, contacta al administrador para obtener acceso.</p>
          <button className="logout-btn" onClick={onLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="task-manager compact-layout">
      <div className="header">
        {showRoleSelector && (
          <div className="role-selector-modal">
            <div className="role-selector-content">
              <h3>Selecciona tu rol</h3>
              <select onChange={(e) => handleRoleChange(e.target.value)}>
                <option value="">Seleccionar rol...</option>
                {availableRoles.map(role => (
                  <option key={role} value={role}>
                    {role === 'usuario' ? 'Usuario' : 
                     role === 'dev' ? 'Desarrolladora' :
                     role === 'dev_flask' ? 'Desarrolladora Flask' :
                     role === 'dev_django' ? 'Desarrolladora Django' :
                     role === 'admin' ? 'Administrador' : role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        <div className="user-info">
          <h2>Bienvenido, {userData.nombre_completo}</h2>
          <p>Rol: <span className={`role-badge ${userData.rol}`}>{obtenerNombreRol(userData.rol)}</span></p>
          {esAdministrador() && (
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

      <div className="content-wrapper">
        {esAdministrador() && showAdminPanel ? (
          <div className="admin-panel-fullscreen compact-layout">
            <h3>Panel de Administrador</h3>
            <div className="admin-stats grid-compact">
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
                <p>{estadisticasGenerales.promedioProgreso || 0}%</p>
              </div>
              <div className="stat-card">
                <h4>Usuarios Pendientes</h4>
                <p>{usuarios.filter(u => u.rol === 'pendiente').length}</p>
              </div>
            </div>
            <div className="admin-users">
              <h4>Gestión de Usuarios</h4>
              <div className="create-user-header">
                <button 
                  className="create-user-toggle-btn"
                  onClick={() => setShowCreateUserForm(!showCreateUserForm)}
                >
                  {showCreateUserForm ? '❌ Cancelar' : '➕ Crear Nuevo Usuario'}
                </button>
              </div>
              {showCreateUserForm && (
                <div className="create-user-form-container">
                  <h5>Crear Nuevo Usuario</h5>
                  <form onSubmit={crearUsuario} className="create-user-form">
                    <div className="form-row">
                      <input
                        type="text"
                        placeholder="Documento de identidad *"
                        value={nuevoUsuario.documento_identidad}
                        onChange={(e) => setNuevoUsuario({...nuevoUsuario, documento_identidad: e.target.value})}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Nombre completo *"
                        value={nuevoUsuario.nombre_completo}
                        onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre_completo: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <input
                        type="date"
                        placeholder="Fecha de nacimiento *"
                        value={nuevoUsuario.fecha_nacimiento}
                        onChange={(e) => setNuevoUsuario({...nuevoUsuario, fecha_nacimiento: e.target.value})}
                        required
                      />
                      <input
                        type="email"
                        placeholder="Correo electrónico (opcional)"
                        value={nuevoUsuario.email}
                        onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
                      />
                    </div>
                    <div className="form-row">
                      <select
                        value={nuevoUsuario.rol}
                        onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}
                        required
                      >
                        <option value="usuario">Usuario</option>
                        <option value="dev">Desarrolladora</option>
                        <option value="dev_flask">Desarrolladora Flask</option>
                        <option value="dev_django">Desarrolladora Django</option>
                        <option value="admin">Administrador</option>
                      </select>
                      <button type="submit" className="create-user-submit-btn">
                        ✅ Crear Usuario
                      </button>
                    </div>
                  </form>
                </div>
              )}
              <div className="users-list">
                {usuarios.map(usuario => (
                  <div key={usuario.id} className="user-item grid-compact">
                    <div className="user-info">
                      <span className="user-name">{usuario.nombre_completo}</span>
                      <span className="user-login">{usuario.documento_identidad}</span>
                      <span className={`user-role ${usuario.rol}`}>{obtenerNombreRol(usuario.rol)}</span>
                      <span className={`user-status activo`}>
                        {usuario.rol === 'pendiente' ? 'pendiente' : 'activo'}
                      </span>
                    </div>
                    <div className="user-actions">
                      {usuario.rol === 'pendiente' && (
                        <>
                          <select 
                            className="role-assign-select btn-compact"
                            onChange={(e) => {
                              if (e.target.value && window.confirm(`¿Asignar rol "${obtenerNombreRol(e.target.value)}" a ${usuario.nombre_completo}?`)) {
                                cambiarRolUsuario(usuario.id, e.target.value);
                              }
                              e.target.value = '';
                            }}
                          >
                            <option value="">Asignar rol...</option>
                            <option value="usuario">Usuario</option>
                            <option value="dev">Desarrolladora</option>
                            <option value="dev_flask">Desarrolladora Flask</option>
                            <option value="dev_django">Desarrolladora Django</option>
                            <option value="admin">Administrador</option>
                          </select>
                          <button 
                            className="reject-btn btn-compact"
                            onClick={() => eliminarUsuario(usuario.id, usuario.nombre_completo)}
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                      {usuario.rol !== 'pendiente' && (
                        <>
                          <select 
                            className="role-change-select btn-compact"
                            value=""
                            onChange={(e) => {
                              if (e.target.value && window.confirm(`¿Cambiar rol de ${usuario.nombre_completo} a "${obtenerNombreRol(e.target.value)}"?`)) {
                                cambiarRolUsuario(usuario.id, e.target.value);
                              }
                              e.target.value = '';
                            }}
                          >
                            <option value="">Cambiar rol...</option>
                            <option value="usuario">Usuario</option>
                            <option value="dev">Desarrolladora</option>
                            <option value="dev_flask">Desarrolladora Flask</option>
                            <option value="dev_django">Desarrolladora Django</option>
                            <option value="admin">Administrador</option>
                            <option value="pendiente">Desactivar usuario</option>
                          </select>
                          <button 
                            className="delete-user-btn btn-compact"
                            onClick={() => eliminarUsuario(usuario.id, usuario.nombre_completo)}
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {usuarios.filter(u => u.rol === 'pendiente').length === 0 && (
                  <p className="no-pending-users">No hay usuarios pendientes de aprobación</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="left-column">
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
                  {esAdministrador() && (
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

              {puedeCrearTareas() && (
                <div className="new-task-form">
                  <div className="form-header">
                    <h3>Nueva Tarea</h3>
                    <div className="form-mode-toggle">
                      
                      <button 
                        className={`mode-btn ${modoCreacion === 'avanzado' ? 'active' : ''}`}
                        onClick={() => setModoCreacion('avanzado')}
                      >
                        Crear tarea
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
                        {esAdministrador() && (
                          <div className="form-row">
                            <select 
                              value={nuevaTarea.assigned_to || ''}
                              onChange={(e) => setNuevaTarea({...nuevaTarea, assigned_to: e.target.value || null})}
                            >
                              <option value="">Asignar a mi mismo</option>
                              {usuarios.filter(u => u.rol !== 'pendiente').map(usuario => (
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
              )}
            </div>

            <div className="right-column">
              <div className="tasks-list">
                {cargandoTareas ? (
                  <div className="loading-indicator">
                    <p>Cargando tareas...</p>
                    <div className="loading-spinner"></div>
                  </div>
                ) : tareasFiltradas.length === 0 ? (
                  <p className="no-tasks">No hay tareas que coincidan con los filtros.</p>
                ) : (
                  tareasFiltradas.map(tarea => (
                    <div 
                      key={tarea.id} 
                      className={`task-item ${tarea.status} priority-${tarea.priority}`}
                      style={{
                        marginLeft: `${(tarea.nivel || 0) * 20}px`,
                        borderLeft: tarea.nivel > 0 ? '3px solid #0bf516' : 'none',
                        position: 'relative'
                      }}
                    >
                      {tarea.nivel > 0 && (
                        <div className="hierarchy-indicator">
                          <span className="level-badge">Nivel {tarea.nivel}</span>
                          <span className="parent-indicator">└─</span>
                        </div>
                      )}
                      {editandoTarea === tarea.id ? (
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
                        <>
                          <div className="task-header">
                            <div className="task-title-container">
                              <span 
                                className="task-id" 
                                data-rol={tarea.idPorRol ? tarea.idPorRol.split('-')[258] : ''}
                              >
                                {tarea.idPorRol || `#${tarea.id}`}
                              </span>
                              <h4 className="task-title">{tarea.task}</h4>
                            </div>
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
                            </div>
                          </div>

                          <div className="task-info">
                            {tarea.due_date && (
                              <span className={`due-date ${esTareaVencida(tarea.due_date, tarea.status) ? 'overdue' : ''}`}>
                                📅 Vence: {formatearFecha(tarea.due_date)}
                              </span>
                            )}
                            {tarea.description && (
                              <p className="task-description">{tarea.description}</p>
                            )}
                            {esAdministrador() && filtros.show_all && (
                              <div className="task-admin-info">
                                <span className="assigned-user">
                                  👤 Asignado a: {obtenerNombreUsuario(tarea.user_id)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="task-actions">
                            {tarea.category === 'principal' && tarea.parent_task === null && puedeCrearTareas() && (
                              <button 
                                className="action-btn create-subtask-btn"
                                onClick={() => setMostrarFormularioSubtarea(tarea.id)}
                              >
                                Crear Subtarea
                              </button>
                            )}
                            <button 
                              className="action-btn view-btn"
                              onClick={() => verDetalleTarea(tarea.id)}
                            >
                              Ver
                            </button>
                            {(tarea.user_id === userId || puedeEditarTareas()) && (
                              <>
                                <button 
                                  className="action-btn edit-btn"
                                  onClick={() => iniciarEdicion(tarea)}
                                >
                                  Editar
                                </button>
                                <button 
                                  className="action-btn delete-btn"
                                  onClick={() => esAdministrador() ? eliminarTareaAdmin(tarea.id) : eliminarTarea(tarea.id)}
                                >
                                  Eliminar
                                </button>
                              </>
                            )}
                            {esAdministrador() && (
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
                                {usuarios.filter(u => u.rol !== 'pendiente' && u.id !== tarea.user_id).map(usuario => (
                                  <option key={usuario.id} value={usuario.id}>{usuario.nombre_completo}</option>
                                ))}
                              </select>
                            )}
                          </div>

                          {mostrarFormularioSubtarea === tarea.id && (
                            <div className="subtask-form">
                              <div className="form-header">
                                <h3>Crear Subtarea para: {tarea.task}</h3>
                                <button 
                                  className="close-btn"
                                  onClick={() => setMostrarFormularioSubtarea(null)}
                                >
                                  ×
                                </button>
                              </div>
                              <form onSubmit={(e) => crearSubtarea(e, tarea.id)} className="task-form">
                                <div className="form-row">
                                  <input 
                                    type="text" 
                                    placeholder="Título de la subtarea"
                                    value={nuevaSubtarea.task}
                                    onChange={(e) => setNuevaSubtarea({...nuevaSubtarea, task: e.target.value})}
                                    required
                                  />
                                  <select 
                                    value={nuevaSubtarea.priority}
                                    onChange={(e) => setNuevaSubtarea({...nuevaSubtarea, priority: e.target.value})}
                                  >
                                    <option value="high">Alta</option>
                                    <option value="medium">Media</option>
                                    <option value="low">Baja</option>
                                  </select>
                                  <select 
                                    value={nuevaSubtarea.status}
                                    onChange={(e) => setNuevaSubtarea({...nuevaSubtarea, status: e.target.value})}
                                  >
                                    <option value="pending">Pendiente</option>
                                    <option value="in_progress">En Progreso</option>
                                    <option value="completed">Completada</option>
                                    <option value="cancelled">Cancelada</option>
                                  </select>
                                </div>
                                <div className="form-row">
                                  <input 
                                    type="date" 
                                    value={nuevaSubtarea.due_date}
                                    onChange={(e) => setNuevaSubtarea({...nuevaSubtarea, due_date: e.target.value})}
                                    title="Fecha de vencimiento"
                                  />
                                </div>
                                {esAdministrador() && (
                                  <div className="form-row">
                                    <select 
                                      value={nuevaSubtarea.assigned_to || ''}
                                      onChange={(e) => setNuevaSubtarea({...nuevaSubtarea, assigned_to: e.target.value || null})}
                                    >
                                      <option value="">Asignar a mi mismo</option>
                                      {usuarios.filter(u => u.rol !== 'pendiente').map(usuario => (
                                        <option key={usuario.id} value={usuario.id}>{usuario.nombre_completo}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                                <div className="form-row">
                                  <textarea 
                                    placeholder="Descripción de la subtarea (opcional)"
                                    value={nuevaSubtarea.description}
                                    onChange={(e) => setNuevaSubtarea({...nuevaSubtarea, description: e.target.value})}
                                    rows={3}
                                  />
                                </div>
                                <div className="form-actions">
                                  <button type="submit" className="submit-btn">
                                    Crear Subtarea
                                  </button>
                                  <button 
                                    type="button" 
                                    className="cancel-btn"
                                    onClick={() => setMostrarFormularioSubtarea(null)}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {vistaDetalle && (
        <div className="task-detail-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{vistaDetalle.idPorRol || `#${vistaDetalle.id}`} - {vistaDetalle.task}</h3>
              <button className="close-btn" onClick={cerrarVistaDetalle}>×</button>
            </div>
            <div className="modal-body">
              <div className="task-details">
                <p><strong>ID:</strong> {vistaDetalle.idPorRol || `#${vistaDetalle.id}`}</p>
                <p><strong>ID Sistema:</strong> #{vistaDetalle.id}</p>
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