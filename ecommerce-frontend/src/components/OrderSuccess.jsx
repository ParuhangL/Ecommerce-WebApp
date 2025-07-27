import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import endpoints from "../config";

function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const refId = searchParams.get("reference_id");

  const { clearCart } = useCart();
  const { user, loading: userLoading } = useUser();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const confirmAndFetchOrder = async () => {
      try {
        if (!user?.id || !orderId || !refId || !token) {
          console.warn("Missing payment or user info.");
          setError("Missing payment or user info.");
          setLoading(false);
          return;
        }

        const transactionUuid = `ORDER_${orderId}_${user.id}`;

        // Confirm payment to backend and check response
        const confirmResponse = await axios.post(
          endpoints.esewaPaymentConfirm,
          {
            order_id: orderId,
            transaction_uuid: transactionUuid,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (confirmResponse.status !== 200) {
          throw new Error("Payment confirmation failed.");
        }

        // Fetch order details
        const response = await axios.get(`${endpoints.orders}/${orderId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOrder(response.data);
        clearCart();
      } catch (err) {
        console.error("Payment confirmation or order fetch failed:", err);
        setError(
          err.response?.data?.error || err.message || "Failed to confirm payment or load order."
        );
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) {
      confirmAndFetchOrder();
    }
  }, [userLoading, user?.id, orderId, refId]);

  // Fallback timeout in case nothing resolves
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setError("Something took too long. Please check your order manually.");
        setLoading(false);
      }
    }, 10000); // 10 seconds

    return () => clearTimeout(timeout);
  }, [loading]);

  if (error) {
    return (
      <div className="text-center mt-10 text-red-600">
        <p className="mb-4 font-semibold">⚠️ {error}</p>
        <a href="/" className="text-blue-600 underline">
          Return to Home
        </a>
      </div>
    );
  }

  if (loading || !order) {
    return <p className="text-center mt-10">Processing your order...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-10">
      <h1 className="text-3xl font-bold text-green-600 mb-4">✅ Payment Successful!</h1>
      <p className="text-gray-700 mb-2">Order #{order.id} has been placed.</p>
      <p className="text-sm text-gray-500 mb-4">Ref ID: {refId}</p>

      <h2 className="text-xl font-semibold mb-2">Order Summary</h2>
      <ul className="mb-4">
        {(order.items || []).map((item) => (
          <li
            key={item.id}
            className="flex justify-between border-b py-2 text-sm"
          >
            <span>{item.product.name} (x{item.quantity})</span>
            <span>Rs. {item.total_price}</span>
          </li>
        ))}
      </ul>

      <p className="text-right text-lg font-semibold">Total: Rs. {order.total_price}</p>
      <p className="text-sm text-gray-500">Shipping: Rs. {order.shipping_cost}</p>
      <p className="text-sm text-gray-500 mb-4">
        To: {order.shipping_address}, {order.city}
      </p>

      <a href="/" className="text-blue-600 underline">
        Go back to Home
      </a>
    </div>
  );
}

export default OrderSuccess;
