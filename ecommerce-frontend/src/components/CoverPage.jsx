import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay } from 'swiper/modules';

export default function CoverPage() {
  // Tech-related background images (feel free to swap URLs)
  const images = [
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1470&q=80", // Laptop
    "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1470&q=80", // Headphones
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1470&q=80", // Coding setup
  ];

  // Smooth scroll handler for the button
  const handleShopNowClick = (e) => {
    e.preventDefault();
    const productsSection = document.getElementById("products");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative rounded-lg mb-8 shadow-lg overflow-hidden">
      {/* Swiper Carousel */}
      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        loop={true}
        className="h-96 sm:h-[500px]"
      >
        {images.map((url, i) => (
          <SwiperSlide key={i}>
            <div
              className="h-96 sm:h-[500px] bg-cover bg-center"
              style={{ backgroundImage: `url(${url})` }}
            >
              {/* Overlay */}
              <div className="h-full w-full bg-black bg-opacity-50 flex flex-col justify-center items-center px-6 text-center rounded-lg">
                <h1 className="text-white text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow-lg">
                  Welcome to Our Tech Store
                </h1>
                <p className="text-white text-lg sm:text-xl max-w-3xl drop-shadow-md mb-8">
                  Discover the best gadgets and accessories at unbeatable prices.
                </p>
                <button
                  onClick={handleShopNowClick}
                  className="bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 transition-colors duration-300 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 focus:scale-105"
                >
                  Shop Now
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
