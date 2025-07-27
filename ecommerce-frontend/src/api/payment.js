import api from "./axios";
import endpoints from "../config";

export const payWithEsewa = async (orderId, amount) => {
  const response = await api.post(endpoints.esewaPayment, { order_id: orderId, amount });
  return response.data; // returns both esewa_url and payload
};

export const confirmEsewaPayment = async (orderId, transactionUuid) => {
  const response = await api.post(endpoints.esewaPaymentConfirm, { order_id: orderId, transaction_uuid: transactionUuid });
  return response.data;
};