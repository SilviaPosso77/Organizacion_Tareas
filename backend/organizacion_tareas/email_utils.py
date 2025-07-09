from django.core.mail import send_mail
from django.conf import settings
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)

def enviar_email_asignacion_tarea(usuario, tarea):
    """
    Envía un email al usuario cuando se le asigna una tarea
    """
    if not usuario or not usuario.email:
        logger.warning(f"Usuario {usuario.nombre_completo if usuario else 'None'} no tiene email registrado")
        return False, "El usuario no tiene email registrado"
    
    try:
        # Obtener nombres amigables para mostrar
        prioridad_display = {
            'low': 'Baja',
            'medium': 'Media', 
            'high': 'Alta',
            'urgent': 'Urgente'
        }.get(tarea.priority, tarea.priority)
        
        estado_display = {
            'pending': 'Pendiente',
            'in_progress': 'En Progreso',
            'completed': 'Completada',
            'cancelled': 'Cancelada',
            'on_hold': 'En Espera'
        }.get(tarea.status, tarea.status)
        
        asunto = f"Nueva tarea asignada: {tarea.task}"
        
        # Contenido del email en HTML
        mensaje_html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .task-details {{ 
                    border: 2px solid #4CAF50; 
                    border-radius: 8px; 
                    padding: 15px; 
                    margin: 15px 0; 
                    background-color: #f9f9f9;
                }}
                .priority-high {{ border-color: #f44336; }}
                .priority-medium {{ border-color: #ff9800; }}
                .priority-low {{ border-color: #4CAF50; }}
                .footer {{ background-color: #f5f5f5; padding: 15px; text-align: center; color: #666; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎯 Nueva Tarea Asignada</h1>
            </div>
            
            <div class="content">
                <p>Hola <strong>{usuario.nombre_completo}</strong>,</p>
                <p>Se te ha asignado una nueva tarea en el sistema de gestión:</p>
                
                <div class="task-details priority-{tarea.priority}">
                    <h2>📋 {tarea.task}</h2>
                    <p><strong>📝 Descripción:</strong> {tarea.description or 'Sin descripción específica'}</p>
                    <p><strong>⚡ Prioridad:</strong> {prioridad_display}</p>
                    <p><strong>📊 Estado:</strong> {estado_display}</p>
                    <p><strong>📅 Fecha límite:</strong> {tarea.due_date.strftime('%d/%m/%Y') if tarea.due_date else 'No especificada'}</p>
                    <p><strong>🏁 Fecha de inicio:</strong> {tarea.start_date.strftime('%d/%m/%Y') if tarea.start_date else 'No especificada'}</p>
                    {f'<p><strong>⏱️ Horas estimadas:</strong> {tarea.estimated_hours} horas</p>' if tarea.estimated_hours else ''}
                    {f'<p><strong>🏷️ Etiquetas:</strong> {tarea.tags}</p>' if tarea.tags else ''}
                </div>
                
                <p>Por favor, revisa la tarea en el sistema y comienza a trabajar en ella.</p>
                <p><strong>¡Recuerda actualizar el progreso a medida que avances!</strong></p>
            </div>
            
            <div class="footer">
                <p>Este es un mensaje automático del Sistema de Gestión de Tareas - CENSA SAS</p>
                <p>No respondas a este correo.</p>
            </div>
        </body>
        </html>
        """
        
        # Versión en texto plano
        mensaje_texto = f"""
        Nueva tarea asignada: {tarea.task}
        
        Hola {usuario.nombre_completo},
        
        Se te ha asignado una nueva tarea:
        
        Título: {tarea.task}
        Descripción: {tarea.description or 'Sin descripción'}
        Prioridad: {prioridad_display}
        Estado: {estado_display}
        Fecha límite: {tarea.due_date.strftime('%d/%m/%Y') if tarea.due_date else 'No especificada'}
        
        Por favor, revisa la tarea en el sistema.
        
        Saludos,
        Sistema de Gestión de Tareas - CENSA SAS
        """
        
        # Enviar el email
        send_mail(
            asunto,
            mensaje_texto,
            settings.DEFAULT_FROM_EMAIL,
            [usuario.email],
            html_message=mensaje_html,
            fail_silently=False,
        )
        
        logger.info(f"Email enviado exitosamente a {usuario.email} para la tarea: {tarea.task}")
        return True, "Email enviado exitosamente"
        
    except Exception as e:
        error_msg = f"Error al enviar email a {usuario.email}: {str(e)}"
        logger.error(error_msg)
        return False, error_msg


def enviar_email_tarea_modificada(usuario, tarea, cambios):
    """
    Envía un email cuando se modifica una tarea asignada
    """
    if not usuario or not usuario.email:
        return False, "El usuario no tiene email registrado"
    
    try:
        asunto = f"Tarea modificada: {tarea.task}"
        
        cambios_texto = "\n".join([f"- {cambio}" for cambio in cambios])
        
        mensaje_html = f"""
        <html>
        <body>
            <h2>🔄 Tarea Modificada</h2>
            <p>Hola {usuario.nombre_completo},</p>
            <p>Se ha modificado una de tus tareas asignadas:</p>
            
            <div style="border: 1px solid #ff9800; padding: 15px; margin: 10px 0; background-color: #fff3e0;">
                <h3>{tarea.task}</h3>
                <p><strong>Cambios realizados:</strong></p>
                <ul>
                    {"".join([f"<li>{cambio}</li>" for cambio in cambios])}
                </ul>
            </div>
            
            <p>Por favor, revisa los cambios en el sistema.</p>
            <p>Saludos,<br>Sistema de Gestión de Tareas</p>
        </body>
        </html>
        """
        
        mensaje_texto = f"""
        Tarea modificada: {tarea.task}
        
        Hola {usuario.nombre_completo},
        
        Se ha modificado una de tus tareas:
        
        Título: {tarea.task}
        
        Cambios realizados:
        {cambios_texto}
        
        Por favor, revisa los cambios en el sistema.
        
        Saludos,
        Sistema de Gestión de Tareas
        """
        
        send_mail(
            asunto,
            mensaje_texto,
            settings.DEFAULT_FROM_EMAIL,
            [usuario.email],
            html_message=mensaje_html,
            fail_silently=False,
        )
        
        logger.info(f"Email de modificación enviado a {usuario.email} para la tarea: {tarea.task}")
        return True, "Email enviado exitosamente"
        
    except Exception as e:
        error_msg = f"Error al enviar email de modificación: {str(e)}"
        logger.error(error_msg)
        return False, error_msg
