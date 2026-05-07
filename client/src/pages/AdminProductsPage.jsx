import { useEffect, useMemo, useState } from "react";

const brandOptions = ["Tất cả", "Apple", "Samsung", "Xiaomi", "Oppo"];
const conditionOptions = ["Tất cả", "New", "Cũ 99%", "Cũ đẹp"];
const priceOptions = ["Mọi giá", "Dưới 10 triệu", "10 - 20 triệu", "Trên 20 triệu"];

const emptyForm = {
  name: "",
  brand: "Apple",
  price: "",
  stock: "",
  images: "",
  description: "",
  specs: {
    screen: "",
    chip: "",
    ram: "",
    storage: "",
    battery: "",
    camera: ""
  }
};

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState("Tất cả");
  const [conditionFilter, setConditionFilter] = useState("Tất cả");
  const [priceFilter, setPriceFilter] = useState("Mọi giá");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/api/products");

      if (!response.ok) {
        throw new Error("Không thể tải danh sách sản phẩm");
      }

      const data = await response.json();
      setProducts(data);
    } catch (fetchError) {
      setError(fetchError.message || "Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = searchTerm.trim().toLowerCase();
      const name = product.name?.toLowerCase() || "";
      const displayBrand = getDisplayBrand(product).toLowerCase();
      const condition = getConditionLabel(product);
      const price = Number(product.price) || 0;

      const matchesSearch = !query || name.includes(query) || displayBrand.includes(query);
      const matchesBrand = brandFilter === "Tất cả" || displayBrand === brandFilter.toLowerCase();
      const matchesCondition =
        conditionFilter === "Tất cả" || condition === conditionFilter;
      const matchesPrice =
        priceFilter === "Mọi giá" ||
        (priceFilter === "Dưới 10 triệu" && price < 10000000) ||
        (priceFilter === "10 - 20 triệu" && price >= 10000000 && price <= 20000000) ||
        (priceFilter === "Trên 20 triệu" && price > 20000000);

      return matchesSearch && matchesBrand && matchesCondition && matchesPrice;
    });
  }, [brandFilter, conditionFilter, priceFilter, products, searchTerm]);

  function openCreateModal() {
    setEditingProduct(null);
    setFormData(emptyForm);
    setActionError("");
    setIsModalOpen(true);
  }

  function openEditModal(product) {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      brand: getDisplayBrand(product),
      price: product.price ?? "",
      stock: product.stock ?? "",
      images: Array.isArray(product.images) ? product.images.join("\n") : "",
      description: product.description || "",
      specs: {
        screen: product.specs?.screen || "",
        chip: product.specs?.chip || "",
        ram: product.specs?.ram || "",
        storage: product.specs?.storage || "",
        battery: product.specs?.battery || "",
        camera: product.specs?.camera || ""
      }
    });
    setActionError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(emptyForm);
    setActionError("");
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleSpecChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      specs: {
        ...current.specs,
        [name]: value
      }
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setActionError("");

    try {
      const payload = {
        name: formData.name.trim(),
        brand: normalizeBrandForApi(formData.brand),
        price: Number(formData.price) || 0,
        stock: Number(formData.stock) || 0,
        images: formData.images
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        description: formData.description.trim(),
        specs: {
          screen: formData.specs.screen.trim(),
          chip: formData.specs.chip.trim(),
          ram: formData.specs.ram.trim(),
          storage: formData.specs.storage.trim(),
          battery: formData.specs.battery.trim(),
          camera: formData.specs.camera.trim()
        }
      };

      const url = editingProduct
        ? `http://localhost:5000/api/products/${editingProduct._id}`
        : "http://localhost:5000/api/products";

      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể lưu sản phẩm");
      }

      setProducts((current) => {
        if (editingProduct) {
          return current.map((product) =>
            product._id === editingProduct._id ? data : product
          );
        }

        return [data, ...current];
      });

      closeModal();
    } catch (submitError) {
      setActionError(submitError.message || "Không thể lưu sản phẩm");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(product) {
    const shouldDelete = window.confirm(`Xóa sản phẩm "${product.name}"?`);

    if (!shouldDelete) {
      return;
    }

    setActionError("");

    try {
      const response = await fetch(`http://localhost:5000/api/products/${product._id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể xóa sản phẩm");
      }

      setProducts((current) =>
        current.filter((item) => item._id !== product._id)
      );
    } catch (deleteError) {
      setActionError(deleteError.message || "Không thể xóa sản phẩm");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-slate-600">Đang tải danh sách sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            admin / <span className="font-semibold text-blue-700">Quản lý sản phẩm</span>
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Danh sách sản phẩm</h1>
          <p className="mt-2 text-sm text-slate-500">
            Quản lý kho hàng và thông tin chi tiết sản phẩm.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
        >
          + Thêm sản phẩm
        </button>
      </div>

      {actionError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {actionError}
        </div>
      )}

      <ProductFilterBar
        searchTerm={searchTerm}
        brandFilter={brandFilter}
        conditionFilter={conditionFilter}
        priceFilter={priceFilter}
        onSearchChange={setSearchTerm}
        onBrandChange={setBrandFilter}
        onConditionChange={setConditionFilter}
        onPriceChange={setPriceFilter}
      />

      <AdminProductTable
        products={filteredProducts}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      {isModalOpen && (
        <ProductFormModal
          formData={formData}
          editingProduct={editingProduct}
          submitting={submitting}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onFieldChange={handleFieldChange}
          onSpecChange={handleSpecChange}
        />
      )}
    </div>
  );
}

function ProductFilterBar({
  searchTerm,
  brandFilter,
  conditionFilter,
  priceFilter,
  onSearchChange,
  onBrandChange,
  onConditionChange,
  onPriceChange
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-4">
        <FilterField label="Tìm kiếm">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tên sản phẩm, mã SKU..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </FilterField>

        <FilterField label="Hãng">
          <select
            value={brandFilter}
            onChange={(event) => onBrandChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
          >
            {brandOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Tình trạng">
          <select
            value={conditionFilter}
            onChange={(event) => onConditionChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
          >
            {conditionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Khoảng giá">
          <select
            value={priceFilter}
            onChange={(event) => onPriceChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
          >
            {priceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </FilterField>
      </div>
    </section>
  );
}

function FilterField({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      {children}
    </div>
  );
}

function AdminProductTable({ products, onEdit, onDelete }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            <tr>
              <th className="px-5 py-4">Ảnh</th>
              <th className="px-5 py-4">Tên sản phẩm</th>
              <th className="px-5 py-4">Hãng</th>
              <th className="px-5 py-4">Giá</th>
              <th className="px-5 py-4">Tồn kho</th>
              <th className="px-5 py-4">Tình trạng</th>
              <th className="px-5 py-4">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-t border-slate-100">
                <td className="px-5 py-4">
                  <img
                    src={
                      product.images?.[0] ||
                      "https://via.placeholder.com/80x80?text=No+Image"
                    }
                    alt={product.name}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                </td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    SKU: {String(product._id).slice(-10).toUpperCase()}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {getDisplayBrand(product)}
                  </span>
                </td>
                <td className="px-5 py-4 font-bold text-blue-700">
                  {formatCurrency(product.price)}
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                  {product.stock ?? 0}
                </td>
                <td className="px-5 py-4">
                  <ConditionBadge product={product} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(product)}
                      className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="7" className="px-5 py-10 text-center text-sm text-slate-500">
                  Không có sản phẩm phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProductFormModal({
  formData,
  editingProduct,
  submitting,
  onClose,
  onSubmit,
  onFieldChange,
  onSpecChange
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between rounded-t-2xl bg-blue-700 px-6 py-4 text-white">
          <h2 className="text-xl font-black">
            {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl font-light leading-none"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label="Tên sản phẩm">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onFieldChange}
                placeholder="Nhập tên sản phẩm..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                required
              />
            </FormField>

            <FormField label="Hãng">
              <select
                name="brand"
                value={formData.brand}
                onChange={onFieldChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              >
                {brandOptions.slice(1).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Giá">
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={onFieldChange}
                placeholder="28990000"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                required
              />
            </FormField>

            <FormField label="Tồn kho">
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={onFieldChange}
                placeholder="10"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </FormField>
          </div>

          <FormField label="Hình ảnh sản phẩm">
            <textarea
              name="images"
              value={formData.images}
              onChange={onFieldChange}
              rows="4"
              placeholder="Mỗi dòng là một URL ảnh"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </FormField>

          <FormField label="Mô tả">
            <textarea
              name="description"
              value={formData.description}
              onChange={onFieldChange}
              rows="4"
              placeholder="Mô tả chi tiết sản phẩm"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </FormField>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
              Thông số kỹ thuật
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SpecField label="Màn hình" name="screen" value={formData.specs.screen} onChange={onSpecChange} />
              <SpecField label="Chip" name="chip" value={formData.specs.chip} onChange={onSpecChange} />
              <SpecField label="RAM" name="ram" value={formData.specs.ram} onChange={onSpecChange} />
              <SpecField label="Storage" name="storage" value={formData.specs.storage} onChange={onSpecChange} />
              <SpecField label="Battery" name="battery" value={formData.specs.battery} onChange={onSpecChange} />
              <SpecField label="Camera" name="camera" value={formData.specs.camera} onChange={onSpecChange} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {submitting ? "Đang lưu..." : editingProduct ? "Lưu thay đổi" : "Thêm sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">{label}</p>
      {children}
    </div>
  );
}

function SpecField({ label, name, value, onChange }) {
  return (
    <FormField label={label}>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
      />
    </FormField>
  );
}

function ConditionBadge({ product }) {
  const label = getConditionLabel(product);
  const className =
    label === "New"
      ? "bg-emerald-100 text-emerald-700"
      : label === "Cũ 99%"
        ? "bg-amber-100 text-amber-700"
        : "bg-blue-100 text-blue-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}

function getConditionLabel(product) {
  const text = `${product.name || ""} ${product.description || ""}`.toLowerCase();

  if (text.includes("99")) {
    return "Cũ 99%";
  }

  if (text.includes("cũ đẹp")) {
    return "Cũ đẹp";
  }

  return "New";
}

function getDisplayBrand(product) {
  const brand = (product.brand || "").toLowerCase();
  const name = (product.name || "").toLowerCase();

  if (brand.includes("apple") || brand.includes("iphone") || name.includes("iphone")) {
    return "Apple";
  }

  if (brand.includes("samsung") || name.includes("galaxy")) {
    return "Samsung";
  }

  if (brand.includes("xiaomi") || name.includes("redmi") || name.includes("poco")) {
    return "Xiaomi";
  }

  if (brand.includes("oppo")) {
    return "Oppo";
  }

  return product.brand || "Khác";
}

function normalizeBrandForApi(brand) {
  if (brand === "Apple") {
    return "Apple";
  }

  return brand;
}

function formatCurrency(value) {
  return `${(Number(value) || 0).toLocaleString("vi-VN")}đ`;
}

export default AdminProductsPage;
