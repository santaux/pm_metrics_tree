from django.urls import path
from . import views

urlpatterns = [
    path('', views.tree_view, name='tree'),
    path('api/tree/', views.tree_data_api, name='tree_data_api'),
    path('api/node/<slug:slug>/', views.node_detail_api, name='node_detail_api'),
]
