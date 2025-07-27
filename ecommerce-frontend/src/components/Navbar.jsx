import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";

function Navbar({ setResults, searchProducts }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUsername(null);
    navigate("/login/");
  };

  return (
    <header className="w-full">
      <nav className="flex flex-col md:flex-row items-center bg-white shadow-lg rounded-lg px-6 py-2 md:h-16">
        {/* Logo */}
        <div className="font-semibold text-lg md:w-1/5">
          <button onClick={() => navigate("/")}>TechStore</button>
        </div>

        {/* Search bar + Cart + Track Order container */}
        <div className="hidden md:flex md:w-3/5 items-center space-x-4 px-4">
          <div className="flex-grow">
            <SearchBar setResults={setResults} searchProducts={searchProducts} />
          </div>

          {/* Cart Icon */}
          <button
            aria-label="Cart"
            onClick={() => navigate("/cart")}
            className="p-2 hover:text-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 6m5-6v6m4-6v6m1-10h2"
              />
            </svg>
          </button>

          {/* Track Order Button */}
          <button
            aria-label="Track Order"
            onClick={() => navigate("/track-order")}
            className="p-2 hover:text-blue-600"
            title="Track Your Order"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21c-4.418 0-8-7-8-10a8 8 0 1116 0c0 3-3.582 10-8 10z"
              />
            </svg>
          </button>
        </div>

        {/* Right side auth buttons */}
        <div className="hidden md:flex md:w-1/5 justify-end items-center space-x-4 font-semibold text-sm">
          {token ? (
            <>
              <span className="text-blue-600">Hi, {username}</span>
              <button onClick={handleLogout}>Log Out</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/login")}>Login</button>
              <button onClick={() => navigate("/register")}>Sign Up</button>
            </>
          )}
        </div>

        {/* Hamburger Icon for Mobile */}
        <button
          className="md:hidden focus:outline-none"
          onClick={() => setOpen(!open)}
        >
          <div className="relative w-6 h-6">
            <span
              className={`block absolute h-0.5 w-6 bg-black transform transition duration-500 ease-in-out ${
                open ? "rotate-45 top-2.5" : "top-0"
              }`}
            ></span>
            <span
              className={`block absolute h-0.5 w-6 bg-black transform transition duration-500 ease-in-out ${
                open ? "opacity-0" : "top-2.5"
              }`}
            ></span>
            <span
              className={`block absolute h-0.5 w-6 bg-black transform transition duration-500 ease-in-out ${
                open ? "-rotate-45 bottom-2.5" : "bottom-0"
              }`}
            ></span>
          </div>
        </button>

        {/* Mobile Nav */}
        {open && (
          <div className="flex flex-col items-center gap-3 py-4 md:hidden text-sm font-semibold">
            <button onClick={() => navigate("/")}>Home</button>
            <button onClick={() => navigate("/contact")}>Contact</button>
            <button onClick={() => navigate("/products")}>Products</button>
            <button onClick={() => navigate("/cart")}>Cart</button>
            <button onClick={() => navigate("/track-order")}>Track Order</button> {/* Added here */}
            {token ? (
              <>
                <span className="text-blue-600">Hi, {username}</span>
                <button onClick={handleLogout}>Log Out</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate("/login")}>Login</button>
                <button onClick={() => navigate("/register")}>Sign Up</button>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
