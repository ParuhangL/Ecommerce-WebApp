import axios from "axios";

// Create Axios instance WITHOUT a fixed Content-Type header
const api = axios.create({
  // no baseURL, your endpoints have full URLs
  // do NOT set 'Content-Type' globally here
});

// Attach JWT token automatically (if available)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
