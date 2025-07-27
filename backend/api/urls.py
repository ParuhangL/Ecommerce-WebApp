from django.urls import path
from .views import register, CustomTokenObtainPairView, ProductListCreateView, ProductDetailView, OrderListCreateView, CartListCreateView, CartDetailView, CheckoutView, get_admin_dashboard
from .views import search_products, recommend_products, track_order, esewa_failure,esewa_payment,esewa_success, create_order, get_orders, update_order_status, user_profile, update_order_total, ProductReviewView, MyProductReviewView
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from . import views
from .views import order_detail, filtered_orders, admin_update_order_status, list_user_orders, esewa_payment, esewa_payment_confirm

urlpatterns = [
    path('auth/register/', register, name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name = 'token_refresh'),
    path('auth/profile/', views.user_profile, name = 'user_profile'),
    path('products/', ProductListCreateView.as_view(), name = 'product-list-create'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name = 'product-detail'),
    path("orders/create/", create_order, name="create_order"),
    path('orders/<int:order_id>/update-total/', update_order_total, name='update_order_total'),
    path("orders/", get_orders, name="get_orders"),
    path("orders/<int:order_id>/update/", update_order_status, name="update_order_status"),
    path('cart/', CartListCreateView.as_view(), name= 'cart-list-create'),
    path('cart/<int:pk>/', CartDetailView.as_view(), name = 'cart-detail'),
    path('checkout/', CheckoutView.as_view(), name ='checkout'),
    path("esewa/payment/", esewa_payment, name="esewa_payment"),
    path("products/search/", search_products, name ="search_products"),
    path('products/<int:product_id>/recommend/', recommend_products, name='recommend_products'),
    path('products/<int:product_id>/reviews/', ProductReviewView.as_view(), name='product-reviews'),
    path('products/<int:product_id>/reviews/my/', MyProductReviewView.as_view(), name='my-product-review'),
    path('admin/dashboard/', views.get_admin_dashboard),
    path('admin/products/', views.admin_get_products),
    path('admin/products/create/', views.admin_create_product),
    path('admin/products/<int:pk>/update/', views.admin_update_product),
    path('admin/products/<int:pk>/delete/', views.admin_delete_product),
    path('admin/users/', views.admin_get_users),
    path('admin/users/<int:pk>/', views.admin_update_user, name='admin-user-update'),
    path('admin/categories/', views.admin_get_categories),
    path('admin/categories/create/', views.admin_create_category),
    path('admin/categories/<int:pk>/update/', views.admin_update_category),
    path('admin/categories/<int:pk>/delete/', views.admin_delete_category),
    path('admin/orders/', views.admin_get_orders, name='admin-get-orders'),
    path('track-order/<str:tracking_code>/', views.track_order, name='track-order'),
    path("orders/<int:pk>/", order_detail, name="order_detail"),
    path('api/admin/orders/', filtered_orders, name='filtered-orders'),
    path('admin/orders/<int:order_id>/status/', admin_update_order_status, name='admin_update_order_status'),
    path("user/orders/", views.list_user_orders, name="user-orders"),
    path("esewa/payment-confirm/", esewa_payment_confirm, name="esewa_payment_confirm"),
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


