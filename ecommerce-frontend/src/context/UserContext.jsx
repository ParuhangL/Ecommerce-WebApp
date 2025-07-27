// src/context/UserContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import endpoints from "../config"; // Adjust the relative path as needed

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ Loading state added

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await axios.get(endpoints.profile, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setUser(response.data);
        } catch (error) {
          console.error("Error fetching user:", error);
          setUser(null);
        }
      }
      setLoading(false); // ✅ Ensure loading ends regardless of token existence
    };

    fetchUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
