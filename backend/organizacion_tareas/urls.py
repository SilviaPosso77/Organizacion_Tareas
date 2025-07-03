from django.urls import path, include
from rest_framework import routers
from django.contrib import admin#que hace esta cosa?
from .views import LoginAPIView
from .views import(
LoginViewSet, TaksViewSet, UserViewSet, TaskDetailsViewSet, CollaboratorViewSet,
NotificationViewSet, ReportViewSet  
)

router = routers.DefaultRouter()
router.register(r'login', LoginViewSet)
router.register(r'taks', TaksViewSet)
router.register(r'user', UserViewSet)
router.register(r'task_details', TaskDetailsViewSet)
router.register(r'collaborator', CollaboratorViewSet)   
router.register(r'notification', NotificationViewSet)
router.register(r'report', ReportViewSet)   

urlpatterns = [#que hace esta cosa? VAMOS A ENLAZAR LAS URLS CON LAS VIEWS, Y VA BUSCAR LAS RUTAS EN EL ARCHIVO VIEWS.
    path('admin/', admin.site.urls),
    path('api/', include('organizacion_tareas.urls')),
]

###############
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        path('login-access/', LoginAPIView.as_view(), name='login-api'),

]
