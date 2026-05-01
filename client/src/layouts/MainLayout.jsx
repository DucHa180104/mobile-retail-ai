import { Outlet } from "react-router-dom";
import { useState } from "react";
import Footer from "../components/Footer.jsx";
import Navbar from "../components/Navbar.jsx";
import { useCart } from "../context/CartContext.jsx";

function MainLayout() {
  const { totalItems } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  function handleCategoryChange(nextCategory) {
    setActiveCategory((currentCategory) =>
      currentCategory === nextCategory ? "" : nextCategory
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar
        searchValue={searchTerm}
        onSearchChange={(event) => setSearchTerm(event.target.value)}
        totalItems={totalItems}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      <Outlet
        context={{
          searchTerm,
          activeCategory,
          setSearchTerm,
          handleCategoryChange
        }}
      />

      <Footer />
    </div>
  );
}

export default MainLayout;
