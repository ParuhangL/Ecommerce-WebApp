import api from "./axios";
import endpoints from "../config";

export const fetchProducts = async () => {
  try {
    const response = await api.get(endpoints.products);
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    if (error.response) {
      console.error("Server responded with:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("No response received from the server.");
    } else {
      console.error("Request setup error:", error.message);
    }
    return [];
  }
};

export const searchProducts = async (query) => {
  try {
    const response = await api.get(endpoints.productSearch(query));
    return response.data;
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
};

export const getRecommendations = async (productId) => {
  try {
    const response = await api.get(endpoints.productRecommendations(productId));
    return response.data;
  } catch (error) {
    console.error(`Error getting recommendations for product ${productId}:`, error);
    return [];
  }
};
