import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createOrder } from "../api/order";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import endpoints from "../config";

function Checkout() {
  const { cartItems: cart, clearCart } = useCart();
  const { user, loading } = useUser();
  const navigate = useNavigate();

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("kathmandu");
  const [loadingPayment, setLoadingPayment] = useState(false);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCharge = totalAmount >= 15000 ? 0 : 100;
  const finalTotal = totalAmount + shippingCharge;

  const handleCheckout = async () => {
    if (loadingPayment) return;
    setLoadingPayment(true);

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in to proceed with payment.");
      setLoadingPayment(false);
      return;
    }

    if (!address.trim()) {
      alert("Please enter a shipping address.");
      setLoadingPayment(false);
      return;
    }

    try {
      // 1. Create order in backend
      const orderResponse = await createOrder(
        {
          shipping_address: address,
          city,
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
        },
        token
      );

      const { id: order_id } = orderResponse.data;

      // 2. Get eSewa payment payload from backend
      const esewaResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}${endpoints.esewaPayment}`,
        { amount: finalTotal, order_id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { esewa_url, payload } = esewaResponse.data;

      if (esewa_url && payload) {
        // Create and submit form to eSewa payment gateway
        const form = document.createElement("form");
        form.method = "POST";
        form.action = esewa_url;

        Object.entries(payload).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();

        // Optional: form cleanup but usually page will unload
        // document.body.removeChild(form);
      } else {
        alert("Failed to get eSewa payment URL. Please try again.");
        setLoadingPayment(false);
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      alert(error.response?.data?.error || "Order or payment failed!");
      setLoadingPayment(false);
    }
  };

  if (loading) return <p>Loading checkout...</p>;

  if (!user || cart.length === 0) {
    return <p>Invalid checkout data. Please return to the cart.</p>;
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Checkout</h2>
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Shipping Address"
        className="border p-2 w-full mb-2"
      />
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="border p-2 w-full mb-4"
      >
        <option value="kathmandu">Kathmandu</option>
        <option value="bhaktapur">Bhaktapur</option>
        <option value="lalitpur">Lalitpur</option>
      </select>
      <p className="mb-2">Subtotal: Rs. {totalAmount}</p>
      <p className="mb-2">Delivery Charge: Rs. {shippingCharge}</p>
      <h3 className="font-semibold mb-4">Total Amount: Rs. {finalTotal}</h3>
      <button
        onClick={handleCheckout}
        disabled={loadingPayment}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loadingPayment ? "Processing..." : "Proceed to Pay with eSewa"}
      </button>
    </div>
  );
}

export default Checkout;
