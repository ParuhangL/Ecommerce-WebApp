import { NavLink, Outlet } from "react-router-dom";
import { routes } from "../config";

function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <nav className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
        <ul>
          <li className="mb-2">
            <NavLink to={routes.adminDashboard} className={({ isActive }) => isActive ? "font-bold" : ""}>
              Dashboard
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink to={routes.adminProducts} className={({ isActive }) => isActive ? "font-bold" : ""}>
              Products
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink to={routes.adminCategories} className={({ isActive }) => isActive ? "font-bold" : ""}>
              Categories
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink to={routes.adminUsers} className={({ isActive }) => isActive ? "font-bold" : ""}>
              Users
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink to={routes.adminOrders} className={({ isActive }) => isActive ? "font-bold" : ""}>
              Orders
            </NavLink>
          </li>
        </ul>
      </nav>

      <main className="flex-1 p-6 bg-white">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
