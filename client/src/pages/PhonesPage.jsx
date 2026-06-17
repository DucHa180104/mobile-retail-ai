import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

const brandOptions = ["Apple", "Samsung", "Xiaomi", "Oppo"];

const conditionOptions = [
  { label: "Cũ 99%", value: "used_99" },
  { label: "Cũ đẹp", value: "used_good" },
  { label: "Cũ dùng tốt", value: "used_fair" },
  { label: "Máy mới", value: "new" }
];

const sortOptions = [
  { label: "Mới nhất", value: "newest" },
  { label: "Giá thấp", value: "price_asc" },
  { label: "Giá cao", value: "price_desc" }
];

const storageOptions = ["64GB", "128GB", "256GB", "512GB"];

const priceRangeOptions = [
  { label: "Dưới 10 triệu", value: "under_10m", minPrice: 0, maxPrice: 10000000 },
  { label: "10 - 15 triệu", value: "10m_15m", minPrice: 10000000, maxPrice: 15000000 },
  { label: "15 - 20 triệu", value: "15m_20m", minPrice: 15000000, maxPrice: 20000000 },
  { label: "Trên 20 triệu", value: "above_20m", minPrice: 20000000, maxPrice: null }
];

const pageSize = 6;

function PhonesPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const { searchTerm } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [selectedStorage, setSelectedStorage] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        const selectedPrice = priceRangeOptions.find(
          (option) => option.value === selectedPriceRange
        );

        if (searchTerm.trim()) {
          params.set("keyword", searchTerm.trim());
        }

        if (selectedBrand) {
          params.set("brand", selectedBrand);
        }

        if (selectedCondition) {
          params.set("condition", selectedCondition);
        }

        if (selectedStorage) {
          params.set("storage", selectedStorage);
        }

        if (selectedPrice) {
          params.set("minPrice", String(selectedPrice.minPrice));

          if (selectedPrice.maxPrice !== null) {
            params.set("maxPrice", String(selectedPrice.maxPrice));
          }
        }

        params.set("sort", selectedSort);
        params.set("page", String(currentPage));
        params.set("limit", String(pageSize));

        const queryString = params.toString();
        const url = queryString
          ? buildApiUrl(`/api/products?${queryString}`)
          : buildApiUrl("/api/products");

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Không thể tải danh sách sản phẩm");
        }

        const data = await response.json();
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
        setTotalProducts(data.totalProducts || 0);
      } catch (fetchError) {
        setError(fetchError.message || "Không thể tải danh sách sản phẩm");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [
    searchTerm,
    selectedBrand,
    selectedCondition,
    selectedStorage,
    selectedPriceRange,
    selectedSort,
    currentPage
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedBrand,
    selectedCondition,
    selectedStorage,
    selectedPriceRange,
    selectedSort
  ]);

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

  const wishlistIds = useMemo(() => new Set(wishlist.map((product) => product._id)), [wishlist]);

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
      <main className="px-4 py-5 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1120px] rounded-[1.6rem] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-slate-600">Đang tải sản phẩm...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-5 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1120px] rounded-[1.6rem] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-red-600">{error}</p>
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
            selectedStorage={selectedStorage}
            onSelectStorage={setSelectedStorage}
            selectedPriceRange={selectedPriceRange}
            onSelectPriceRange={setSelectedPriceRange}
            onClearFilters={() => {
              setSelectedBrand("");
              setSelectedCondition("");
              setSelectedStorage("");
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

            {products.length === 0 ? (
              <EmptyState message="Không tìm thấy sản phẩm" />
            ) : (
              <>
                <ProductGrid
                  products={products}
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
    <section className="overflow-hidden rounded-[1.6rem] border border-blue-100 bg-[linear-gradient(135deg,#e8f2ff_0%,#dbeafe_45%,#eff6ff_100%)] px-6 py-6 shadow-sm sm:px-7">
      <div className="max-w-2xl">
        <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
          Điện thoại cũ
        </span>
        <h1 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
          Danh sách điện thoại
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
          Tìm nhanh theo tên máy, hãng, tình trạng, dung lượng và khoảng giá phù hợp
          nhu cầu.
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
  selectedStorage,
  onSelectStorage,
  selectedPriceRange,
  onSelectPriceRange,
  onClearFilters
}) {
  return (
    <aside className="h-fit rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-900">Bộ lọc</h2>
        <button
          type="button"
          onClick={onClearFilters}
          className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
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

        <FilterGroup title="Dung lượng">
          {storageOptions.map((storage) => (
            <FilterCheckbox
              key={storage}
              label={storage}
              checked={selectedStorage === storage}
              onChange={() => onSelectStorage(selectedStorage === storage ? "" : storage)}
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
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function FilterCheckbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 text-sm text-slate-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
      <span>{label}</span>
    </label>
  );
}

function ProductSortBar({ totalProducts, selectedSort, onSelectSort }) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.6rem] border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-black text-slate-900">Danh sách sản phẩm</h2>
        <p className="mt-1 text-sm text-slate-500">Đang hiển thị {totalProducts} sản phẩm</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-500">Sắp xếp</span>
        <select
          value={selectedSort}
          onChange={(event) => onSelectSort(event.target.value)}
          className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <CatalogProductCard
          key={product._id}
          product={product}
          badge={getProductBadge(product)}
          isWishlisted={wishlistIds.has(product._id)}
          onOpenProduct={onOpenProduct}
          onToggleWishlist={onToggleWishlist}
        />
      ))}
    </div>
  );
}

function CatalogProductCard({ product, badge, isWishlisted, onOpenProduct, onToggleWishlist }) {
  const imageUrl =
    product.images?.[0] || "https://via.placeholder.com/400x320?text=Khong+co+anh";

  return (
    <article
      onClick={() => onOpenProduct(product._id)}
      className="group cursor-pointer overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative overflow-hidden rounded-2xl bg-slate-100">
        {badge ? (
          <span
            className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[11px] font-bold uppercase text-white ${
              badge === "Cũ 99%"
                ? "bg-amber-500"
                : badge === "Cũ đẹp"
                  ? "bg-blue-600"
                  : badge === "Cũ dùng tốt"
                    ? "bg-slate-600"
                    : "bg-emerald-600"
            }`}
          >
            {badge}
          </span>
        ) : null}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition ${
            isWishlisted ? "text-red-500" : "text-slate-500 hover:text-red-500"
          }`}
          aria-label={`${isWishlisted ? "Bỏ yêu thích" : "Thêm yêu thích"} ${product.name}`}
        >
          <HeartIcon isFilled={isWishlisted} />
        </button>

        <img
          src={imageUrl}
          alt={product.name}
          className="h-52 w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="pt-4">
        <h3 className="line-clamp-2 min-h-[50px] text-sm font-bold leading-6 text-slate-900 sm:text-base">
          {product.name}
        </h3>

        <p className="mt-3 text-xl font-black text-red-500">
          {product.price?.toLocaleString("vi-VN")} đ
        </p>

        <div className="mt-4 flex items-center gap-3">
          <Link
            to={`/products/${product._id}`}
            onClick={(event) => event.stopPropagation()}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Mua ngay
          </Link>

          <Link
            to={`/products/${product._id}`}
            onClick={(event) => event.stopPropagation()}
            className="rounded-xl border border-slate-200 px-3 py-3 text-slate-600 transition hover:bg-slate-50 hover:text-blue-700"
            aria-label={`Xem chi tiết ${product.name}`}
          >
            <ArrowIcon />
          </Link>
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
    <div className="flex items-center justify-center gap-2 pt-1">
      <button
        type="button"
        onClick={() => onChangePage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ‹
      </button>

      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onChangePage(page)}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
            currentPage === page
              ? "bg-blue-600 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChangePage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ›
      </button>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-slate-500 shadow-sm">
      {message}
    </div>
  );
}

function getProductBadge(product) {
  if (product.condition === "used_99") {
    return "Cũ 99%";
  }

  if (product.condition === "used_good") {
    return "Cũ đẹp";
  }

  if (product.condition === "used_fair") {
    return "Cũ dùng tốt";
  }

  return "Máy mới";
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

export default PhonesPage;
