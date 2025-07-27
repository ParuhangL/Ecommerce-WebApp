import axios from "axios";
import endpoints from "../config";

export const registerUser = async (username, email, password) => {
  return axios.post(endpoints.register, { username, email, password });
};

export const loginUser = async (username, password) => {
  const response = await axios.post(endpoints.login, { username, password });

  localStorage.setItem("token", response.data.token);
  localStorage.setItem("refresh_token", response.data.refresh);
  localStorage.setItem("username", username);

  return response.data;
};

export const fetchUserProfile = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await axios.get(endpoints.profile, {
    headers: { Authorization: `Bearer ${token}` },
  });

  localStorage.setItem("is_admin", response.data.is_admin ? "true" : "false");
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("username");
  localStorage.removeItem("is_admin");
};
