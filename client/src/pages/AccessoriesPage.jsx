import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";
import ProductCard from "../components/ProductCard.jsx";

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

const pageSize = 20;

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
      <main className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-[1360px] rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <p className="font-bold text-red-700">{error}</p>
        </div>
      </main>
    );
  }

  const categoriesList = [
    { label: "Đề xuất", to: "/" },
    { label: "Điện thoại", to: "/phones" },
    { label: "Máy tính bảng", to: "/tablets" },
    { label: "Phụ kiện", to: "/accessories", active: true }
  ];

  return (
    <main className="px-4 py-8 sm:px-6 bg-white">
      <div className="mx-auto max-w-[1360px] space-y-6">
        {/* Horizontal Category pills scroll */}
        <div className="flex gap-2.5 overflow-x-auto pb-3 border-b border-slate-100 no-scrollbar scroll-smooth">
          {categoriesList.map((cat, idx) => (
            <Link
              key={idx}
              to={cat.to}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 ${
                cat.active
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-800"
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[250px_1fr] pt-4">
          <ProductFilterSidebar
            title="Phụ kiện"
            totalProducts={totalProducts}
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

          <section className="space-y-6">
            <ProductSortBar
              totalProducts={totalProducts}
              selectedSort={selectedSort}
              onSelectSort={setSelectedSort}
              selectedBrand={selectedBrand}
              selectedCondition={selectedCondition}
              selectedType={selectedType}
              selectedPriceRange={selectedPriceRange}
              onClearBrand={() => setSelectedBrand("")}
              onClearCondition={() => setSelectedCondition("")}
              onClearType={() => setSelectedType("")}
              onClearPriceRange={() => setSelectedPriceRange("")}
            />

            {paginatedProducts.length === 0 ? (
              <EmptyState message="Không tìm thấy phụ kiện phù hợp" />
            ) : (
              <>
                <ProductGrid
                  products={paginatedProducts}
                  wishlistIds={wishlistIds}
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

function ProductFilterSidebar({
  title,
  totalProducts,
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
  const brandLogos = {
    Apple: <AppleLogo />,
    Samsung: <SamsungLogo />,
    Anker: <AnkerLogo />,
    Baseus: <BaseusLogo />,
    JBL: <JblLogo />
  };

  const hasAnyFilter = selectedBrand || selectedCondition || selectedType || selectedPriceRange;

  return (
    <aside className="h-fit bg-white lg:sticky lg:top-28 lg:self-start space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h1 className="text-lg font-black text-slate-900 tracking-tight">{title}</h1>
        <p className="text-[11px] text-slate-400 font-bold mt-0.5">{totalProducts} sản phẩm</p>
      </div>

      <div className="space-y-6">
        <FilterGroup title="Hãng">
          {brandOptions.map((brand) => (
            <FilterCheckbox
              key={brand}
              label={brand}
              checked={selectedBrand === brand}
              onChange={() => onSelectBrand(selectedBrand === brand ? "" : brand)}
              logo={brandLogos[brand]}
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

      {hasAnyFilter ? (
        <div className="pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClearFilters}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-900 underline transition py-2 bg-slate-50 hover:bg-slate-100 rounded-xl"
          >
            Xóa tất cả bộ lọc
          </button>
        </div>
      ) : null}
    </aside>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange, logo }) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1 text-xs text-slate-600 transition hover:text-slate-900">
      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 rounded border-slate-300 text-slate-900 accent-slate-900 focus:ring-0 focus:ring-offset-0"
        />
        <span className={checked ? "font-bold text-slate-900" : "font-medium"}>{label}</span>
      </div>
      {logo ? <span className="opacity-70">{logo}</span> : null}
    </label>
  );
}

function ProductSortBar({
  totalProducts,
  selectedSort,
  onSelectSort,
  selectedBrand,
  selectedCondition,
  selectedType,
  selectedPriceRange,
  onClearBrand,
  onClearCondition,
  onClearType,
  onClearPriceRange
}) {
  const getConditionLabel = (val) => conditionOptions.find(o => o.value === val)?.label || val;
  const getPriceLabel = (val) => priceRangeOptions.find(o => o.value === val)?.label || val;
  const getTypeLabel = (val) => accessoryTypeOptions.find(o => o.value === val)?.label || val;

  const hasFilters = selectedBrand || selectedCondition || selectedType || selectedPriceRange;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
      {/* Active tags */}
      <div className="flex flex-wrap items-center gap-2">
        {hasFilters ? (
          <>
            {selectedBrand && (
              <ActiveTag label={selectedBrand} onClear={onClearBrand} />
            )}
            {selectedType && (
              <ActiveTag label={getTypeLabel(selectedType)} onClear={onClearType} />
            )}
            {selectedCondition && (
              <ActiveTag label={getConditionLabel(selectedCondition)} onClear={onClearCondition} />
            )}
            {selectedPriceRange && (
              <ActiveTag label={getPriceLabel(selectedPriceRange)} onClear={onClearPriceRange} />
            )}
          </>
        ) : (
          <span className="text-xs text-slate-400 font-bold">Tất cả sản phẩm ({totalProducts})</span>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sắp xếp:</span>
        <select
          value={selectedSort}
          onChange={(event) => onSelectSort(event.target.value)}
          className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer hover:text-slate-950 transition"
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

function ActiveTag({ label, onClear }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-700 ring-1 ring-sky-100/50">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="text-sky-500 hover:text-sky-850 font-extrabold focus:outline-none ml-0.5 text-xs"
        aria-label="Xóa bộ lọc"
      >
        ×
      </button>
    </span>
  );
}

function ProductGrid({ products, wishlistIds, onToggleWishlist }) {
  return (
    <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard
          key={product._id}
          product={product}
          badge={getProductBadge(product, index)}
          isWishlisted={wishlistIds.has(product._id)}
          onToggleWishlist={onToggleWishlist}
        />
      ))}
    </div>
  );
}

function Pagination({ currentPage, totalPages, onChangePage }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-100">
      <button
        type="button"
        onClick={() => onChangePage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:border-slate-800 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ‹
      </button>

      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onChangePage(page)}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
            currentPage === page
              ? "bg-slate-900 text-white shadow-sm"
              : "border border-slate-200 bg-white text-slate-600 hover:border-slate-800 hover:text-slate-900"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChangePage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:border-slate-800 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ›
      </button>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-slate-400">
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <p className="font-bold text-slate-700 text-sm">{message}</p>
      <p className="mt-1 text-xs text-slate-400">Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác.</p>
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

function getProductBadge(product, index) {
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

// Brand SVG Logos matching mockup style
const AppleLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-slate-950">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.72-1.18 1.87-1.03 2.98 1.12.09 2.27-.56 2.98-1.42z" />
  </svg>
);

const SamsungLogo = () => (
  <span className="text-[7px] font-black tracking-tighter text-blue-900 font-sans">SAMSUNG</span>
);

const XiaomiLogo = () => (
  <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-orange-500 text-[6px] font-black text-white leading-none">mi</span>
);

const AnkerLogo = () => (
  <span className="text-[7px] font-black text-slate-800 font-sans uppercase">anker</span>
);

const BaseusLogo = () => (
  <span className="text-[7px] font-black text-slate-850 font-serif lowercase italic">Baseus</span>
);

const JblLogo = () => (
  <span className="text-[8px] font-black text-orange-600 font-sans tracking-tight">JBL</span>
);

export default AccessoriesPage;
