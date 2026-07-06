import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import CategorySection from "../components/CategorySection.jsx";
import HeroBanner from "../components/HeroBanner.jsx";
import ProductCard from "../components/ProductCard.jsx";
import TrustBadges from "../components/TrustBadges.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

function ProductListPage() {
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
        <div className="mx-auto max-w-[1120px] space-y-6">
          {/* Hero skeleton */}
          <div className="grid gap-3 lg:grid-cols-[2fr_0.95fr]">
            <div className="skeleton h-64 rounded-3xl sm:h-72" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="skeleton h-32 rounded-2xl" />
              <div className="skeleton h-32 rounded-2xl" />
            </div>
          </div>
          {/* Category skeleton */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-4">
                <div className="skeleton h-12 w-12 rounded-2xl" />
                <div className="skeleton mt-3 h-4 w-16 rounded" />
              </div>
            ))}
          </div>
          {/* Cards skeleton */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
                <div className="skeleton h-44 rounded-xl" />
                <div className="mt-3 space-y-2">
                  <div className="skeleton h-4 w-full rounded" />
                  {/* Rating placeholder skeleton */}
                  <div className="flex gap-1 py-1">
                    {[...Array(5)].map((_, idx) => (
                      <div key={idx} className="skeleton h-3 w-3 rounded-full" />
                    ))}
                  </div>
                  <div className="skeleton h-5 w-1/2 rounded" />
                  <div className="flex gap-2 pt-2">
                    <div className="skeleton h-9.5 flex-1 rounded-xl" />
                    <div className="skeleton h-9.5 w-10 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-4 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1120px] rounded-2xl border border-red-100 bg-red-50 px-6 py-14 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7 text-red-500">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </div>
          <p className="font-semibold text-red-700">{error}</p>
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
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 14h.01M12 14h.01" />
                </svg>
              </div>
              <p className="font-semibold text-slate-700">Chưa có sản phẩm nào</p>
              <p className="mt-1 text-sm text-slate-400">Sản phẩm sẽ được cập nhật sớm.</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-blue-400">
                  <circle cx="11" cy="11" r="7" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <p className="font-semibold text-slate-700">Không tìm thấy sản phẩm</p>
              <p className="mt-1 text-sm text-slate-400">Thử tìm kiếm với từ khóa khác.</p>
            </div>
          ) : (
            <div className="grid animate-fade-in gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  badge={getProductBadge(product, index)}
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
