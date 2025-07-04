from django.urls import path, include
from rest_framework import routers
from django.contrib import admin#que hace esta cosa?
from .views import LoginViewSet, TaskViewSet, UserViewSet, TaskDetailsViewSet, CollaboratorViewSet, NotificationViewSet, ReportViewSet

router = routers.DefaultRouter()
router.register(r'login', LoginViewSet)
router.register(r'task', TaskViewSet)
router.register(r'user', UserViewSet)
router.register(r'task_details', TaskDetailsViewSet)
router.register(r'collaborator', CollaboratorViewSet)   
router.register(r'notification', NotificationViewSet)
router.register(r'report', ReportViewSet)   

urlpatterns = [#que hace esta cosa? VAMOS A ENLAZAR LAS URLS CON LAS VIEWS, Y VA BUSCAR LAS RUTAS EN EL ARCHIVO VIEWS.
    path('', include(router.urls)),

    #path('admin/', admin.site.urls),
    #path('api/', include('organizacion_tareas.urls')),
]