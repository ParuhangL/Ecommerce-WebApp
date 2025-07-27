import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminDashboard } from "../api/admin";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#4ade80", "#60a5fa", "#facc15", "#f87171", "#c084fc"];

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [filter, setFilter] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    getAdminDashboard(filter)
      .then((res) => {
        setDashboard(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch admin dashboard", err);
        setError("Failed to load dashboard. Please try again.");
        setLoading(false);
      });
  }, [navigate, filter]);

  if (loading) return <p className="p-4">Loading Dashboard...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!dashboard) return <p className="p-4 text-red-500">No data found.</p>;

  const salesData = dashboard.sales_over_time || [];
  const topProducts = dashboard.top_products || [];
  const categorySales = dashboard.sales_by_category || [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          title="Logout"
        >
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-100 p-4 rounded-xl shadow">
          <h2 className="text-sm text-gray-600">Total Products</h2>
          <p className="text-xl font-bold">{dashboard.total_products}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-xl shadow">
          <h2 className="text-sm text-gray-600">Total Orders</h2>
          <p className="text-xl font-bold">{dashboard.total_orders}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-xl shadow">
          <h2 className="text-sm text-gray-600">Total Categories</h2>
          <p className="text-xl font-bold">{dashboard.total_categories}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-xl shadow">
          <h2 className="text-sm text-gray-600">Total Users</h2>
          <p className="text-xl font-bold">{dashboard.total_users}</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-4 flex gap-2">
        {["7d", "30d", "all"].map((range) => (
          <button
            key={range}
            onClick={() => setFilter(range)}
            className={`px-4 py-1 rounded-lg ${
              filter === range
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {range === "7d"
              ? "Last 7 Days"
              : range === "30d"
              ? "Last 30 Days"
              : "All Time"}
          </button>
        ))}
      </div>

      {/* Sales Over Time */}
      <h2 className="text-xl font-semibold mb-2">Sales Analytics</h2>
      <div className="w-full h-80 bg-white p-4 rounded-xl shadow mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, "auto"]} tickFormatter={(v) => `Rs ${v / 1000}k`} />
            <Tooltip
              formatter={(value) =>
                typeof value === "number" ? `Rs ${value.toLocaleString()}` : value
              }
            />
            <Bar dataKey="total_sales" fill="#4ade80" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products */}
      <h2 className="text-xl font-semibold mb-2">Top 5 Best Selling Products</h2>
      <div className="w-full h-80 bg-white p-4 rounded-xl shadow mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topProducts} layout="vertical">
            <XAxis
              type="number"
              domain={[0, "auto"]}
              tickFormatter={(v) => `Rs ${v / 1000}k`}
            />
            <YAxis type="category" dataKey="name" width={150} />
            <Tooltip
              formatter={(value) =>
                typeof value === "number" ? `Rs ${value.toLocaleString()}` : value
              }
            />
            <Bar dataKey="sales" fill="#60a5fa" barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sales by Category */}
      <h2 className="text-xl font-semibold mb-2">Sales by Category</h2>
      <div className="w-full h-96 bg-white p-4 rounded-xl shadow">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categorySales}
              dataKey="sales"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
            >
              {categorySales.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) =>
                typeof value === "number" ? `Rs ${value.toLocaleString()}` : value
              }
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AdminDashboard;
