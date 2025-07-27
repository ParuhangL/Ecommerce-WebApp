"""
URL configuration for ecommerce project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.views.static import serve
from django.urls import re_path
from api.views import esewa_success, esewa_failure, esewa_payment_confirm

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path("esewa/success/", esewa_success, name="esewa_success"),
    path("esewa/failure/", esewa_failure, name="esewa_failure"),
]

urlpatterns += [
    # Serve media files through the view so middleware applies
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]