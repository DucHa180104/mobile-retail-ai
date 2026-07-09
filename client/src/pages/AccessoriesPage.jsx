import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl, resolveMediaUrl } from "../lib/api.js";

const brandOptions = ["Apple", "Samsung", "Anker", "Baseus", "JBL"];

const conditionOptions = [
  { label: "Máy mới", value: "new" },
  { label: "Cũ 99%", value: "used_99" },
  { label: "Cũ đẹp", value: "used_good" },
  { label: "Cũ dùng tốt", value: "used_fair" }
];

const accessoryTypeOptions = [
  { label: "Tai nghe", value: "audio" },
  { label: "Sạc / cáp", value: "charger" },
  { label: "Bút / bàn phím", value: "input" },
  { label: "Ốp / bao da", value: "case" }
];

const sortOptions = [
  { label: "Mới nhất", value: "newest" },
  { label: "Giá thấp", value: "price_asc" },
  { label: "Giá cao", value: "price_desc" }
];

const priceRangeOptions = [
  { label: "Dưới 1 triệu", value: "under_1m", minPrice: 0, maxPrice: 1000000 },
  { label: "1 - 3 triệu", value: "1m_3m", minPrice: 1000000, maxPrice: 3000000 },
  { label: "3 - 6 triệu", value: "3m_6m", minPrice: 3000000, maxPrice: 6000000 },
  { label: "Trên 6 triệu", value: "above_6m", minPrice: 6000000, maxPrice: null }
];

const pageSize = 6;

function AccessoriesPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const { searchTerm } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        const selectedPrice = priceRangeOptions.find(
          (option) => option.value === selectedPriceRange
        );

        params.set("category", "accessory");

        if (searchTerm.trim()) {
          params.set("keyword", searchTerm.trim());
        }

        if (selectedBrand) {
          params.set("brand", selectedBrand);
        }

        if (selectedCondition) {
          params.set("condition", selectedCondition);
        }

        if (selectedPrice) {
          params.set("minPrice", String(selectedPrice.minPrice));

          if (selectedPrice.maxPrice !== null) {
            params.set("maxPrice", String(selectedPrice.maxPrice));
          }
        }

        params.set("sort", selectedSort);
        params.set("page", "1");
        params.set("limit", "100");

        const response = await fetch(buildApiUrl(`/api/products?${params.toString()}`));

        if (!response.ok) {
          throw new Error("Không thể tải danh sách phụ kiện");
        }

        const data = await response.json();
        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (fetchError) {
        setError(fetchError.message || "Không thể tải danh sách phụ kiện");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [searchTerm, selectedBrand, selectedCondition, selectedPriceRange, selectedSort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBrand, selectedCondition, selectedType, selectedPriceRange, selectedSort]);

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
        setWishlist(Array.isArray(data.wishlist) ? data.wishlist : []);
      } catch {
        setWishlist([]);
      }
    }

    fetchWishlist();
  }, [isAuthenticated, token]);

  const wishlistIds = useMemo(() => new Set(wishlist.map((product) => product._id)), [wishlist]);

  const filteredProducts = useMemo(() => {
    if (!selectedType) {
      return products;
    }

    return products.filter((product) => detectAccessoryType(product) === selectedType);
  }, [products, selectedType]);

  const totalProducts = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
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

      setWishlist(Array.isArray(data.wishlist) ? data.wishlist : []);
    } catch (toggleError) {
      window.alert(toggleError.message || "Không thể cập nhật danh sách yêu thích");
    }
  }

  if (loading) {
    return (
      <main className="px-4 py-5 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1120px] space-y-5">
          <div className="skeleton h-36 rounded-3xl" />
          <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
            <div className="h-fit space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="skeleton h-5 w-20 rounded" />
                <div className="skeleton h-7 w-16 rounded-full" />
              </div>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="space-y-2.5 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="skeleton h-4.5 w-20 rounded" />
                  <div className="space-y-2">
                    {[...Array(4)].map((_, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 py-0.5">
                        <div className="skeleton h-4 w-4 rounded" />
                        <div className="skeleton h-3.5 w-20 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="skeleton h-20 rounded-2xl" />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <div className="skeleton h-52 rounded-xl" />
                    <div className="mt-4 space-y-2.5">
                      <div className="skeleton h-4 w-full rounded" />
                      <div className="skeleton h-5.5 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-5 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1120px] rounded-2xl border border-red-100 bg-red-50 px-6 py-14 text-center shadow-sm">
          <p className="font-semibold text-red-700">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-5 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1120px] space-y-5">
        <CatalogBanner />

        <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
          <ProductFilterSidebar
            selectedBrand={selectedBrand}
            onSelectBrand={setSelectedBrand}
            selectedCondition={selectedCondition}
            onSelectCondition={setSelectedCondition}
            selectedType={selectedType}
            onSelectType={setSelectedType}
            selectedPriceRange={selectedPriceRange}
            onSelectPriceRange={setSelectedPriceRange}
            onClearFilters={() => {
              setSelectedBrand("");
              setSelectedCondition("");
              setSelectedType("");
              setSelectedPriceRange("");
              setSelectedSort("newest");
            }}
          />

          <section className="space-y-4">
            <ProductSortBar
              totalProducts={totalProducts}
              selectedSort={selectedSort}
              onSelectSort={setSelectedSort}
            />

            {paginatedProducts.length === 0 ? (
              <EmptyState message="Không tìm thấy phụ kiện phù hợp" />
            ) : (
              <>
                <ProductGrid
                  products={paginatedProducts}
                  wishlistIds={wishlistIds}
                  onOpenProduct={(productId) => navigate(`/products/${productId}`)}
                  onToggleWishlist={handleToggleWishlist}
                />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onChangePage={setCurrentPage}
                />
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function CatalogBanner() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-tr from-slate-900 via-fuchsia-950 to-slate-950 px-8 py-9 text-white shadow-xl shadow-fuchsia-950/20 sm:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(217,70,239,0.12),transparent_50%)]" />
      <div className="relative max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-300 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-300 animate-pulse" />
          Danh mục phụ kiện
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Phụ kiện công nghệ cho điện thoại và máy tính bảng
        </h1>
        <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-slate-300">
          Tìm nhanh tai nghe, sạc, cáp, bút cảm ứng và các phụ kiện phổ biến theo nhu cầu sử dụng.
        </p>
      </div>
    </section>
  );
}

function ProductFilterSidebar({
  selectedBrand,
  onSelectBrand,
  selectedCondition,
  onSelectCondition,
  selectedType,
  onSelectType,
  selectedPriceRange,
  onSelectPriceRange,
  onClearFilters
}) {
  return (
    <aside className="h-fit rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:self-start">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-slate-800">Bộ lọc tìm kiếm</h2>
        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-fuchsia-100 hover:bg-fuchsia-50 hover:text-fuchsia-700"
        >
          Xóa lọc
        </button>
      </div>

      <div className="mt-5 space-y-5">
        <FilterGroup title="Hãng">
          {brandOptions.map((brand) => (
            <FilterCheckbox
              key={brand}
              label={brand}
              checked={selectedBrand === brand}
              onChange={() => onSelectBrand(selectedBrand === brand ? "" : brand)}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Nhóm phụ kiện">
          {accessoryTypeOptions.map((type) => (
            <FilterCheckbox
              key={type.value}
              label={type.label}
              checked={selectedType === type.value}
              onChange={() => onSelectType(selectedType === type.value ? "" : type.value)}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Tình trạng">
          {conditionOptions.map((condition) => (
            <FilterCheckbox
              key={condition.value}
              label={condition.label}
              checked={selectedCondition === condition.value}
              onChange={() =>
                onSelectCondition(selectedCondition === condition.value ? "" : condition.value)
              }
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Khoảng giá">
          {priceRangeOptions.map((range) => (
            <FilterCheckbox
              key={range.value}
              label={range.label}
              checked={selectedPriceRange === range.value}
              onChange={() =>
                onSelectPriceRange(selectedPriceRange === range.value ? "" : range.value)
              }
            />
          ))}
        </FilterGroup>
      </div>
    </aside>
  );
}

function FilterGroup({ title, children }) {
  return (
    <section className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function FilterCheckbox({ label, checked, onChange }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-all duration-200 ${
        checked ? "bg-fuchsia-50/60 text-fuchsia-700" : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4.5 w-4.5 rounded border-slate-200 accent-fuchsia-600 focus:ring-fuchsia-500 focus:ring-offset-0"
      />
      <span className={checked ? "font-bold" : "font-medium"}>{label}</span>
    </label>
  );
}

function ProductSortBar({ totalProducts, selectedSort, onSelectSort }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-black text-slate-800">Danh sách phụ kiện</h2>
        <p className="mt-0.5 text-xs font-bold text-slate-400">
          Tìm thấy <span className="font-extrabold text-fuchsia-700">{totalProducts}</span> sản phẩm
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sắp xếp:</span>
        <select
          value={selectedSort}
          onChange={(event) => onSelectSort(event.target.value)}
          className="rounded-full border border-slate-150 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 outline-none transition-all duration-300 focus:border-fuchsia-300 focus:bg-white focus:ring-4 focus:ring-fuchsia-50"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ProductGrid({ products, wishlistIds, onOpenProduct, onToggleWishlist }) {
  return (
    <div className="grid gap-4.5 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <CatalogProductCard
          key={product._id}
          product={product}
          accessoryType={getAccessoryTypeLabel(product)}
          isWishlisted={wishlistIds.has(product._id)}
          onOpenProduct={onOpenProduct}
          onToggleWishlist={onToggleWishlist}
        />
      ))}
    </div>
  );
}

function CatalogProductCard({
  product,
  accessoryType,
  isWishlisted,
  onOpenProduct,
  onToggleWishlist
}) {
  const imageUrl =
    resolveMediaUrl(product.images?.[0]) ||
    "https://via.placeholder.com/400x320?text=Khong+co+anh";

  return (
    <article
      onClick={() => onOpenProduct(product._id)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-fuchsia-100 hover:shadow-lg hover:shadow-fuchsia-100/30"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-50">
        <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
          {accessoryType}
        </span>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all duration-300 active:scale-95 ${
            isWishlisted
              ? "text-red-500 shadow-red-100"
              : "text-slate-400 hover:text-red-500 hover:shadow-red-100"
          }`}
          aria-label={`${isWishlisted ? "Bỏ yêu thích" : "Thêm yêu thích"} ${product.name}`}
        >
          <HeartIcon isFilled={isWishlisted} />
        </button>

        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex min-h-[160px] flex-col justify-between pt-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {product.brand ? (
              <span className="inline-flex items-center rounded-md border border-fuchsia-100 bg-fuchsia-50/50 px-1.5 py-0.5 text-[10px] font-extrabold text-fuchsia-700">
                {product.brand}
              </span>
            ) : null}
            {product.usedDetails?.warranty ? (
              <span className="inline-flex items-center rounded-md border border-emerald-100 bg-emerald-50/50 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-600">
                {product.usedDetails.warranty}
              </span>
            ) : null}
          </div>

          <h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-800 transition-colors duration-150 group-hover:text-fuchsia-700">
            {product.name}
          </h3>
        </div>

        <div>
          <p className="mt-2.5 text-base font-black text-rose-500 sm:text-lg">
            {product.price?.toLocaleString("vi-VN")} đ
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Link
              to={`/products/${product._id}`}
              onClick={(event) => event.stopPropagation()}
              className="flex-1 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 py-2.5 text-center text-xs font-bold text-white shadow-sm shadow-fuchsia-100 transition-all duration-300 hover:from-fuchsia-700 hover:to-pink-700 hover:shadow-md hover:shadow-fuchsia-200/50 active:scale-95"
            >
              Xem chi tiết
            </Link>

            <Link
              to={`/products/${product._id}`}
              onClick={(event) => event.stopPropagation()}
              className="rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-500 transition-all duration-300 hover:border-fuchsia-200 hover:bg-fuchsia-50 hover:text-fuchsia-700 active:scale-95"
              aria-label={`Chi tiết ${product.name}`}
            >
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function Pagination({ currentPage, totalPages, onChangePage }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        type="button"
        onClick={() => onChangePage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:border-fuchsia-300 hover:bg-fuchsia-50 hover:text-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ‹
      </button>

      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onChangePage(page)}
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-all duration-300 ${
            currentPage === page
              ? "bg-gradient-to-tr from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-100"
              : "border border-slate-200 bg-white text-slate-600 hover:border-fuchsia-300 hover:bg-fuchsia-50 hover:text-fuchsia-700"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChangePage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:border-fuchsia-300 hover:bg-fuchsia-50 hover:text-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ›
      </button>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-fuchsia-50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-8 w-8 text-fuchsia-500"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <p className="font-semibold text-slate-700">{message}</p>
      <p className="mt-1 text-sm text-slate-400">
        Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác.
      </p>
    </div>
  );
}

function detectAccessoryType(product) {
  const source = `${product.name || ""} ${product.description || ""}`.toLowerCase();

  if (
    source.includes("airpods") ||
    source.includes("tai nghe") ||
    source.includes("buds") ||
    source.includes("loa")
  ) {
    return "audio";
  }

  if (
    source.includes("sac") ||
    source.includes("cap") ||
    source.includes("charger") ||
    source.includes("adapter")
  ) {
    return "charger";
  }

  if (
    source.includes("pencil") ||
    source.includes("but") ||
    source.includes("ban phim") ||
    source.includes("keyboard")
  ) {
    return "input";
  }

  return "case";
}

function getAccessoryTypeLabel(product) {
  const type = detectAccessoryType(product);

  if (type === "audio") {
    return "Tai nghe";
  }

  if (type === "charger") {
    return "Sạc / cáp";
  }

  if (type === "input") {
    return "Bút / bàn phím";
  }

  return "Ốp / bao da";
}

function HeartIcon({ isFilled }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={isFilled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m12 20-1.4-1.3C5.4 14 2 10.9 2 7.2 2 4.4 4.2 2 7 2c1.6 0 3.2.7 4.2 1.9C12.8 2.7 14.4 2 16 2c2.8 0 5 2.4 5 5.2 0 3.7-3.4 6.8-8.6 11.5Z"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

export default AccessoriesPage;
