import React, { useState, useEffect } from "react";
import { trackOrder, getUserOrders } from "../api/order";

function TrackOrder() {
  const [trackingCode, setTrackingCode] = useState("");
  const [order, setOrder] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      const response = await getUserOrders();
      console.log("User orders API response:", response.data);
      setAllOrders(response.data);
    } catch (err) {
      setError("Failed to load your orders.");
    }
  };

  const handleTrackOrder = async () => {
    const trimmedCode = trackingCode.trim();
    if (!trimmedCode) {
      setError("Please enter a tracking code.");
      setOrder(null);
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await trackOrder(trimmedCode);
      setOrder(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Order not found");
      } else if (err.response?.status === 403) {
        setError("Not authorized to view this order");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTrackOrder();
    }
  };

  const handleChange = (e) => {
    setTrackingCode(e.target.value);
    if (error) setError("");
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Track Your Order</h2>

      {/* Search input */}
      <div className="flex items-center mb-4">
        <input
          type="text"
          value={trackingCode}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          placeholder="Enter Tracking Code"
          className="w-full border p-2 rounded"
        />
        <button
          onClick={handleTrackOrder}
          disabled={loading || !trackingCode.trim()}
          className={`ml-2 px-4 py-2 rounded text-white ${
            loading || !trackingCode.trim()
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Tracking..." : "Track"}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {/* Single order details */}
      {order && (
        <div className="mt-4 border p-4 rounded bg-gray-50">
          <p><strong>Tracking Code:</strong> {order.tracking_code}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Total Price:</strong> Rs {order.total_price}</p>
          <p><strong>Shipping Address:</strong> {order.shipping_address}</p>
          <p><strong>City:</strong> {order.city}</p>
          <p><strong>Order Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
        </div>
      )}

      {/* List of all orders */}
      {allOrders.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">Your Orders</h3>
          <div className="space-y-4">
            {allOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 border rounded bg-gray-50 hover:bg-gray-100 cursor-pointer"
                onClick={() => setOrder(ord)}
              >
                <p><strong>Tracking Code:</strong> {ord.tracking_code}</p>
                <p><strong>Status:</strong> {ord.status}</p>
                <p><strong>Total:</strong> Rs {ord.total_price}</p>
                <p><strong>Placed on:</strong> {new Date(ord.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TrackOrder;
