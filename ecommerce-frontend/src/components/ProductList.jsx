import React, { useState } from "react";
import ProductCard from "./ProductCard";
import { useCart } from "../context/CartContext"; // ✅ useCart hook to get addToCart
import { Link } from "react-router-dom";

function ProductList({ products }) {
  const [visibleCount, setVisibleCount] = useState(6);
  const { addToCart } = useCart();

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  const visibleProducts = products.slice(0, visibleCount);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
        {visibleProducts.length > 0 ? (
          visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              addToCart={addToCart} // pass addToCart function here
            />
          ))
        ) : (
          <p className="text-center col-span-full text-gray-500">No products found.</p>
        )}
      </div>

      {visibleCount < products.length && (
        <div className="text-center mt-4">
          <button
            onClick={handleLoadMore}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductList;
