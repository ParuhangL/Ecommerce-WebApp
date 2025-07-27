const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || API_BASE_URL;

const endpoints = {
  // Admin API endpoints
  adminDashboard: `${API_BASE_URL}/api/admin/dashboard/`,
  adminProducts: `${API_BASE_URL}/api/admin/products/`,
  createAdminProduct: `${API_BASE_URL}/api/admin/products/create/`,
  updateAdminProduct: (id) => `${API_BASE_URL}/api/admin/products/${id}/update/`,
  deleteAdminProduct: (id) => `${API_BASE_URL}/api/admin/products/${id}/delete/`,
  adminUpdateOrderStatus: (orderId) => `/api/admin/orders/${orderId}/status/`,

  adminCategories: `${API_BASE_URL}/api/admin/categories/`,
  createAdminCategory: `${API_BASE_URL}/api/admin/categories/create/`,
  updateAdminCategory: (id) => `${API_BASE_URL}/api/admin/categories/${id}/update/`,
  deleteAdminCategory: (id) => `${API_BASE_URL}/api/admin/categories/${id}/delete/`,

  adminUsers: `${API_BASE_URL}/api/admin/users/`,
  adminOrders: `${API_BASE_URL}/api/admin/orders/`,

  // Auth API endpoints
  register: `${API_BASE_URL}/api/auth/register/`,
  login: `${API_BASE_URL}/api/auth/login/`,
  profile: `${API_BASE_URL}/api/auth/profile/`,

  // Products API endpoints
  products: `${API_BASE_URL}/api/products/`,
  productSearch: (query) => `${API_BASE_URL}/api/products/search/?q=${encodeURIComponent(query)}`,
  productRecommendations: (productId) => `${API_BASE_URL}/api/products/${productId}/recommend/`,

  productDetail: (id = "") => `${API_BASE_URL}/api/products/${id}/`,
  productReviews: (id = "") => `${API_BASE_URL}/api/products/${id}/reviews/`,
  myReview: (id = "") => `${API_BASE_URL}/api/products/${id}/reviews/my/`,

  // Cart API endpoint
  cart: `${API_BASE_URL}/api/cart/`,

  // Orders API endpoints
  orders: `${API_BASE_URL}/api/orders`,
  orderCreate: `${API_BASE_URL}/api/orders/create/`,
  orderUpdateStatus: (orderId) => `${API_BASE_URL}/api/orders/${orderId}/update/`,
  orderTrack: (trackingCode) => `${API_BASE_URL}/api/track-order/${trackingCode}/`,
  userOrders: `${API_BASE_URL}/api/user/orders/`,

  // Payment API endpoint
  esewaPaymentConfirm: `${API_BASE_URL}/api/esewa/payment-confirm/`,
  esewaPayment: "/api/esewa/payment/",
};

export { BACKEND_BASE_URL };
export default endpoints;

export const routes = {
  adminDashboard: "/admin/dashboard",
  adminProducts: "/admin/products",
  adminCategories: "/admin/categories",
  adminUsers: "/admin/users",
  adminOrders: "/admin/orders",
  // Add more frontend routes as needed
};

console.log("✅VITE_API_BASE_URL loaded from .env:", import.meta.env.VITE_API_BASE_URL);
console.log("✅VITE_BACKEND_BASE_URL loaded from .env:", import.meta.env.VITE_BACKEND_BASE_URL);
