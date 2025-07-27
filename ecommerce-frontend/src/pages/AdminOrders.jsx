import React, { useState, useEffect } from "react";
import axios from "axios";
import endpoints from "../config";

const STATUS_OPTIONS = ["pending", "shipped", "out_for_delivery", "delivered"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [errorOrders, setErrorOrders] = useState("");
  const [statusUpdating, setStatusUpdating] = useState({});

  const [trackingCode, setTrackingCode] = useState("");
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [errorTrack, setErrorTrack] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [filterStatus, setFilterStatus] = useState("");
  const [isPaidFilter, setIsPaidFilter] = useState("");

  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch orders list
  useEffect(() => {
    async function fetchOrders() {
      setLoadingOrders(true);
      setErrorOrders("");
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams();
        if (filterStatus) params.append("status", filterStatus);
        if (isPaidFilter) params.append("is_paid", isPaidFilter);

        const { data } = await axios.get(
          `${endpoints.adminOrders}?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setOrders(Array.isArray(data) ? data : []);
        setCurrentPage(1);
      } catch (err) {
        setErrorOrders(err.response?.data?.detail || err.message);
      } finally {
        setLoadingOrders(false);
      }
    }
    fetchOrders();
  }, [filterStatus, isPaidFilter]);

  // Search by tracking code
  async function handleTrackOrder() {
    if (!trackingCode.trim()) {
      setErrorTrack("Please enter a tracking code");
      setSelectedOrder(null);
      return;
    }
    setLoadingTrack(true);
    setErrorTrack("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(endpoints.orderTrack(trackingCode.trim()), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedOrder(data);
    } catch (err) {
      setErrorTrack(err.response?.data?.detail || err.message);
      setSelectedOrder(null);
    } finally {
      setLoadingTrack(false);
    }
  }

  // Select order from list to view details
  function handleSelectOrder(order) {
    setSelectedOrder(order);
  }

  // Update order status
  async function handleStatusChange(orderId, newStatus) {
    const token = localStorage.getItem("token");
    setStatusUpdating((prev) => ({ ...prev, [orderId]: true }));

    try {
      // Important: prepend API_BASE_URL manually here
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const url = baseUrl + endpoints.adminUpdateOrderStatus(orderId);

      const { data } = await axios.patch(
        url,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: data.status } : o))
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: data.status }));
      }
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.detail || err.message));
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  }

  // Sorting and pagination
  const sortedOrders = [...orders].sort((a, b) => {
    const comp =
      sortField === "total_price"
        ? a.total_price - b.total_price
        : new Date(a.created_at) - new Date(b.created_at);
    return sortOrder === "asc" ? comp : -comp;
  });

  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = sortedOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

  function displayUser(user) {
    if (!user) return "N/A";
    if (typeof user === "string") return user;
    if (typeof user === "object") return user.username || user.email || "N/A";
    return "N/A";
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800">Admin Orders</h1>

      {/* Tracking Search */}
      <section className="mb-6 bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-3 text-gray-700">
          Track Order by Code
        </h2>
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="Enter Tracking Code"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTrackOrder()}
            className="border border-gray-300 rounded-md p-3 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            disabled={loadingTrack}
            onClick={handleTrackOrder}
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loadingTrack ? "Searching..." : "Track"}
          </button>
        </div>
        {errorTrack && <p className="text-red-600 mt-2">{errorTrack}</p>}
      </section>

      {/* Selected Order Details */}
      {selectedOrder && (
        <section className="mb-8 bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">
            Order Details (ID: {selectedOrder.id})
          </h2>
          <p>
            <strong>User:</strong> {displayUser(selectedOrder.user)}
          </p>
          <p>
            <strong>Status:</strong> {selectedOrder.status}
          </p>
          <p>
            <strong>Paid:</strong> {selectedOrder.is_paid ? "✅ Yes" : "❌ No"}
          </p>
          <p>
            <strong>Tracking Code:</strong> {selectedOrder.tracking_code || "N/A"}
          </p>
          <p>
            <strong>Total Price:</strong> Rs. {selectedOrder.total_price}
          </p>
          <p>
            <strong>Shipping Cost:</strong> Rs. {selectedOrder.shipping_cost}
          </p>
          <p>
            <strong>Created At:</strong>{" "}
            {new Date(selectedOrder.created_at).toLocaleString()}
          </p>
          <h3 className="mt-6 font-semibold">Items:</h3>
          <ul className="pl-4 list-disc mt-2 space-y-1">
            {selectedOrder.items && selectedOrder.items.length > 0 ? (
              selectedOrder.items.map((item) => (
                <li key={item.id}>
                  {item.product_name} — Qty: {item.quantity} — Price: Rs. {item.price}
                </li>
              ))
            ) : (
              <li>No items found.</li>
            )}
          </ul>
        </section>
      )}

      {/* Filters */}
      <section className="flex flex-wrap gap-4 mb-4 max-w-4xl mx-auto items-center">
        <div>
          <label className="mr-2 font-semibold" htmlFor="filterStatus">
            Filter Status:
          </label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mr-2 font-semibold" htmlFor="isPaidFilter">
            Filter Payment:
          </label>
          <select
            id="isPaidFilter"
            value={isPaidFilter}
            onChange={(e) => setIsPaidFilter(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">All</option>
            <option value="true">Paid</option>
            <option value="false">Not Paid</option>
          </select>
        </div>

        <div>
          <label className="mr-2 font-semibold" htmlFor="sortField">
            Sort By:
          </label>
          <select
            id="sortField"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="border rounded p-2"
          >
            <option value="created_at">Date Created</option>
            <option value="total_price">Total Price</option>
          </select>
        </div>
        <div>
          <label className="mr-2 font-semibold" htmlFor="sortOrder">
            Order:
          </label>
          <select
            id="sortOrder"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border rounded p-2"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </section>

      {/* Orders List */}
      <section className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">All Orders</h2>
        {loadingOrders ? (
          <p className="text-gray-500">Loading orders...</p>
        ) : errorOrders ? (
          <p className="text-red-600">{errorOrders}</p>
        ) : currentOrders.length === 0 ? (
          <p className="text-gray-600">No orders found.</p>
        ) : (
          <>
            <ul className="space-y-4 max-w-full">
              {currentOrders.map((order) => (
                <li
                  key={order.id}
                  onClick={() => handleSelectOrder(order)}
                  className={`border border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition ${
                    selectedOrder && selectedOrder.id === order.id
                      ? "bg-blue-100 border-blue-400"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-center flex-wrap">
                    <div className="space-y-1">
                      <p>
                        <strong>Order ID:</strong> {order.id}
                      </p>
                      <p>
                        <strong>User:</strong> {displayUser(order.user)}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value)
                          }
                          disabled={statusUpdating[order.id]}
                          className="ml-2 border px-2 py-1 rounded"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                        {statusUpdating[order.id] && (
                          <span className="ml-2 text-sm italic text-blue-600">
                            Updating...
                          </span>
                        )}
                      </p>
                      <p>
                        <strong>Paid:</strong> {order.is_paid ? "✅ Yes" : "❌ No"}
                      </p>
                      <p>
                        <strong>Total Price:</strong> Rs. {order.total_price}
                      </p>
                      <p>
                        <strong>Created At:</strong>{" "}
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm italic text-gray-600">
                        {order.tracking_code || "N/A"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-center mt-6 space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="px-3 py-1 rounded border border-gray-400 disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded border ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "border-gray-400"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="px-3 py-1 rounded border border-gray-400 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
