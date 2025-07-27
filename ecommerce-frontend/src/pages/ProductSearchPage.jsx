import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { searchProducts } from "../api/products";
import { useCart } from "../context/CartContext";
import { toast } from "react-toastify"; // ✅ Import toast

function ProductSearchPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get("q") || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchSearch = async () => {
      try {
        setLoading(true);
        const response = await searchProducts(query);
        setResults(response);
      } catch (err) {
        console.error("Search API error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (query) fetchSearch();
  }, [query]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">
        Search results for "{query}"
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : results.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {results.map((product) => (
            <div
              key={product.id}
              className="bg-white p-4 rounded shadow hover:shadow-lg transition flex flex-col"
            >
              <Link
                to={`/products/${product.id}`}
                className="flex flex-col flex-grow"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-48 w-full object-contain mb-2"
                />
                <h3 className="font-bold text-lg">{product.name}</h3>
                <p className="text-sm text-gray-600 flex-grow">
                  {product.description}
                </p>
                <p className="text-blue-600 font-semibold mt-2">Rs. {product.price}</p>
              </Link>

              {/* ✅ Add to Cart + Toast */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  addToCart(product);
                  toast.success(`${product.name} added to cart`);
                }}
                className="mt-2 bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 transition"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductSearchPage;
