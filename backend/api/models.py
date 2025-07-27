from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.exceptions import ValidationError

#Custom user model
class User(AbstractUser):
    email = models.EmailField(unique=True)
    is_admin = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.username
    
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


#Product Model
class Product(models.Model):
    name = models.CharField(max_length=50, db_index=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    stock = models.IntegerField(default=0)
    image = models.ImageField(upload_to='product_images/', blank = True, null= True)
    category = models.ForeignKey(Category, null=False, blank=False, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
#Review model    
class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.IntegerField()  # e.g. 1 to 5
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'user')  # one review per user per product

    def __str__(self):
        return f'{self.user.username} review on {self.product.name}'

#Order model
class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("shipped", "Shipped"),
        ("out_for_delivery", "Out for Delivery"),
        ("delivered", "Delivered"),
    ]

    ALLOWED_CITIES = ["kathmandu", "bhaktapur", "lalitpur"]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_address = models.TextField(max_length=255, default="Unknown")
    city = models.CharField(max_length=50, default="kathmandu")
    shipping_cost = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    tracking_code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    is_paid = models.BooleanField(default=False)  # New field to track payment status
    created_at = models.DateTimeField(auto_now_add=True)

    def calculate_shipping_cost(self):
        if self.city.lower() not in self.ALLOWED_CITIES:
            return None
        return 0 if self.total_price >= 15000 else 100

    def clean(self):
        # Validate sequential status update
        if self.pk:  # only on updates, not on new objects
            old_status = Order.objects.get(pk=self.pk).status
            allowed_transitions = {
                "pending": ["shipped"],
                "shipped": ["out_for_delivery"],
                "out_for_delivery": ["delivered"],
                "delivered": [],  # final state
            }
            if self.status != old_status:
                if self.status not in allowed_transitions.get(old_status, []):
                    raise ValidationError(
                        f"Invalid status transition from '{old_status}' to '{self.status}'."
                    )

    def save(self, *args, **kwargs):
        is_new = self.pk is None  # Detect new order before saving

        shipping_fee = self.calculate_shipping_cost()
        if shipping_fee is None:
            raise ValueError("Shipping is only available in Kathmandu, Bhaktapur, and Lalitpur.")
        self.shipping_cost = shipping_fee
        
        self.full_clean()  # Calls clean(), so validation is done before saving

        super().save(*args, **kwargs)  # Save the instance

        if is_new and not self.tracking_code:
            self.tracking_code = f"TRK{self.pk:06d}"
            Order.objects.filter(pk=self.pk).update(tracking_code=self.tracking_code)

    def __str__(self):
        return f"Order {self.tracking_code or 'Pending'} by {self.user.username} - {self.status} - Paid: {self.is_paid}"
    
class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="cart")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default = 1)
    created_at = models.DateTimeField(auto_now_add= True)

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in {self.user.username}'s cart"
    
class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product.name} (Order {self.order.id})"