import React, { useState, useEffect, useRef } from "react";
import { Navigate, Outlet } from "react-router-dom";
import axios from "axios";
import endpoints from "../config";

function AdminRoute() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true; // <-- reset on mount

    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("🔒 No token found. Redirecting to home.");
      setAuthorized(false);
      setLoading(false);
      return;
    }

    console.log("🔍 Verifying admin access...");

    axios
      .get(endpoints.profile, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("✅ Profile fetched:", res.data);
        if (isMounted.current) {
          setAuthorized(res.data.is_admin === true);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("❌ Failed to fetch profile:", err.response?.data || err.message);
        if (isMounted.current) {
          setAuthorized(false);
          setLoading(false);
        }
      });

    return () => {
      isMounted.current = false; // cleanup on unmount
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-gray-600">
        Verifying admin access...
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
