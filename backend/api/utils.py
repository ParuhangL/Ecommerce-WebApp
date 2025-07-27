import requests
from django.conf import settings


def calculate_shipping_cost(city, total_price):
    ALLOWED_CITIES = ["kathmandu", "bhaktapur", "lalitpur"]
    FIXED_SHIPPING_COST = 70
    FREE_SHIPPING_THRESHOLD = 5000

    if city.lower() not in ALLOWED_CITIES:
        return None  # Shipping not available

    return 0 if total_price >= FREE_SHIPPING_THRESHOLD else FIXED_SHIPPING_COST

ESEWA_PAYMENT_URL = "https://esewa.com.np/epay/main"
ESEWA_VERIFY_URL = "https://uat.esewa.com.np/epay/transrec"

def generate_esewa_payment_url(order_id, amount):
    """
    Generates the eSewa payment URL for redirection.
    """
    payload = {
        "amt": amount,
        "pdc": 0,
        "psc": 0,
        "txAmt": 0,
        "tAmt": amount,
        "pid": order_id,
        "scd": settings.ESEWA_MERCHANT_ID,
        "su": settings.ESEWA_RETURN_URL,
        "fu": settings.ESEWA_FAILURE_URL,
    }

    return f"{ESEWA_PAYMENT_URL}?{'&'.join(f'{k}={v}' for k, v in payload.items())}"


def verify_esewa_payment(order_id, ref_id, amount):
    """
    Verifies an eSewa transaction using eSewa's API.
    """
    verification_payload = {
        "amt": amount,
        "scd": settings.ESEWA_MERCHANT_ID,
        "rid": ref_id,
        "pid": order_id,
    }

    response = requests.post(ESEWA_VERIFY_URL, data=verification_payload)

    return "Success" in response.text  # Returns True if payment is verified
