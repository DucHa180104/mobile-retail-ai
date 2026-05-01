import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import CategorySection from "../components/CategorySection.jsx";
import HeroBanner from "../components/HeroBanner.jsx";
import ProductCard from "../components/ProductCard.jsx";
import TrustBadges from "../components/TrustBadges.jsx";
import { useCart } from "../context/CartContext.jsx";

function ProductListPage() {
  const { addToCart } = useCart();
  const { searchTerm, activeCategory, handleCategoryChange } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("http://localhost:5000/api/products");

        if (!response.ok) {
          throw new Error("Khong the tai danh sach san pham");
        }

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const featuredProduct =
    products.find((product) =>
      product.name?.toLowerCase().includes("iphone 15 pro max")
    ) || products[0];

  const filteredProducts = products.filter((product) => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const normalizedName = product.name?.toLowerCase() || "";
    const normalizedBrand = product.brand?.toLowerCase() || "";

    const matchesSearch =
      !normalizedQuery ||
      normalizedName.includes(normalizedQuery) ||
      normalizedBrand.includes(normalizedQuery);

    const normalizedCategory = activeCategory.toLowerCase();
    const matchesCategory =
      !activeCategory ||
      normalizedName.includes(normalizedCategory) ||
      normalizedBrand.includes(normalizedCategory);

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
        <main className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
          <p className="text-center text-slate-600">Dang tai san pham...</p>
          </div>
        </main>
    );
  }

  if (error) {
    return (
        <main className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
          <p className="text-center text-red-600">{error}</p>
          </div>
        </main>
    );
  }

  return (
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-12">
          <HeroBanner featuredProduct={featuredProduct} />

          <CategorySection
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />

          <section id="new-arrivals">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M12 2 9.2 8.6 2 9.3l5.4 4.7L5.8 21 12 17.3 18.2 21l-1.6-7 5.4-4.7-7.2-.7z" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Dien thoai moi ve
                  </h2>
                  <p className="text-sm text-slate-500">
                    San pham duoc lay truc tiep tu API hien tai
                  </p>
                </div>
              </div>

              <span className="text-sm font-semibold text-blue-700">
                {filteredProducts.length} san pham
              </span>
            </div>

            {products.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
                Chua co san pham nao.
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
                Khong tim thay san pham phu hop.
              </div>
            ) : (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    badge={getProductBadge(product, index)}
                    rating={getProductRating(index)}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            )}
          </section>

          <TrustBadges />
        </div>
      </main>
  );
}

function getProductBadge(product, index) {
  if ((product.stock || 0) <= 5) {
    return "Sap het";
  }

  const brandName = product.brand?.toLowerCase() || "";

  if (brandName.includes("apple")) {
    return "Ban chay";
  }

  if (index % 2 === 0) {
    return "Moi";
  }

  return "Noi bat";
}

function getProductRating(index) {
  const ratings = ["4.9", "4.8", "4.7", "4.9", "4.8"];
  return ratings[index % ratings.length];
}

export default ProductListPage;
