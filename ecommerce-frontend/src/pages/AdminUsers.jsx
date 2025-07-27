import { useEffect, useState } from "react";
import axios from "axios";
import endpoints from "../config";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updateLoadingIds, setUpdateLoadingIds] = useState(new Set());
  const [updateErrorIds, setUpdateErrorIds] = useState(new Set());
  const [editUserId, setEditUserId] = useState(null);
  const [editedUser, setEditedUser] = useState({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await axios.get(endpoints.adminUsers, { headers });
      setUsers(res.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date)) return "Invalid Date";
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const startEditing = (user) => {
    setEditUserId(user.id);
    setEditedUser({
      username: user.username || "",
      email: user.email || "",
      role: user.is_superuser ? "Super Admin" : user.is_staff ? "Admin" : "Customer",
    });
    setUpdateErrorIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(user.id);
      return newSet;
    });
  };

  const cancelEditing = () => {
    setEditUserId(null);
    setEditedUser({});
  };

  const handleInputChange = (field, value) => {
    setEditedUser((prev) => ({ ...prev, [field]: value }));
  };

  const saveUser = async (userId) => {
    setUpdateLoadingIds((prev) => new Set(prev).add(userId));
    setUpdateErrorIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });

    try {
      const payload = {
        username: editedUser.username,
        email: editedUser.email,
        is_staff: editedUser.role === "Admin" || editedUser.role === "Super Admin",
        is_superuser: editedUser.role === "Super Admin",
      };

      await axios.put(`${endpoints.adminUsers}${userId}/`, payload, { headers });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? {
              ...user,
              username: editedUser.username,
              email: editedUser.email,
              is_staff: editedUser.role === "Admin" || editedUser.role === "Super Admin",
              is_superuser: editedUser.role === "Super Admin",
            }
            : user
        )
      );
      cancelEditing();
    } catch (err) {
      console.error(err);
      setUpdateErrorIds((prev) => new Set(prev).add(userId));
    } finally {
      setUpdateLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const currentUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Registered Users</h1>

      {loading ? (
        <p className="text-gray-600">Loading users...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm bg-white shadow-sm">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Username</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Role</th>
                  <th className="p-2 border">Joined</th>
                  <th className="p-2 border">Last Login</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => {
                  const isEditing = editUserId === user.id;
                  const isUpdating = updateLoadingIds.has(user.id);
                  const hasError = updateErrorIds.has(user.id);
                  return (
                    <tr key={user.id} className="text-center hover:bg-gray-50">
                      <td className="p-2 border">{user.id}</td>
                      <td className="p-2 border">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUser.username}
                            onChange={(e) => handleInputChange("username", e.target.value)}
                            disabled={isUpdating}
                            className="w-full px-1 py-0.5 border rounded"
                          />
                        ) : (
                          user.username
                        )}
                      </td>
                      <td className="p-2 border">
                        {isEditing ? (
                          <input
                            type="email"
                            value={editedUser.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            disabled={isUpdating}
                            className="w-full px-1 py-0.5 border rounded"
                          />
                        ) : (
                          user.email
                        )}
                      </td>
                      <td className="p-2 border">
                        {isEditing ? (
                          <select
                            value={editedUser.role}
                            onChange={(e) => handleInputChange("role", e.target.value)}
                            disabled={isUpdating}
                            className="w-full px-1 py-0.5 border rounded"
                          >
                            <option value="Customer">Customer</option>
                            <option value="Admin">Admin</option>
                            <option value="Super Admin">Super Admin</option>
                          </select>
                        ) : user.is_superuser ? (
                          "Super Admin"
                        ) : user.is_staff ? (
                          "Admin"
                        ) : (
                          "Customer"
                        )}
                      </td>
                      <td className="p-2 border">{formatDate(user.date_joined)}</td>
                      <td className="p-2 border">{formatDate(user.last_login)}</td>
                      <td className="p-2 border space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveUser(user.id)}
                              disabled={isUpdating}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              {isUpdating ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={cancelEditing}
                              disabled={isUpdating}
                              className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            {hasError && (
                              <p className="text-red-600 mt-1 text-xs">Failed to update</p>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => startEditing(user)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-4 gap-2 flex-wrap">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              {"<<"}
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : ""
                  }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              {">>"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminUsers;
