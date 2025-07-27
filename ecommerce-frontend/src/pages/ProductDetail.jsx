import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { getRecommendations } from "../api/products";
import { FaStar } from "react-icons/fa";
import { toast } from "react-toastify";
import endpoints from "../config";

function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState({ rating: 0, comment: "" });
  const [hasReviewed, setHasReviewed] = useState(false);
  const [editingReview, setEditingReview] = useState(false);

  const token = localStorage.getItem("token");

  const getAuthHeaders = () => ({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const getUserId = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.user_id || payload.id;
    } catch {
      return null;
    }
  };

  const fetchData = async () => {
    try {
      const [prodRes, reviewRes] = await Promise.all([
        axios.get(endpoints.productDetail(id)),
        axios.get(endpoints.productReviews(id)),
      ]);
      setProduct(prodRes.data);
      setReviews(reviewRes.data);

      const userId = getUserId();
      const myReview = reviewRes.data.find(
        (r) => r.user?.id === userId || r.user === userId
      );

      setHasReviewed(!!myReview);
      setUserReview(
        myReview ? { rating: myReview.rating, comment: myReview.comment } : { rating: 0, comment: "" }
      );
      setEditingReview(false);

      const recs = await getRecommendations(id);
      setRecommendations(recs);
    } catch (err) {
      toast.error("Failed to load product data");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Validate quantity input and prevent invalid values
  const handleQuantityChange = (value) => {
    const qty = Number(value);
    if (qty < 1) {
      setQuantity(1);
    } else if (product && qty > product.stock) {
      setQuantity(product.stock);
      toast.error(`Only ${product.stock} item${product.stock !== 1 ? "s" : ""} in stock`);
    } else {
      setQuantity(qty);
    }
  };

  const handleAddToCart = () => {
    if (!token) return toast.warn("Please log in to add to cart");

    if (quantity > product.stock) {
      toast.error(`Cannot add more than ${product.stock} item${product.stock !== 1 ? "s" : ""} for "${product.name}"`);
      return;
    }

    const success = addToCart(product, quantity);
    if (!success) {
      toast.error(`Cannot add more than ${product.stock} item${product.stock !== 1 ? "s" : ""} of "${product.name}"`);
      return;
    }

    toast.success("Added to cart");
  };

  const handleSubmitReview = async () => {
    if (!token) return toast.warn("Please log in to review");
    try {
      await axios.post(
        endpoints.productReviews(id),
        { rating: userReview.rating, comment: userReview.comment },
        getAuthHeaders()
      );
      toast.success("Review submitted");
      fetchData();
    } catch (err) {
      console.error("Review submit error:", err.response?.data);
      toast.error("Failed to submit review");
    }
  };

  const handleUpdateReview = async () => {
    if (!token) return toast.warn("Please log in to update review");
    try {
      await axios.patch(
        endpoints.myReview(id),
        { rating: userReview.rating, comment: userReview.comment },
        getAuthHeaders()
      );
      toast.success("Review updated");
      setEditingReview(false);
      fetchData();
    } catch (err) {
      console.error("Review update error:", err.response?.data);
      toast.error("Failed to update review");
    }
  };

  const handleDeleteReview = async () => {
    if (!token) return toast.warn("Please log in to delete review");
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    try {
      await axios.delete(endpoints.myReview(id), getAuthHeaders());
      toast.info("Review deleted");
      setUserReview({ rating: 0, comment: "" });
      setHasReviewed(false);
      setEditingReview(false);
      fetchData();
    } catch (err) {
      console.error("Review delete error:", err.response?.data);
      toast.error("Failed to delete review");
    }
  };

  const renderStars = (count) =>
    Array(5)
      .fill()
      .map((_, i) => (
        <FaStar
          key={i}
          className={i < count ? "text-yellow-400" : "text-gray-300"}
        />
      ));

  if (!product) return <p>Loading...</p>;

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="container mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Product Image */}
      <div className="flex justify-center items-center border bg-white rounded shadow p-4">
        <img
          src={product.image}
          alt={product.name}
          className="max-w-full max-h-[500px] object-contain"
        />
      </div>

      {/* Product Info */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
        <div className="flex items-center mb-4">
          {renderStars(Math.round(avgRating))}
          <span className="ml-2 text-gray-600 text-sm">
            ({reviews.length} reviews)
          </span>
        </div>
        <p className="mb-2 text-gray-700">{product.description}</p>
        <p className="text-xl font-semibold text-blue-600 mb-4">
          Rs. {product.price}
        </p>

        <div className="flex items-center space-x-4 mb-4">
          <label>Qty:</label>
          <input
            type="number"
            min="1"
            max={product.stock}
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="border p-1 w-16 rounded"
          />
          <button
            onClick={handleAddToCart}
            disabled={product.stock < 1}
            className={`px-4 py-2 rounded text-white ${
              product.stock < 1
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            title={product.stock < 1 ? "Out of stock" : "Add to cart"}
          >
            Add to Cart
          </button>
        </div>

        {/* ...Your existing review and recommendations JSX remains unchanged... */}
        {/* (I omitted it here for brevity; just keep your existing code after this) */}
        
        {/* Your Review */}
        {token && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">
              {hasReviewed
                ? editingReview
                  ? "Edit Your Review"
                  : "Your Review"
                : "Leave a Review"}
            </h2>
            <div className="flex space-x-1 mb-2">
              {Array(5)
                .fill()
                .map((_, i) => (
                  <FaStar
                    key={i}
                    className={
                      userReview.rating > i ? "text-yellow-400" : "text-gray-300"
                    }
                    onClick={() => setUserReview({ ...userReview, rating: i + 1 })}
                    style={{ cursor: "pointer" }}
                  />
                ))}
            </div>
            <textarea
              className="w-full border p-2 rounded mb-2"
              rows={3}
              placeholder="Write your review here..."
              value={userReview.comment}
              onChange={(e) =>
                setUserReview({ ...userReview, comment: e.target.value })
              }
              disabled={!editingReview && hasReviewed}
            />

            {!hasReviewed && (
              <button
                onClick={handleSubmitReview}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                disabled={userReview.rating === 0 || userReview.comment.trim() === ""}
              >
                Submit Review
              </button>
            )}

            {hasReviewed && !editingReview && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingReview(true)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteReview}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            )}

            {hasReviewed && editingReview && (
              <div className="flex space-x-2">
                <button
                  onClick={handleUpdateReview}
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                  disabled={userReview.rating === 0 || userReview.comment.trim() === ""}
                >
                  Update
                </button>
                <button
                  onClick={() => {
                    setEditingReview(false);
                    fetchData();
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Customer Reviews (read-only) */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="border-b py-3">
                <div className="flex items-center space-x-2">
                  {renderStars(r.rating)}
                  <span className="text-sm text-gray-500">
                    - {r.user?.username || "Anonymous"}
                  </span>
                </div>
                <p>{r.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="md:col-span-2 mt-10">
        <h2 className="text-xl font-bold mb-4">Recommended Products</h2>
        {recommendations.length ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.map((rec) => (
              <Link
                to={`/products/${rec.id}`}
                key={rec.id}
                className="border rounded shadow-sm p-2 hover:shadow-md transition"
              >
                <img
                  src={rec.image}
                  alt={rec.name}
                  className="w-full h-40 object-contain mb-2"
                />
                <p className="font-medium">{rec.name}</p>
                <p className="text-blue-600">Rs. {rec.price}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recommendations available.</p>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;
