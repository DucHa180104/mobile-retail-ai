import { useState } from "react";
import { Outlet } from "react-router-dom";
import ChatbotWidget from "../components/ChatbotWidget.jsx";
import Footer from "../components/Footer.jsx";
import Navbar from "../components/Navbar.jsx";
import { useCart } from "../context/CartContext.jsx";

function MainLayout() {
  const { totalItems } = useCart();
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        searchValue={searchTerm}
        onSearchChange={(event) => setSearchTerm(event.target.value)}
        totalItems={totalItems}
      />

      <div className="mx-auto w-full max-w-[1360px] px-2 sm:px-3 lg:px-4">
        <Outlet
          context={{
            searchTerm
          }}
        />
      </div>

      <Footer />
      <ChatbotWidget floating />
    </div>
  );
}

export default MainLayout;
