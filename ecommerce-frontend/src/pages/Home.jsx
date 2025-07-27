import { useState, useEffect } from "react";
import { fetchProducts } from "../api/products";
import ProductList from "../components/ProductList";
import CoverPage from "../components/CoverPage";
import Footer from "../components/Footer";

function Home() {
  const [products, setProducts] = useState([]); 
  const [searchResults, setSearchResults] = useState([]); 

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        const productArray = Array.isArray(data) ? data : [];
        setProducts(productArray);
        setSearchResults(productArray); 
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
      });
  }, []);

  return (
    <div className="container mx-auto p-4">
      <CoverPage />

      <h1
        id="products"
        className="text-2xl font-bold mb-4 text-center"
      >
        Products
      </h1>

      <ProductList products={searchResults} />
      <Footer />
    </div>
  );
}

export default Home;
