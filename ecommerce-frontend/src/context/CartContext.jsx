import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem("cart");
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
      console.error("Failed to parse cart from localStorage:", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantityToAdd = 1) => {
    let added = false;

    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === product.id);
      const newQuantity = existing ? existing.quantity + quantityToAdd : quantityToAdd;

      if (newQuantity > product.stock) {
        // Exceeds stock, do not add
        return prevItems;
      }

      added = true;

      if (existing) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      }

      return [...prevItems, { ...product, quantity: quantityToAdd }];
    });

    return added;
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return false;

    let updated = false;
    setCartItems((prevItems) => {
      const item = prevItems.find((i) => i.id === productId);
      if (!item) return prevItems;

      if (quantity > item.stock) {
        return prevItems; // no update, exceeds stock
      }

      updated = true;
      return prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      );
    });

    return updated;
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("cart");
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
