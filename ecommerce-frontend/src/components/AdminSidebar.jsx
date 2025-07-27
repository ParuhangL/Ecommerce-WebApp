// src/components/AdminSidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { routes } from "../config";

export default function AdminSidebar() {
  const activeClass = "bg-blue-600 text-white rounded px-4 py-2 block";
  const inactiveClass =
    "text-gray-700 hover:bg-blue-200 hover:text-blue-700 rounded px-4 py-2 block";

  return (
    <nav className="flex flex-col space-y-2 p-4 bg-gray-100 h-full min-h-screen w-48">
      <NavLink
        to={routes.adminDashboard}
        className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
        end
      >
        Dashboard Home
      </NavLink>

      <NavLink
        to={routes.adminOrders}
        className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
      >
        Manage Orders
      </NavLink>

      {/* Add other admin links here */}
    </nav>
  );
}
