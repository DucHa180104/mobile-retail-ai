import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

const brandOptions = ["iPhone", "Samsung", "Xiaomi", "Oppo"];
const priceOptions = [
  { label: "Dưới 10 triệu", value: "under-10" },
  { label: "Từ 10 - 20 triệu", value: "10-20" },
  { label: "Trên 20 triệu", value: "over-20" }
];
const conditionOptions = ["Máy mới", "Máy cũ"];
const storageOptions = ["64GB", "128GB", "256GB"];
const sortOptions = ["Mới nhất", "Giá thấp", "Giá cao"];
const pageSize = 6;

function PhonesPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { searchTerm } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [selectedStorage, setSelectedStorage] = useState("");
  const [selectedSort, setSelectedSort] = useState("Mới nhất");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("http://localhost:5000/api/products");

        if (!response.ok) {
          throw new Error("Không thể tải danh sách sản phẩm");
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBrand, selectedPrice, selectedCondition, selectedStorage, selectedSort]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return products
      .filter((product) => {
        const name = product.name?.toLowerCase() || "";
        const brand = product.brand?.toLowerCase() || "";
        const storage = product.specs?.storage?.toLowerCase() || "";
        const condition = product.condition?.toLowerCase() || "";
        const price = Number(product.price) || 0;

        const matchesSearch =
          !normalizedQuery ||
          name.includes(normalizedQuery) ||
          brand.includes(normalizedQuery);

        const matchesBrand =
          !selectedBrand ||
          name.includes(selectedBrand.toLowerCase()) ||
          brand.includes(selectedBrand.toLowerCase());

        const matchesPrice =
          !selectedPrice ||
          (selectedPrice === "under-10" && price < 10000000) ||
          (selectedPrice === "10-20" && price >= 10000000 && price <= 20000000) ||
          (selectedPrice === "over-20" && price > 20000000);

        const matchesCondition =
          !selectedCondition ||
          !condition ||
          condition.includes(selectedCondition.toLowerCase());

        const matchesStorage =
          !selectedStorage ||
          storage.includes(selectedStorage.toLowerCase());

        return (
          matchesSearch &&
          matchesBrand &&
          matchesPrice &&
          matchesCondition &&
          matchesStorage
        );
      })
      .sort((firstProduct, secondProduct) => {
        if (selectedSort === "Giá thấp") {
          return (firstProduct.price || 0) - (secondProduct.price || 0);
        }

        if (selectedSort === "Giá cao") {
          return (secondProduct.price || 0) - (firstProduct.price || 0);
        }

        return 0;
      });
  }, [
    products,
    searchTerm,
    selectedBrand,
    selectedPrice,
    selectedCondition,
    selectedStorage,
    selectedSort
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[1.75rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-slate-600">Đang tải sản phẩm...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[1.75rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <CatalogBanner />

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <ProductFilterSidebar
            selectedBrand={selectedBrand}
            onSelectBrand={setSelectedBrand}
            selectedPrice={selectedPrice}
            onSelectPrice={setSelectedPrice}
            selectedCondition={selectedCondition}
            onSelectCondition={setSelectedCondition}
            selectedStorage={selectedStorage}
            onSelectStorage={setSelectedStorage}
            onClearFilters={() => {
              setSelectedBrand("");
              setSelectedPrice("");
              setSelectedCondition("");
              setSelectedStorage("");
            }}
          />

          <section className="space-y-5">
            <ProductSortBar
              totalProducts={filteredProducts.length}
              selectedSort={selectedSort}
              onSelectSort={setSelectedSort}
            />

            {products.length === 0 ? (
              <EmptyState message="Chưa có sản phẩm nào trong danh mục." />
            ) : filteredProducts.length === 0 ? (
              <EmptyState message="Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại." />
            ) : (
              <>
                <ProductGrid
                  products={paginatedProducts}
                  onAddToCart={addToCart}
                  onOpenProduct={(productId) => navigate(`/products/${productId}`)}
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
    <section className="overflow-hidden rounded-[1.75rem] border border-blue-100 bg-[linear-gradient(135deg,#e8f2ff_0%,#dbeafe_45%,#eff6ff_100%)] px-6 py-8 shadow-sm sm:px-8">
      <div className="max-w-2xl">
        <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
          Khuyến mãi mùa hè
        </span>
        <h1 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">
          Summer Sale 2024
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
          Ưu đãi giảm giá cho nhiều dòng điện thoại nổi bật, hỗ trợ trả góp và giao nhanh toàn quốc.
        </p>
      </div>
    </section>
  );
}

function ProductFilterSidebar({
  selectedBrand,
  onSelectBrand,
  selectedPrice,
  onSelectPrice,
  selectedCondition,
  onSelectCondition,
  selectedStorage,
  onSelectStorage,
  onClearFilters
}) {
  return (
    <aside className="h-fit rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
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

      <div className="mt-6 space-y-6">
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

        <FilterGroup title="Khoảng giá">
          {priceOptions.map((price) => (
            <FilterCheckbox
              key={price.value}
              label={price.label}
              checked={selectedPrice === price.value}
              onChange={() => onSelectPrice(selectedPrice === price.value ? "" : price.value)}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Tình trạng">
          {conditionOptions.map((condition) => (
            <FilterCheckbox
              key={condition}
              label={condition}
              checked={selectedCondition === condition}
              onChange={() =>
                onSelectCondition(selectedCondition === condition ? "" : condition)
              }
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Dung lượng">
          <div className="flex flex-wrap gap-2">
            {storageOptions.map((storage) => (
              <button
                key={storage}
                type="button"
                onClick={() =>
                  onSelectStorage(selectedStorage === storage ? "" : storage)
                }
                className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                  selectedStorage === storage
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"
                }`}
              >
                {storage}
              </button>
            ))}
          </div>
        </FilterGroup>
      </div>
    </aside>
  );
}

function FilterGroup({ title, children }) {
  return (
    <section className="border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
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
    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-black text-slate-900">Danh sách sản phẩm</h2>
        <p className="mt-1 text-sm text-slate-500">
          Đang hiển thị {totalProducts} sản phẩm
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-500">Sắp xếp</span>
        <select
          value={selectedSort}
          onChange={(event) => onSelectSort(event.target.value)}
          className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
        >
          {sortOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ProductGrid({ products, onAddToCart, onOpenProduct }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product, index) => (
        <CatalogProductCard
          key={product._id}
          product={product}
          badge={getProductBadge(product, index)}
          onAddToCart={onAddToCart}
          onOpenProduct={onOpenProduct}
        />
      ))}
    </div>
  );
}

function CatalogProductCard({ product, badge, onAddToCart, onOpenProduct }) {
  const imageUrl =
    product.images?.[0] || "https://via.placeholder.com/400x320?text=Khong+co+anh";

  return (
    <article
      onClick={() => onOpenProduct(product._id)}
      className="group cursor-pointer overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative overflow-hidden rounded-2xl bg-slate-100">
        {badge && (
          <span
            className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[11px] font-bold uppercase text-white ${
              badge === "HOT"
                ? "bg-red-500"
                : badge === "GIẢM GIÁ"
                  ? "bg-orange-500"
                  : "bg-blue-600"
            }`}
          >
            {badge}
          </span>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
          }}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition hover:text-red-500"
          aria-label={`Yêu thích ${product.name}`}
        >
          <HeartIcon />
        </button>

        <img
          src={imageUrl}
          alt={product.name}
          className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="pt-4">
        <h3 className="line-clamp-2 min-h-[50px] text-sm font-bold leading-6 text-slate-900 sm:text-base">
          {product.name}
        </h3>

        <p className="mt-3 text-xl font-black text-red-500">
          {product.price?.toLocaleString("vi-VN")} VND
        </p>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAddToCart(product);
            }}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Thêm vào giỏ
          </button>

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
    <div className="flex items-center justify-center gap-2 pt-2">
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
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">
      {message}
    </div>
  );
}

function getProductBadge(product, index) {
  const stock = Number(product.stock) || 0;
  const price = Number(product.price) || 0;

  if (stock > 0 && stock <= 5) {
    return "HOT";
  }

  if (price >= 20000000) {
    return "GIẢM GIÁ";
  }

  if (index % 2 === 0) {
    return "NEW";
  }

  return "";
}

function HeartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
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
