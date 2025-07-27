import api from "./axios";
import endpoints from "../config";

/**
 * Calls the API to add a product to the cart.
 * Throws on failure.
 */
export const addToCart = async (productId, quantity) => {
  return api.post(endpoints.cart, { product: productId, quantity });
};

/**
 * Wrapper for addToCart that catches errors and returns
 * a standardized error object instead of throwing.
 * Caller can handle the error and show messages to user.
 */
export const safeAddToCart = async (productId, quantity) => {
  try {
    const response = await addToCart(productId, quantity);
    return { success: true, data: response.data };
  } catch (error) {
    let message = "Failed to add product to cart.";
    if (error.response?.data) {
      const data = error.response.data;
      message =
        data.detail ||
        (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) ||
        data.quantity ||
        message;
    }
    return { success: false, error: message };
  }
};
