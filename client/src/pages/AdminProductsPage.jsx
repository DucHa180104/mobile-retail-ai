import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const brandOptions = ["all", "Apple", "Samsung", "Xiaomi", "Oppo"];
const conditionFilterOptions = [
  { label: "Tất cả", value: "all" },
  { label: "Máy mới", value: "new" },
  { label: "Cũ 99%", value: "used_99" },
  { label: "Cũ đẹp", value: "used_good" },
  { label: "Cũ dùng tốt", value: "used_fair" }
];
const priceOptions = [
  { label: "Mọi giá", value: "all" },
  { label: "Dưới 10 triệu", value: "under_10m" },
  { label: "10 - 20 triệu", value: "10m_20m" },
  { label: "Trên 20 triệu", value: "over_20m" }
];
const formBrandOptions = ["Apple", "Samsung", "Xiaomi", "Oppo"];
const formConditionOptions = [
  { label: "Máy mới", value: "new" },
  { label: "Cũ 99%", value: "used_99" },
  { label: "Cũ đẹp", value: "used_good" },
  { label: "Cũ dùng tốt", value: "used_fair" }
];

const emptyForm = {
  name: "",
  brand: "Apple",
  condition: "used_good",
  price: "",
  stock: "",
  images: "",
  description: "",
  usedDetails: {
    color: "",
    batteryHealth: "",
    warranty: "",
    screenStatus: "",
    bodyStatus: "",
    faceIdStatus: "",
    accessories: "",
    repairHistory: "",
    note: ""
  },
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
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [token]);

  async function fetchProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/api/products", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

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
      const productName = product.name?.toLowerCase() || "";
      const productBrand = normalizeBrand(product.brand).toLowerCase();
      const productCondition = product.condition || "new";
      const productPrice = Number(product.price) || 0;

      const matchesSearch =
        !query || productName.includes(query) || productBrand.includes(query);
      const matchesBrand =
        brandFilter === "all" || normalizeBrand(product.brand) === brandFilter;
      const matchesCondition =
        conditionFilter === "all" || productCondition === conditionFilter;
      const matchesPrice =
        priceFilter === "all" ||
        (priceFilter === "under_10m" && productPrice < 10000000) ||
        (priceFilter === "10m_20m" &&
          productPrice >= 10000000 &&
          productPrice <= 20000000) ||
        (priceFilter === "over_20m" && productPrice > 20000000);

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
      brand: normalizeBrand(product.brand),
      condition: product.condition || "used_good",
      price: product.price ?? "",
      stock: product.stock ?? "",
      images: Array.isArray(product.images) ? product.images.join("\n") : "",
      description: product.description || "",
      usedDetails: {
        color: product.usedDetails?.color || "",
        batteryHealth: product.usedDetails?.batteryHealth || "",
        warranty: product.usedDetails?.warranty || "",
        screenStatus: product.usedDetails?.screenStatus || "",
        bodyStatus: product.usedDetails?.bodyStatus || "",
        faceIdStatus: product.usedDetails?.faceIdStatus || "",
        accessories: product.usedDetails?.accessories || "",
        repairHistory: product.usedDetails?.repairHistory || "",
        note: product.usedDetails?.note || ""
      },
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
    setEditingProduct(null);
    setFormData(emptyForm);
    setActionError("");
    setIsModalOpen(false);
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

  function handleUsedDetailChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      usedDetails: {
        ...current.usedDetails,
        [name]: value
      }
    }));
  }

  function validateForm() {
    if (!formData.name.trim()) {
      return "Tên sản phẩm là bắt buộc";
    }

    if (!formData.brand.trim()) {
      return "Hãng là bắt buộc";
    }

    if (Number(formData.price) <= 0) {
      return "Giá sản phẩm phải lớn hơn 0";
    }

    if (Number(formData.stock) < 0) {
      return "Tồn kho không được nhỏ hơn 0";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setActionError("");

    const validationError = validateForm();
    if (validationError) {
      setActionError(validationError);
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        condition: formData.condition,
        price: Number(formData.price),
        stock: Number(formData.stock),
        images: formData.images
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        description: formData.description.trim(),
        usedDetails: {
          color: formData.usedDetails.color.trim(),
          batteryHealth: formData.usedDetails.batteryHealth.trim(),
          warranty: formData.usedDetails.warranty.trim(),
          screenStatus: formData.usedDetails.screenStatus.trim(),
          bodyStatus: formData.usedDetails.bodyStatus.trim(),
          faceIdStatus: formData.usedDetails.faceIdStatus.trim(),
          accessories: formData.usedDetails.accessories.trim(),
          repairHistory: formData.usedDetails.repairHistory.trim(),
          note: formData.usedDetails.note.trim()
        },
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
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getAdminApiErrorMessage(response.status, data.message || "Không thể lưu sản phẩm")
        );
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
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getAdminApiErrorMessage(response.status, data.message || "Không thể xóa sản phẩm")
        );
      }

      setProducts((current) => current.filter((item) => item._id !== product._id));
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
          onUsedDetailChange={handleUsedDetailChange}
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
            placeholder="Tên sản phẩm, hãng..."
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
                {option === "all" ? "Tất cả" : option}
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
            {conditionFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
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
              <option key={option.value} value={option.value}>
                {option.label}
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
                    src={product.images?.[0] || "https://via.placeholder.com/80x80?text=No+Image"}
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
                    {normalizeBrand(product.brand)}
                  </span>
                </td>
                <td className="px-5 py-4 font-bold text-blue-700">
                  {formatCurrency(product.price)}
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                  {product.stock ?? 0}
                </td>
                <td className="px-5 py-4">
                  <ConditionBadge condition={product.condition} />
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
  onSpecChange,
  onUsedDetailChange
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
                required
              >
                {formBrandOptions.map((option) => (
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
                min="1"
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
                min="0"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                required
              />
            </FormField>

            <FormField label="Tình trạng">
              <select
                name="condition"
                value={formData.condition}
                onChange={onFieldChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              >
                {formConditionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
              Thông tin máy cũ
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SpecField label="Màu sắc" name="color" value={formData.usedDetails.color} onChange={onUsedDetailChange} />
              <SpecField label="Pin còn" name="batteryHealth" value={formData.usedDetails.batteryHealth} onChange={onUsedDetailChange} />
              <SpecField label="Bảo hành" name="warranty" value={formData.usedDetails.warranty} onChange={onUsedDetailChange} />
              <SpecField label="Tình trạng màn hình" name="screenStatus" value={formData.usedDetails.screenStatus} onChange={onUsedDetailChange} />
              <SpecField label="Ngoại hình" name="bodyStatus" value={formData.usedDetails.bodyStatus} onChange={onUsedDetailChange} />
              <SpecField label="Face ID / Touch ID" name="faceIdStatus" value={formData.usedDetails.faceIdStatus} onChange={onUsedDetailChange} />
              <SpecField label="Phụ kiện" name="accessories" value={formData.usedDetails.accessories} onChange={onUsedDetailChange} />
              <SpecField label="Lịch sử sửa chữa" name="repairHistory" value={formData.usedDetails.repairHistory} onChange={onUsedDetailChange} />
              <SpecField label="Ghi chú thêm" name="note" value={formData.usedDetails.note} onChange={onUsedDetailChange} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
              Thông số kỹ thuật
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SpecField label="Màn hình" name="screen" value={formData.specs.screen} onChange={onSpecChange} />
              <SpecField label="Chip" name="chip" value={formData.specs.chip} onChange={onSpecChange} />
              <SpecField label="RAM" name="ram" value={formData.specs.ram} onChange={onSpecChange} />
              <SpecField label="Bộ nhớ" name="storage" value={formData.specs.storage} onChange={onSpecChange} />
              <SpecField label="Pin" name="battery" value={formData.specs.battery} onChange={onSpecChange} />
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

function ConditionBadge({ condition }) {
  const label = getConditionLabel(condition);
  const className =
    condition === "new"
      ? "bg-emerald-100 text-emerald-700"
      : condition === "used_99"
        ? "bg-amber-100 text-amber-700"
        : condition === "used_good"
          ? "bg-blue-100 text-blue-700"
          : "bg-slate-200 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}

function getConditionLabel(condition) {
  if (condition === "used_99") {
    return "Cũ 99%";
  }

  if (condition === "used_good") {
    return "Cũ đẹp";
  }

  if (condition === "used_fair") {
    return "Cũ dùng tốt";
  }

  return "Máy mới";
}

function normalizeBrand(brand) {
  if (!brand) {
    return "Apple";
  }

  if (brand.toLowerCase() === "iphone") {
    return "Apple";
  }

  return brand;
}

function formatCurrency(value) {
  return `${(Number(value) || 0).toLocaleString("vi-VN")}đ`;
}

function getAdminApiErrorMessage(status, fallbackMessage) {
  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn hoặc thiếu token admin";
  }

  if (status === 403) {
    return "Bạn không có quyền admin để thực hiện thao tác này";
  }

  return fallbackMessage;
}

export default AdminProductsPage;
