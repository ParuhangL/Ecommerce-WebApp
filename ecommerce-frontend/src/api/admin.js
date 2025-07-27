import api from "./axios";   // axios instance with token interceptor
import endpoints from "../config";

// Dashboard
export const getAdminDashboard = (filter = "") => {
  return api.get(endpoints.adminDashboard + (filter ? `?range=${filter}` : ""));
};

// Products
export const getAdminProducts = () => {
  return api.get(endpoints.adminProducts);
};

// For create and update, productData can be FormData or JSON object
export const createAdminProduct = (productData) => {
  return api.post(endpoints.createAdminProduct, productData);
};

export const updateAdminProduct = (id, productData) => {
  return api.put(endpoints.updateAdminProduct(id), productData);
};

export const deleteAdminProduct = (id) => {
  return api.delete(endpoints.deleteAdminProduct(id));
};

// Categories
export const getAdminCategories = () => {
  return api.get(endpoints.adminCategories);
};

export const createAdminCategory = (categoryData) => {
  return api.post(endpoints.createAdminCategory, categoryData);
};

export const updateAdminCategory = (id, categoryData) => {
  return api.put(endpoints.updateAdminCategory(id), categoryData);
};

export const deleteAdminCategory = (id) => {
  return api.delete(endpoints.deleteAdminCategory(id));
};

// Users
export const getAdminUsers = () => {
  return api.get(endpoints.adminUsers);
};
