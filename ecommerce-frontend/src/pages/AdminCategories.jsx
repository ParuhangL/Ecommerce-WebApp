import { useEffect, useState } from "react";
import axios from "axios";
import endpoints from "../config";

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(endpoints.adminCategories, { headers });
      setCategories(res.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(endpoints.createAdminCategory, { name, description }, { headers });
      setName("");
      setDescription("");
      fetchCategories();
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(endpoints.deleteAdminCategory(id), { headers });
      fetchCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Manage Categories</h1>
      <form onSubmit={handleSubmit} className="space-y-2 my-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="border p-2 w-full"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="border p-2 w-full"
          required
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2">
          Add Category
        </button>
      </form>

      <ul className="space-y-2">
        {categories.map((c) => (
          <li
            key={c.id}
            className="border p-2 flex justify-between items-center"
          >
            <div>
              <strong>{c.name}</strong> - {c.description}
            </div>
            <button
              onClick={() => handleDelete(c.id)}
              className="bg-red-500 text-white px-2 py-1"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminCategories;
