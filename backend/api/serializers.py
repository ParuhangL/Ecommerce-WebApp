from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Product, Order, Cart, OrderItem
from .models import Review, Category
import re


User = get_user_model()

#User model serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_username(self, value):
        # Username must start with a letter, then letters/numbers/underscores, length 3-20
        if not re.match(r'^[a-zA-Z][a-zA-Z0-9_]{2,19}$', value):
            raise serializers.ValidationError(
                "Username must start with a letter and be 3–20 characters long, containing only letters, numbers, or underscores."
            )
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already in use.")
        return value

    def validate_password(self, value):
        # Password must have at least 8 characters, uppercase, lowercase, digit, special char
        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$', value):
            raise serializers.ValidationError(
                "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
            )
        return value

    def create(self, validated_data):
        user = User(
            username=validated_data["username"],
            email=validated_data["email"]
        )
        user.set_password(validated_data["password"])
        user.save()
        return user

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField(read_only=True)
    product = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'product', 'user', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'created_at', 'product']

    def get_user(self, obj):
        return {
            "id": obj.user.id,
            "username": obj.user.username,
        }

    def create(self, validated_data):
        request = self.context['request']
        product = self.context['product']
        user = request.user

        # Check for duplicate review
        if Review.objects.filter(user=user, product=product).exists():
            raise serializers.ValidationError("You have already reviewed this product.")

        validated_data['user'] = user
        validated_data['product'] = product
        return super().create(validated_data)
    
#Product model serializer
class ProductSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    reviews = ReviewSerializer(many=True, read_only=True)

    image_url = serializers.SerializerMethodField()  # for frontend use
    image = serializers.ImageField(required=False, allow_null=True)  # allow uploading

    class Meta:
        model = Product
        fields = '__all__'

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None



class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source= "product.name", read_only= True)
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset= Product.objects.all(), write_only =True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)  # Ensure price is a number

    class Meta:
        model = OrderItem
        fields = ['id','product_name', 'product', 'product_id', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = serializers.ReadOnlyField(source='user.username')
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    status = serializers.CharField(read_only=True)
    shipping_cost = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    is_paid = serializers.BooleanField(read_only=True)  
    class Meta:
        model = Order
        fields = [
            'id',
            'user',
            'total_price',
            'shipping_cost',
            'status',
            'created_at',
            'tracking_code',
            'items',
            'is_paid',   
        ]


class CartSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only = True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'product', 'quantity']
        extra_kwargs = {'user': {'read_only': True}}

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class AdminOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(source='order_items', many=True, read_only=True)
    user = serializers.StringRelatedField()

    class Meta:
        model = Order
        fields = [
            'id',
            'user',
            'status',
            'shipping_address',
            'tracking_code',
            'created_at',
            'total_price',
            'shipping_cost',
            'items',
            'is_paid',   # Add this!
        ]


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'is_superuser', 'date_joined']
        read_only_fields = ['date_joined', 'id']
