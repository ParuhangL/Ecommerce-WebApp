// src/components/Footer.jsx

import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-stone-100 text-gray-700 py-10 mt-12 border-t border-gray-300">
      <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between">
        {/* Logo & Description */}
        <div className="mb-8 md:mb-0 max-w-sm">
          <h2 className="text-2xl font-bold mb-4">TechStore</h2>
          <p className="text-gray-600">
            Your one-stop shop for the latest and greatest tech gadgets and accessories.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col sm:flex-row gap-10">
          <div>
            <h3 className="font-semibold mb-4">Shop</h3>
            <ul>
              <li className="mb-2 hover:text-gray-900 cursor-pointer">Laptops</li>
              <li className="mb-2 hover:text-gray-900 cursor-pointer">Phones</li>
              <li className="mb-2 hover:text-gray-900 cursor-pointer">Accessories</li>
              <li className="mb-2 hover:text-gray-900 cursor-pointer">Deals</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul>
              <li className="mb-2 hover:text-gray-900 cursor-pointer">Contact Us</li>
              <li className="mb-2 hover:text-gray-900 cursor-pointer">FAQs</li>
              <li className="mb-2 hover:text-gray-900 cursor-pointer">Shipping</li>
              <li className="mb-2 hover:text-gray-900 cursor-pointer">Returns</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul>
              <li className="mb-2 hover:text-gray-900 cursor-pointer">Privacy Policy</li>
              <li className="mb-2 hover:text-gray-900 cursor-pointer">Terms of Service</li>
            </ul>
          </div>
        </div>

        {/* Social Icons */}
        <div className="mt-8 md:mt-0 flex space-x-4 items-center text-gray-600">
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-gray-900">
            <FaFacebookF size={20} />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-gray-900">
            <FaTwitter size={20} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-gray-900">
            <FaInstagram size={20} />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-gray-900">
            <FaLinkedinIn size={20} />
          </a>
        </div>
      </div>

      <div className="border-t border-gray-300 mt-8 pt-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} TechStore. All rights reserved.
      </div>
    </footer>
  );
}
