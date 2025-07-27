import { useEffect, useState } from "react";
import {
  getAdminProducts,
  getAdminCategories,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from "../api/admin";

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    price: "",
    stock: "",
    description: "",
    category: "",
    image: null,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const res = await getAdminProducts(token);
    setProducts(res.data);
  };

  const fetchCategories = async () => {
    const res = await getAdminCategories(token);
    setCategories(res.data);
  };

  const validateForm = () => {
    const err = {};
    if (!formData.name) err.name = "Name is required.";
    if (formData.price === "") err.price = "Price is required.";
    else if (parseFloat(formData.price) < 0) err.price = "Price cannot be negative.";
    if (formData.stock === "") err.stock = "Stock is required.";
    else if (parseInt(formData.stock) < 0) err.stock = "Stock cannot be negative.";
    if (!formData.description) err.description = "Description is required.";
    if (!formData.category) err.category = "Category is required.";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setFormData({ ...formData, image: file });
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("stock", formData.stock);
    data.append("description", formData.description);
    if (formData.image) data.append("image", formData.image);
    if (formData.category) data.append("category", formData.category);

    try {
      if (formData.id) {
        await updateAdminProduct(formData.id, data);
      } else {
        await createAdminProduct(data);
      }
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error("Failed to save product:", error.response?.data || error.message);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description,
      category: product.category || "",
      image: null,
    });
    setPreviewImage(product.image || null);
  };

  const handleDelete = async (id) => {
    await deleteAdminProduct(id);
    fetchProducts();
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: "",
      price: "",
      stock: "",
      description: "",
      category: "",
      image: null,
    });
    setPreviewImage(null);
    setErrors({});
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Manage Products</h1>

      <form onSubmit={handleSubmit} className="space-y-3 mb-6 bg-white p-4 rounded shadow">
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Name"
          className="border p-2 w-full"
        />
        {errors.name && <p className="text-red-500">{errors.name}</p>}

        <input
          name="price"
          type="number"
          value={formData.price}
          onChange={handleChange}
          placeholder="Price"
          className="border p-2 w-full"
        />
        {errors.price && <p className="text-red-500">{errors.price}</p>}

        <input
          name="stock"
          type="number"
          value={formData.stock}
          onChange={handleChange}
          placeholder="Stock"
          className="border p-2 w-full"
        />
        {errors.stock && <p className="text-red-500">{errors.stock}</p>}

        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description"
          className="border p-2 w-full"
        />
        {errors.description && <p className="text-red-500">{errors.description}</p>}

        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category && <p className="text-red-500">{errors.category}</p>}

        <input type="file" name="image" onChange={handleChange} className="border p-2 w-full" />
        {previewImage && (
          <img src={previewImage} alt="Preview" className="w-32 h-32 object-cover mt-2" />
        )}

        <div className="flex space-x-2">
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            {formData.id ? "Update Product" : "Add Product"}
          </button>
          {formData.id && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <ul className="space-y-4">
        {products.map((p) => (
          <li
            key={p.id}
            className="border p-3 flex justify-between items-center bg-white shadow-sm rounded"
          >
            <div>
              <strong>{p.name}</strong> – Rs. {p.price} – Stock: {p.stock}
              {p.image && (
                <img src={p.image} alt={p.name} className="w-20 h-20 object-cover mt-1" />
              )}
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(p)}
                className="bg-yellow-500 text-white px-2 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminProducts;
