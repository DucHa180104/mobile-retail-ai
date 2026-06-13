import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import CategorySection from "../components/CategorySection.jsx";
import HeroBanner from "../components/HeroBanner.jsx";
import ProductCard from "../components/ProductCard.jsx";
import TrustBadges from "../components/TrustBadges.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { buildApiUrl } from "../lib/api.js";

function ProductListPage() {
  const { addToCart } = useCart();
  const { token, isAuthenticated } = useAuth();
  const { searchTerm } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch(buildApiUrl("/api/products"));

        if (!response.ok) {
          throw new Error("Không thể tải danh sách sản phẩm");
        }

        const data = await response.json();
        const productList = Array.isArray(data) ? data : data.products || [];
        setProducts(productList);
      } catch (fetchError) {
        setError(fetchError.message || "Không thể tải danh sách sản phẩm");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  useEffect(() => {
    async function fetchWishlist() {
      if (!isAuthenticated || !token) {
        setWishlist([]);
        return;
      }

      try {
        const response = await fetch(buildApiUrl("/api/wishlist"), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Không thể tải danh sách yêu thích");
        }

        const data = await response.json();
        setWishlist(data.wishlist || []);
      } catch {
        setWishlist([]);
      }
    }

    fetchWishlist();
  }, [isAuthenticated, token]);

  const featuredProduct = products[0];

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const name = product.name?.toLowerCase() || "";
      const brand = product.brand?.toLowerCase() || "";

      const matchesSearch =
        !normalizedQuery ||
        name.includes(normalizedQuery) ||
        brand.includes(normalizedQuery);

      if (!activeCategory) {
        return matchesSearch;
      }

      const categoryQuery =
        activeCategory === "Phụ kiện" ? "phụ kiện" : activeCategory.toLowerCase();

      const matchesCategory =
        name.includes(categoryQuery) ||
        brand.includes(categoryQuery) ||
        (activeCategory === "iPhone" && name.includes("iphone"));

      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, products, searchTerm]);

  const wishlistIds = useMemo(
    () => new Set(wishlist.map((product) => product._id)),
    [wishlist]
  );

  async function handleToggleWishlist(product) {
    if (!isAuthenticated || !token) {
      window.alert("Vui lòng đăng nhập để dùng danh sách yêu thích");
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/api/wishlist/toggle"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product._id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể cập nhật danh sách yêu thích");
      }

      setWishlist(data.wishlist || []);
    } catch (toggleError) {
      window.alert(toggleError.message || "Không thể cập nhật danh sách yêu thích");
    }
  }

  if (loading) {
    return (
      <main className="px-4 py-4 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1120px] rounded-[1.5rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-slate-600">Đang tải sản phẩm...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-4 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1120px] rounded-[1.5rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1120px] space-y-6">
        <HeroBanner featuredProduct={featuredProduct} />

        <CategorySection
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <section id="new-arrivals" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 sm:text-[1.55rem]">
                Điện thoại mới về
              </h2>
              <p className="mt-1 text-[13px] text-slate-500">
                {activeCategory
                  ? `Đang hiển thị sản phẩm thuộc nhóm ${activeCategory}.`
                  : "Đang hiển thị toàn bộ danh sách điện thoại hiện có."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {activeCategory ? (
                <button
                  type="button"
                  onClick={() => setActiveCategory("")}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                >
                  Xem tất cả
                </button>
              ) : null}

              <span className="rounded-full bg-blue-50 px-4 py-2 text-[13px] font-semibold text-blue-700">
                {filteredProducts.length} sản phẩm
              </span>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
              Chưa có sản phẩm nào.
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  badge={getProductBadge(product, index)}
                  onAddToCart={addToCart}
                  isWishlisted={wishlistIds.has(product._id)}
                  onToggleWishlist={handleToggleWishlist}
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
    return "Nổi bật";
  }

  if (index % 2 === 0) {
    return "Mới";
  }

  return "";
}

export default ProductListPage;
