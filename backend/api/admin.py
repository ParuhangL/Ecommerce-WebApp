from django.contrib import admin
from .models import Product, Order, OrderItem, Category
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

User = get_user_model()

# Inline order items for better admin view
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

# Customize Order admin panel
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'total_price', 'status', 'created_at']
    inlines = [OrderItemInline]

# Custom User Admin
class CustomUserAdmin(UserAdmin):
    model = User

    list_display = ('username', 'email', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active')

    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        (_('Permissions'), {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )

    search_fields = ('username', 'email')
    ordering = ('username',)

# Register models
admin.site.register(Product)
admin.site.register(Order, OrderAdmin)
admin.site.register(OrderItem)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']

admin.site.register(User, CustomUserAdmin)
