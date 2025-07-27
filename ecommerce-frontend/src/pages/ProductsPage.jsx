import { useState, useEffect } from "react";
import SearchBar from "../components/SearchBar";
import ProductList from "../components/ProductList";
import { fetchProducts, searchProducts } from "../api/products";

function ProductsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initial fetch all products on mount
  useEffect(() => {
    setLoading(true);
    fetchProducts()
      .then(setResults)
      .finally(() => setLoading(false));
  }, []);

  // Optional: you can pass searchProducts to SearchBar to handle searching

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchBar searchProducts={searchProducts} setResults={setResults} />

      {loading ? (
        <p className="text-center p-4">Loading products...</p>
      ) : (
        <ProductList products={results} />
      )}
    </div>
  );
}

export default ProductsPage ;