import React from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

function ProductCard({ product, addToCart }) {
  const handleAddToCart = () => {
    if (product.stock < 1) {
      toast.error(`Product "${product.name}" is out of stock.`);
      return;
    }

    const success = addToCart(product);
    if (!success) {
      toast.error(
        `Only ${product.stock} item${product.stock !== 1 ? "s" : ""} left in stock for "${product.name}".`
      );
      return;
    }

    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="relative flex flex-col w-full rounded-xl bg-white text-gray-700 shadow-md transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Image */}
      <Link
        to={`/products/${product.id}`}
        className="relative mx-4 mt-4 h-72 overflow-hidden rounded-xl bg-white block"
      >
        <img
          src={product.image || "/placeholder.jpg"}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-300 ease-in-out hover:scale-105"
        />
      </Link>

      {/* Product Info */}
      <div className="p-6">
        <div className="mb-2 flex items-center justify-between">
          <Link
            to={`/products/${product.id}`}
            className="text-base font-medium text-blue-gray-900 hover:underline"
          >
            {product.name}
          </Link>
          <p className="text-base font-medium text-blue-gray-900">
            Rs. {product.price}
          </p>
        </div>
        <p className="text-sm text-gray-700 opacity-75">
          {product.description || "No description available."}
        </p>
      </div>

      {/* Add to Cart Button */}
      <div className="p-6 pt-0">
        <button
          onClick={handleAddToCart}
          disabled={product.stock < 1}
          className="block w-full rounded-lg bg-blue-gray-900/10 py-3 px-6 text-center text-xs font-bold uppercase text-blue-gray-900 transition-all hover:scale-105 focus:scale-105 active:scale-100 disabled:pointer-events-none disabled:opacity-50"
          title={product.stock < 1 ? "Out of stock" : "Add to cart"}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
