import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import { useEffect, useState } from "react";

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice } = useCart();
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Store stock-related errors keyed by item id
  const [stockErrors, setStockErrors] = useState({});

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleCheckout = () => {
    navigate("/checkout");
  };

  const handleIncrease = (item) => {
    if (item.quantity + 1 > item.stock) {
      setStockErrors((prev) => ({
        ...prev,
        [item.id]: `Only ${item.stock} item${item.stock !== 1 ? "s" : ""} in stock`,
      }));
      return;
    }
    // Clear any existing error
    setStockErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[item.id];
      return newErrors;
    });
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrease = (item) => {
    setStockErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[item.id];
      return newErrors;
    });
    updateQuantity(item.id, item.quantity - 1);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
        <p>Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-white shadow rounded-lg"
            >
              <div className="flex items-center">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover mr-4 rounded"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="text-gray-600">Price: Rs. {item.price}</p>
                  {stockErrors[item.id] && (
                    <p className="text-sm text-red-600">{stockErrors[item.id]}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDecrease(item)}
                  className="px-2 py-1 bg-gray-300 rounded"
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span className="px-3">{item.quantity}</span>
                <button
                  onClick={() => handleIncrease(item)}
                  className="px-2 py-1 bg-gray-300 rounded"
                  disabled={item.quantity >= item.stock}
                  title={item.quantity >= item.stock ? "No more stock available" : ""}
                >
                  +
                </button>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="text-right mt-4">
            <p className="text-lg font-semibold mb-2">Total: Rs. {getTotalPrice()}</p>
            <button
              onClick={handleCheckout}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
