import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import CategorySection from "../components/CategorySection.jsx";
import HeroBanner from "../components/HeroBanner.jsx";
import ProductCard from "../components/ProductCard.jsx";
import TrustBadges from "../components/TrustBadges.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl, resolveMediaUrl } from "../lib/api.js";

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
        setProducts(Array.isArray(data) ? data : data.products || []);
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
  const recommendedProducts = useMemo(() => products.slice(0, 5), [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const name = product.name?.toLowerCase() || "";
      const brand = product.brand?.toLowerCase() || "";
      const category = product.category?.toLowerCase() || "";

      const matchesSearch =
        !normalizedQuery ||
        name.includes(normalizedQuery) ||
        brand.includes(normalizedQuery) ||
        category.includes(normalizedQuery);

      if (!activeCategory) {
        return matchesSearch;
      }

      const categoryQuery =
        activeCategory === "Phụ kiện" ? "phụ kiện" : activeCategory.toLowerCase();

      const matchesCategory =
        name.includes(categoryQuery) ||
        brand.includes(categoryQuery) ||
        category.includes(categoryQuery) ||
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
      <main className="px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-[1360px] space-y-6">
          <div className="skeleton h-[420px] rounded-2xl" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="skeleton h-28 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="skeleton h-[370px] rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-[1360px] rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <p className="font-bold text-red-700">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 sm:px-6 bg-white">
      <div className="mx-auto max-w-[1360px] space-y-12">
        <HeroBanner />

        {recommendedProducts.length > 0 ? (
          <section className="space-y-6">
            <div className="flex items-end justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-950 tracking-tight">Sản phẩm nổi bật</h2>
              <Link to="/products" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-0.5 transition">
                Xem tất cả
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {recommendedProducts.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  badge={getProductBadge(product, index)}
                  isWishlisted={wishlistIds.has(product._id)}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section id="new-arrivals" className="space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-950 tracking-tight">Khám phá theo sở thích</h2>
            <div className="mt-4">
              <CategorySection
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </div>
          </div>

          {products.length === 0 ? (
            <EmptyState title="Chưa có sản phẩm nào" description="Sản phẩm sẽ được cập nhật sớm." />
          ) : filteredProducts.length === 0 ? (
            <EmptyState title="Không tìm thấy sản phẩm" description="Thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác." />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
      </div>
    </main>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-blue-650">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
      {description ? <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-500">{description}</p> : null}
    </div>
  );
}

function CompactProduct({ product }) {
  const imageUrl =
    resolveMediaUrl(product.images?.[0]) ||
    "https://via.placeholder.com/320x240?text=Mobile+Retail+AI";

  return (
    <Link
      to={`/products/${product._id}`}
      className="group grid grid-cols-[96px_1fr] gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5"
    >
      <img src={imageUrl} alt={product.name} className="h-24 w-24 rounded-xl object-cover transition-transform duration-500 group-hover:scale-105 border border-slate-100" loading="lazy" />
      <div className="min-w-0 flex flex-col justify-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">{product.brand || "Mobile"}</p>
        <h3 className="mt-1 line-clamp-2 text-xs font-black leading-normal text-slate-800 transition-colors group-hover:text-blue-600">{product.name}</h3>
        <p className="mt-2 text-sm font-black text-rose-600">
          {product.price?.toLocaleString("vi-VN")} đ
        </p>
      </div>
    </Link>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <p className="font-black text-slate-800 text-sm">{title}</p>
      <p className="mt-1.5 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function getProductBadge(product, index) {
  if ((product.stock || 0) <= 5 && (product.stock || 0) > 0) {
    return "Sắp hết";
  }

  if (index < 4) {
    return "Nổi bật";
  }

  return "";
}

export default ProductListPage;
