import api from "./axios";
import endpoints from "../config";

export const createOrder = async (orderData) => {
  return api.post(endpoints.orderCreate, orderData);
};

export const getOrders = async () => {
  return api.get(endpoints.orders);
};

export const updateOrderStatus = async (orderId, status) => {
  return api.patch(endpoints.orderUpdateStatus(orderId), { status });
};

export const trackOrder = async (trackingCode) => {
  return api.get(endpoints.orderTrack(trackingCode));
};

export const getUserOrders = async () => {
  return api.get(endpoints.userOrders);
};