import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

function Layout() {
  return (
    <div>
      <Navbar />
      <main className="container mx-auto p-4">
        <Outlet /> {/* This is where the current page content will be rendered */}
      </main>
    </div>
  );
}

export default Layout;
