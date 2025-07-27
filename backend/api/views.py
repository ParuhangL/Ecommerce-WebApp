import requests
import random
from rest_framework.response import Response
from rest_framework import status, generics, permissions, viewsets
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly, IsAdminUser, IsAuthenticated
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404, redirect
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from rest_framework.decorators import api_view, permission_classes
from django.db import transaction
from django.db.models import Q
from .serializers import UserSerializer, ProductSerializer, OrderSerializer, CartSerializer, ReviewSerializer, CategorySerializer,AdminOrderSerializer, UserRegistrationSerializer, AdminUserSerializer
from .models import Product, Order, Cart, OrderItem, Review, Category
from .permissions import IsVerifiedUser
from rest_framework.permissions import IsAdminUser
from .utils import generate_esewa_payment_url, calculate_shipping_cost, verify_esewa_payment
from django.core.mail import send_mail
from decimal import Decimal
from django.db import transaction
import hmac
import hashlib
import base64
import logging
import os
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes
from django.db.models import Sum, F, Count
from django.utils.timezone import now, timedelta
from django.db.models.functions import TruncDate
import xml.etree.ElementTree as ET
from decouple import config
from django.conf import settings
import json
from django.shortcuts import redirect
from django.http import HttpResponseBadRequest
from django.core.exceptions import ValidationError
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import FileResponse


logger = logging.getLogger(__name__)

SECRET_KEY = config("ESEWA_SECRET_KEY")
MERCHANT_CODE = config("ESEWA_MERCHANT_CODE")
LOCAL_URL = config("LOCAL_URL")
FRONTEND_SUCCESS_URL = settings.FRONTEND_SUCCESS_URL
FRONTEND_FAILURE_URL = settings.FRONTEND_FAILURE_URL



User = get_user_model()

# Login for token
class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        return Response({
            "token": response.data["access"],
            "refresh": response.data["refresh"]
        })

# Register new users and give token
@api_view(["POST"])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "User registered successfully",
            "token": str(refresh.access_token),
            "refresh": str(refresh)
        }, status=status.HTTP_201_CREATED)

    # Validation errors will look like: {"username": ["Already exists"], ...}
    print("❌ Registration error:", serializer.errors) 
    return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_staff
    })

# Product Views
class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

# Order Views
class OrderListCreateView(generics.ListCreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_order(request):
    user = request.user
    shipping_address = request.data.get("shipping_address")
    city = request.data.get("city")
    items_data = request.data.get("items")  # list of dicts with product_id and quantity

    if not shipping_address or not city or not items_data:
        return Response({"error": "shipping_address, city, and items are required."},
                        status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            total_price = Decimal('0.00')
            products_to_update = []

            # Lock product rows to prevent race conditions
            product_ids = [item["product_id"] for item in items_data]
            products = Product.objects.select_for_update().filter(id__in=product_ids)

            product_map = {product.id: product for product in products}

            for item in items_data:
                product_id = item.get("product_id")
                quantity = int(item.get("quantity", 0))
                if quantity <= 0:
                    return Response({"error": "Quantity must be positive."}, status=status.HTTP_400_BAD_REQUEST)

                product = product_map.get(product_id)
                if not product:
                    return Response({"error": f"Product with id {product_id} not found."}, status=status.HTTP_404_NOT_FOUND)

                if product.stock < quantity:
                    return Response(
                        {"error": f"Not enough stock for product '{product.name}'. Available: {product.stock}"},
                        status=status.HTTP_400_BAD_REQUEST)

                products_to_update.append((product, quantity))
                total_price += product.price * quantity

            # Temporarily create order to calculate shipping
            temp_order = Order(
                user=user,
                total_price=total_price,
                shipping_address=shipping_address,
                city=city,
            )

            # Calculate shipping cost using model logic
            shipping_fee = temp_order.calculate_shipping_cost()
            if shipping_fee is None:
                return Response({"error": "Shipping not available to this city."}, status=400)

            # Final total
            total_with_shipping = total_price + Decimal(shipping_fee)

            # Final order creation
            order = Order.objects.create(
                user=user,
                total_price=total_with_shipping,
                shipping_address=shipping_address,
                city=city,
            )

            # ✅ Only create OrderItems — don't reduce stock here!
            for product, quantity in products_to_update:
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price=product.price,
                )

    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(OrderSerializer(order).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_order_total(request, order_id):
    try:
        order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)

    total_price = request.data.get("total_price")
    if total_price is None:
        return Response({"error": "total_price required"}, status=400)

    try:
        order.total_price = float(total_price)
    except ValueError:
        return Response({"error": "Invalid total_price"}, status=400)

    try:
        order.save()  # This triggers calculate_shipping_cost() in model's save()
    except ValueError as e:
        return Response({"error": str(e)}, status=400)

    return Response({
        "total_price": order.total_price,
        "shipping_cost": float(order.shipping_cost),
        "status": order.status,
    })

@api_view(["GET"])
def get_orders(request):
    user = request.user
    
    if user.is_staff or user.is_superuser:
        # Admin can see all orders
        orders = Order.objects.all()
    else:
        # Normal user sees only their own orders
        orders = Order.objects.filter(user=user)

    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(["PATCH"])
def update_order_status(request, order_id):
    order = Order.objects.get(id=order_id)
    order.status = request.data.get("status", order.status)
    order.save()
    return Response({"message": "Order updated successfully!"})

# Cart Views
class CartListCreateView(generics.ListCreateAPIView):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        product = serializer.validated_data["product"]
        quantity = serializer.validated_data["quantity"]

        existing_cart_item = Cart.objects.filter(user=user, product=product).first()
        if existing_cart_item:
            new_quantity = existing_cart_item.quantity + quantity
            if product.stock < new_quantity:
                raise serializers.ValidationError(
                    f"Only {product.stock} items in stock for {product.name}"
                )
            existing_cart_item.quantity = new_quantity
            existing_cart_item.save()
        else:
            if product.stock < quantity:
                raise serializers.ValidationError(
                    f"Only {product.stock} items in stock for {product.name}"
                )
            serializer.save(user=user)


class CartDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        product = serializer.validated_data.get("product", None)
        quantity = serializer.validated_data.get("quantity", None)

        if product and quantity and product.stock < quantity:
            raise serializers.ValidationError(
                f"Only {product.stock} items in stock for {product.name}"
            )

        serializer.save()

# Checkout
class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        cart_items = Cart.objects.filter(user=user)

        if not cart_items:
            return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        total_price = sum(item.product.price * item.quantity for item in cart_items)

        with transaction.atomic():
            order = Order.objects.create(user=user, total_price=total_price)
            for item in cart_items:
                OrderItem.objects.create(order=order, product=item.product, quantity=item.quantity, price=item.product.price)
                item.product.stock -= item.quantity
                item.product.save()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

# Generate HMAC SHA-256 signature for eSewa payment form
def generate_esewa_signature(payload, secret_key):
    signed_fields = payload['signed_field_names'].split(',')
    data_to_sign = ",".join(f"{field}={payload[field]}" for field in signed_fields)

    logger.debug(f"Data to sign: {data_to_sign}")

    digest = hmac.new(secret_key.encode('utf-8'), data_to_sign.encode('utf-8'), hashlib.sha256).digest()
    signature = base64.b64encode(digest).decode()
    logger.debug(f"Generated signature: {signature}")
    return signature

# Verify payment status via eSewa API
def verify_esewa_payment(transaction_uuid, amount):
    verification_url = "https://rc.esewa.com.np/api/epay/transaction/status/"
    params = {
        'product_code': MERCHANT_CODE,
        'transaction_uuid': transaction_uuid,
        'total_amount': str(amount)
    }

    try:
        response = requests.get(verification_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        logger.info(f"🚀 eSewa verification response JSON: {data}")
        return data.get("status") == "COMPLETE"
    except requests.RequestException as e:
        logger.error(f"❌ Error during verification: {e}")
        return False
    except ValueError as e:
        logger.error(f"❌ JSON decode error during verification: {e}")
        return False

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def esewa_payment(request):
    try:
        raw_amount = request.data.get("amount")
        order_id = request.data.get("order_id")

        if not order_id or not raw_amount:
            return Response({"error": "Order ID and Amount are required"}, status=400)

        amount = Decimal(str(raw_amount))
        order = get_object_or_404(Order, id=order_id, total_price=amount)

        if request.user != order.user:
            return Response({"error": "Unauthorized"}, status=403)

        payload = {
            "amount": str(amount),
            "tax_amount": "0",
            "total_amount": str(amount),
            "transaction_uuid": f"ORDER_{order_id}_{order.user.id}",
            "product_code": MERCHANT_CODE,
            "product_service_charge": "0",
            "product_delivery_charge": "0",
            "success_url": f"{LOCAL_URL}/esewa/success/",
            "failure_url": f"{LOCAL_URL}/esewa/failure/",
            "scd": MERCHANT_CODE,
        }

        signed_fields = ["total_amount", "transaction_uuid", "product_code"]
        payload["signed_field_names"] = ",".join(signed_fields)
        payload["signature"] = generate_esewa_signature(payload, SECRET_KEY)

        return Response({
            "esewa_url": "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
            "payload": payload
        })

    except Exception as e:
        logger.exception("Error in esewa_payment:")
        return Response({"error": str(e)}, status=400)

@api_view(["GET", "POST"])
def esewa_success(request):
    encoded_data = request.GET.get("data")
    if encoded_data:
        try:
            decoded = base64.b64decode(encoded_data).decode("utf-8")
            data = json.loads(decoded)
            logger.info(f"🚀 eSewa success callback data: {data}")
        except Exception as e:
            logger.error(f"❌ Failed to decode eSewa data: {e}")
            return redirect(f"{FRONTEND_FAILURE_URL}?error=Invalid%20data%20param")
    else:
        data = request.GET if request.method == "GET" else request.data

    transaction_uuid = data.get("transaction_uuid")
    ref_id = data.get("transaction_code")
    amount = data.get("total_amount")

    if not transaction_uuid or not ref_id or not amount:
        logger.error(f"❌ Missing payment details in callback data: {data}")
        return redirect(f"{FRONTEND_FAILURE_URL}?error=Missing%20payment%20details")

    logger.info(f"🔍 Verifying eSewa payment for UUID={transaction_uuid}, Amount={amount}...")

    if verify_esewa_payment(transaction_uuid, amount):
        try:
            parts = transaction_uuid.split("_")
            if len(parts) < 2 or not parts[1].isdigit():
                logger.error(f"❌ Invalid transaction_uuid format: {transaction_uuid}")
                return redirect(f"{FRONTEND_FAILURE_URL}?error=Invalid%20transaction%20UUID%20format")

            db_order_id = int(parts[1])

            order = Order.objects.get(id=db_order_id)

            if order.is_paid:
                logger.info(f"ℹ️ Order {order.id} already marked as paid.")
                return redirect(f"{FRONTEND_SUCCESS_URL}?order_id={order.id}&reference_id={ref_id}&status=success")

            # Order not marked paid yet — just redirect to frontend for confirmation step
            return redirect(f"{FRONTEND_SUCCESS_URL}?order_id={order.id}&reference_id={ref_id}&status=pending")

        except Order.DoesNotExist:
            logger.error(f"❌ Order not found: {db_order_id}")
            return redirect(f"{FRONTEND_FAILURE_URL}?error=Order%20not%20found")

    else:
        logger.error(f"❌ Payment verification failed for transaction_uuid={transaction_uuid}, ref_id={ref_id}, amount={amount}")
        return redirect(f"{FRONTEND_FAILURE_URL}?error=Payment%20verification%20failed")

@api_view(["GET"])
def esewa_failure(request):
    return redirect(settings.FRONTEND_FAILURE_URL)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def esewa_payment_confirm(request):
    order_id = request.data.get("order_id")
    transaction_uuid = request.data.get("transaction_uuid")

    if not order_id or not transaction_uuid:
        return Response({"error": "order_id and transaction_uuid are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            order = Order.objects.select_for_update().get(id=order_id, user=request.user)

            if order.is_paid:
                return Response({"message": "Order is already paid"}, status=status.HTTP_200_OK)

            amount = order.total_price

            if not verify_esewa_payment(transaction_uuid, amount):
                return Response({"error": "Payment verification failed"}, status=status.HTTP_400_BAD_REQUEST)

            for item in order.items.all():
                product = item.product
                if product.stock < item.quantity:
                    return Response({"error": f"Insufficient stock for product {product.id}"}, status=status.HTTP_400_BAD_REQUEST)

            for item in order.items.all():
                product = item.product
                product.stock -= item.quantity
                product.save(update_fields=["stock"])

            order.is_paid = True
            if order.status == "pending":
                order.status = "shipped"
            order.save(update_fields=["is_paid", "status"])

    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    return Response({"message": "Payment confirmed and order updated", "order_id": order.id})


@api_view(["GET"])
def search_products(request):
    try:
        query = request.GET.get("q", "").strip()
        if not query:
            return Response([], status=status.HTTP_200_OK)

        products = Product.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )
        serialized = ProductSerializer(products, many=True, context={'request': request})  # pass request here
        return Response(serialized.data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Search error: {e}", exc_info=True)
        return Response(
            {"error": "An error occurred during product search."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
def product_detail(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    serializer = ProductSerializer(product, context={'request': request})
    return Response(serializer.data)

@api_view(["GET"])
def recommend_products(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

    # Content-based: same category excluding current product
    content_based = list(Product.objects.filter(category=product.category).exclude(id=product.id))

    # Collaborative (dummy): random products excluding current and content-based
    excluded_ids = [p.id for p in content_based] + [product.id]
    all_products = Product.objects.exclude(id__in=excluded_ids)
    random_based = random.sample(list(all_products), min(3, all_products.count()))

    # Combine recommendations, limit total if desired
    combined_recommendations = content_based[:5] + random_based

    serializer = ProductSerializer(combined_recommendations, many=True, context={'request': request})
    return Response(serializer.data)

def send_order_update_email(order):
    subject = f"Order Update: {order.tracking_code}"
    message = f"Your order {order.tracking_code} is now {order.status}."
    recipient = order.user.email

    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER,
        [recipient],
        fail_silently=False,
    )

@api_view(["PATCH"])
def update_order_status(request, order_id):
    order = Order.objects.get(id=order_id)
    new_status = request.data.get("status", order.status)

    if order.status != new_status:
        order.status = new_status
        order.save()
        send_order_update_email(order)

    return Response({"message": f"Order {order.tracking_code} updated to {new_status}."})

#Track order
@api_view(["GET"])
@permission_classes([IsAuthenticatedOrReadOnly])
def track_order(request, tracking_code):
    try:
        order = Order.objects.get(tracking_code=tracking_code)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    print("Request user:", request.user)
    print("Order user:", order.user)

    if request.user.is_authenticated and order.user != request.user:
        return Response({"error": "Not authorized to view this order"}, status=status.HTTP_403_FORBIDDEN)

    serializer = OrderSerializer(order, context={'request': request})
    return Response(serializer.data)

    

class ProductReviewView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, product_id):
        reviews = Review.objects.filter(product_id=product_id).select_related('user')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)

        # Prevent multiple reviews by the same user for the same product
        if Review.objects.filter(product=product, user=request.user).exists():
            return Response(
                {"detail": "You have already posted a review for this product. Please edit or delete your existing review."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReviewSerializer(
            data=request.data,
            context={'request': request, 'product': product}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyProductReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):
        review = get_object_or_404(Review, product_id=product_id, user=request.user)
        serializer = ReviewSerializer(review)
        return Response(serializer.data)

    def put(self, request, product_id):
        review = get_object_or_404(Review, product_id=product_id, user=request.user)
        serializer = ReviewSerializer(
            review,
            data=request.data,
            context={'request': request, 'product': review.product},
            partial=False
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, product_id):
        review = get_object_or_404(Review, product_id=product_id, user=request.user)
        serializer = ReviewSerializer(
            review,
            data=request.data,
            context={'request': request, 'product': review.product},
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, product_id):
        review = get_object_or_404(Review, product_id=product_id, user=request.user)
        review.delete()
        return Response({"detail": "Review deleted."}, status=status.HTTP_204_NO_CONTENT)

@api_view(["GET"])
@permission_classes([IsAdminUser])
def get_admin_dashboard(request):
    range_param = request.GET.get("range", "7d")
    today = now().date()

    if range_param == "7d":
        start_date = today - timedelta(days=7)
    elif range_param == "30d":
        start_date = today - timedelta(days=30)
    else:
        start_date = None  # all time

    orders = Order.objects.all()
    if start_date:
        orders = orders.filter(created_at__date__gte=start_date)

    # Filter only paid orders regardless of status
    paid_orders = orders.filter(is_paid=True)

    # 1. Sales Over Time
    sales_over_time = (
        paid_orders.annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(total_sales=Sum("total_price"))
        .order_by("date")
    )

    # 2. Top 5 Best Selling Products
    top_products = (
        OrderItem.objects.filter(order__in=paid_orders)
        .values(name=F("product__name"))
        .annotate(sales=Sum(F("price") * F("quantity")))
        .order_by("-sales")[:5]
    )

    # 3. Sales by Category
    sales_by_category = (
        OrderItem.objects.filter(order__in=paid_orders)
        .values(category=F("product__category__name"))
        .annotate(sales=Sum(F("price") * F("quantity")))
        .order_by("-sales")
    )

    products = Product.objects.all()
    categories = Category.objects.all()
    users = User.objects.all()

    return Response({
        "total_products": products.count(),
        "total_orders": orders.count(),
        "total_categories": categories.count(),
        "total_users": users.count(),

        "products": ProductSerializer(products, many=True).data,
        "orders": OrderSerializer(orders, many=True).data,
        "categories": CategorySerializer(categories, many=True).data,
        "users": UserSerializer(users, many=True).data,

        "sales_over_time": sales_over_time,
        "top_products": top_products,
        "sales_by_category": sales_by_category,
    })


# Get all products
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_get_products(request):
    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)

# Create product
@api_view(['POST'])
@permission_classes([IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def admin_create_product(request):
    serializer = ProductSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Update product
@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_update_product(request, pk):
    product = Product.objects.get(pk=pk)
    serializer = ProductSerializer(product, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Delete product
@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_product(request, pk):
    product = Product.objects.get(pk=pk)
    product.delete()
    return Response({"detail": "Product deleted"})

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_get_users(request):
    users = User.objects.all().order_by('-date_joined')
    serializer = AdminUserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_update_user(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = AdminUserSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_category(request):
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_update_category(request, pk):
    category = Category.objects.get(pk=pk)
    serializer = CategorySerializer(category, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_category(request, pk):
    category = Category.objects.get(pk=pk)
    category.delete()
    return Response({"detail": "Category deleted"})

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_get_orders(request):
    orders = Order.objects.all().order_by('-created_at')  # newest first

    # Get query params
    is_paid = request.query_params.get('is_paid')  # 'true' or 'false'
    status = request.query_params.get('status')    # e.g. "pending,shipped"

    # Filter by payment status using the boolean field
    if is_paid is not None:
        if is_paid.lower() == 'true':
            orders = orders.filter(is_paid=True)
        elif is_paid.lower() == 'false':
            orders = orders.filter(is_paid=False)

    # Filter by delivery status
    if status:
        statuses = [s.strip() for s in status.split(',')]
        orders = orders.filter(status__in=statuses)

    serializer = OrderSerializer(orders, many=True, context={'request': request})
    return Response(serializer.data)




class AdminOrderListView(generics.ListAPIView):
    serializer_class = AdminOrderSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Order.objects.prefetch_related('order_items__product').all()
    

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_users(request):
    users = User.objects.all()
    serializer = AdminUserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)
    
@api_view(['GET'])
@permission_classes([IsAdminUser])  # Only admins can access
def filtered_orders(request):
    paid_param = request.query_params.get('paid')
    status_param = request.query_params.get('status')

    orders = Order.objects.all()

    if paid_param is not None:
        is_paid = paid_param.lower() == 'true'
        orders = orders.filter(is_paid=is_paid)

    if status_param:
        statuses = [s.strip() for s in status_param.split(',') if s.strip()]
        if statuses:
            orders = orders.filter(status__in=statuses)

    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_update_order_status(request, order_id):
    """
    Admin-only view to update the delivery status of an order.
    Accepts 'status' in the request body.
    """
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    valid_statuses = dict(Order.STATUS_CHOICES)

    if new_status not in valid_statuses:
        return Response({'detail': f'Invalid status. Valid options: {", ".join(valid_statuses)}'},
                        status=status.HTTP_400_BAD_REQUEST)

    order.status = new_status

    try:
        order.full_clean()  # You can remove this if no custom validation is added
        order.save(update_fields=['status'])
    except ValidationError as e:
        return Response({'detail': e.messages}, status=status.HTTP_400_BAD_REQUEST)

    serializer = OrderSerializer(order)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_user_orders(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

