import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { buildApiUrl } from "../lib/api";

const brandOptions = ["all", "Apple", "Samsung", "Xiaomi", "Oppo"];

const conditionFilterOptions = [
  { label: "Tất cả tình trạng", value: "all" },
  { label: "Máy mới", value: "new" },
  { label: "Cũ 99%", value: "used_99" },
  { label: "Cũ đẹp", value: "used_good" },
  { label: "Cũ dùng tốt", value: "used_fair" }
];

const priceOptions = [
  { label: "Tất cả giá", value: "all" },
  { label: "Dưới 10 triệu", value: "under_10m" },
  { label: "10 - 20 triệu", value: "10m_20m" },
  { label: "Trên 20 triệu", value: "over_20m" }
];

const stockOptions = [
  { label: "Tất cả tồn kho", value: "all" },
  { label: "Còn hàng", value: "in_stock" },
  { label: "Sắp hết", value: "low_stock" },
  { label: "Hết hàng", value: "out_of_stock" }
];

const formBrandOptions = ["Apple", "Samsung", "Xiaomi", "Oppo", "Khác"];

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
  images: [],
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

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [token]);

  async function fetchProducts() {
    try {
      setLoading(true);
      setError("");

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(buildApiUrl("/api/products?page=1&limit=1000"), {
        headers
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getAdminApiErrorMessage(data, "Không thể tải sản phẩm."));
      }

      const items = Array.isArray(data) ? data : data.products || [];
      setProducts(items);
    } catch (fetchError) {
      setError(fetchError.message || "Không thể tải sản phẩm.");
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const name = product.name?.toLowerCase() || "";
      const brand = product.brand?.toLowerCase() || "";
      const keyword = searchTerm.trim().toLowerCase();
      const price = Number(product.price) || 0;
      const stock = Number(product.stock) || 0;

      const matchesKeyword =
        keyword.length === 0 || name.includes(keyword) || brand.includes(keyword);
      const matchesBrand =
        brandFilter === "all" ||
        normalizeBrand(product.brand) === normalizeBrand(brandFilter);
      const matchesCondition =
        conditionFilter === "all" || product.condition === conditionFilter;
      const matchesPrice =
        priceFilter === "all" ||
        (priceFilter === "under_10m" && price < 10000000) ||
        (priceFilter === "10m_20m" && price >= 10000000 && price <= 20000000) ||
        (priceFilter === "over_20m" && price > 20000000);
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "out_of_stock" && stock === 0) ||
        (stockFilter === "low_stock" && stock > 0 && stock <= 5) ||
        (stockFilter === "in_stock" && stock > 5);

      return (
        matchesKeyword &&
        matchesBrand &&
        matchesCondition &&
        matchesPrice &&
        matchesStock
      );
    });
  }, [products, searchTerm, brandFilter, conditionFilter, priceFilter, stockFilter]);

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
      brand: product.brand || "Apple",
      condition: product.condition || "new",
      price: product.price ?? "",
      stock: product.stock ?? "",
      images: Array.isArray(product.images) ? product.images : [],
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
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(emptyForm);
    setActionError("");
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
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

  async function handleImageUpload(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    if (!token) {
      setActionError("Bạn cần đăng nhập admin để tải ảnh.");
      return;
    }

    try {
      setUploadingImage(true);
      setActionError("");
      const uploadedUrls = [];

      for (const file of files) {
        const payload = new FormData();
        payload.append("image", file);

        const response = await fetch(buildApiUrl("/api/uploads"), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: payload
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(getAdminApiErrorMessage(data, "Tải ảnh thất bại."));
        }

        if (data.imageUrl) {
          uploadedUrls.push(data.imageUrl);
        }
      }

      setFormData((current) => ({
        ...current,
        images: [...current.images, ...uploadedUrls]
      }));
    } catch (uploadError) {
      setActionError(uploadError.message || "Tải ảnh thất bại.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  function handleRemoveImage(imageIndex) {
    setFormData((current) => ({
      ...current,
      images: current.images.filter((_, index) => index !== imageIndex)
    }));
  }

  function validateForm() {
    if (!formData.name.trim()) {
      return "Tên sản phẩm là bắt buộc.";
    }

    if (!formData.brand.trim()) {
      return "Hãng là bắt buộc.";
    }

    if (Number(formData.price) <= 0) {
      return "Giá phải lớn hơn 0.";
    }

    if (Number(formData.stock) < 0) {
      return "Tồn kho không được âm.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setActionError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setActionError("");

      const payload = {
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        condition: formData.condition,
        price: Number(formData.price),
        stock: Number(formData.stock),
        images: formData.images,
        description: formData.description.trim(),
        usedDetails: formData.usedDetails,
        specs: formData.specs
      };

      const method = editingProduct ? "PUT" : "POST";
      const endpoint = editingProduct
        ? buildApiUrl(`/api/products/${editingProduct._id}`)
        : buildApiUrl("/api/products");

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getAdminApiErrorMessage(
            data,
            editingProduct ? "Cập nhật sản phẩm thất bại." : "Tạo sản phẩm thất bại."
          )
        );
      }

      if (editingProduct) {
        setProducts((current) =>
          current.map((product) => (product._id === data._id ? data : product))
        );
      } else {
        setProducts((current) => [data, ...current]);
      }

      closeModal();
    } catch (submitError) {
      setActionError(submitError.message || "Không thể lưu sản phẩm.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(productId) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa sản phẩm này không?");
    if (!confirmed) {
      return;
    }

    try {
      setActionError("");

      const response = await fetch(buildApiUrl(`/api/products/${productId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getAdminApiErrorMessage(data, "Xóa sản phẩm thất bại."));
      }

      setProducts((current) => current.filter((product) => product._id !== productId));
    } catch (deleteError) {
      setActionError(deleteError.message || "Xóa sản phẩm thất bại.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            Quản lý sản phẩm
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Kho sản phẩm của cửa hàng
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Theo dõi tồn kho, cập nhật thông tin máy cũ và quản lý ảnh sản phẩm tại
            một nơi.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + Thêm sản phẩm
        </button>
      </div>

      {actionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {actionError}
        </div>
      )}

      <ProductFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        brandFilter={brandFilter}
        onBrandChange={setBrandFilter}
        conditionFilter={conditionFilter}
        onConditionChange={setConditionFilter}
        priceFilter={priceFilter}
        onPriceChange={setPriceFilter}
        stockFilter={stockFilter}
        onStockChange={setStockFilter}
      />

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Đang tải danh sách sản phẩm...
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-10 text-center text-rose-600 shadow-sm">
          {error}
        </div>
      ) : (
        <AdminProductTable
          products={filteredProducts}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      )}

      {isModalOpen && (
        <ProductFormModal
          editingProduct={editingProduct}
          formData={formData}
          submitting={submitting}
          uploadingImage={uploadingImage}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onFieldChange={handleFieldChange}
          onUsedDetailChange={handleUsedDetailChange}
          onSpecChange={handleSpecChange}
          onImageUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
        />
      )}
    </div>
  );
}

function ProductFilterBar({
  searchTerm,
  onSearchChange,
  brandFilter,
  onBrandChange,
  conditionFilter,
  onConditionChange,
  priceFilter,
  onPriceChange,
  stockFilter,
  onStockChange
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-5">
        <label className="lg:col-span-2">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Tìm sản phẩm
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm theo tên hoặc hãng..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </label>

        <FilterField
          label="Hãng"
          value={brandFilter}
          onChange={onBrandChange}
          options={[
            { label: "Tất cả hãng", value: "all" },
            ...brandOptions
              .filter((brand) => brand !== "all")
              .map((brand) => ({ label: brand, value: brand }))
          ]}
        />

        <FilterField
          label="Tình trạng"
          value={conditionFilter}
          onChange={onConditionChange}
          options={conditionFilterOptions}
        />

        <FilterField
          label="Khoảng giá"
          value={priceFilter}
          onChange={onPriceChange}
          options={priceOptions}
        />

        <FilterField
          label="Tồn kho"
          value={stockFilter}
          onChange={onStockChange}
          options={stockOptions}
        />
      </div>
    </div>
  );
}

function FilterField({ label, value, onChange, options }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AdminProductTable({ products, onEdit, onDelete }) {
  if (products.length === 0) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
        Không có sản phẩm nào phù hợp với bộ lọc hiện tại.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              <th className="px-6 py-4">Ảnh</th>
              <th className="px-6 py-4">Tên sản phẩm</th>
              <th className="px-6 py-4">Hãng</th>
              <th className="px-6 py-4">Giá</th>
              <th className="px-6 py-4">Tồn kho</th>
              <th className="px-6 py-4">Trạng thái kho</th>
              <th className="px-6 py-4">Tình trạng</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product._id} className="align-top transition hover:bg-slate-50/80">
                <td className="px-6 py-5">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold uppercase text-slate-400">
                      No img
                    </div>
                  )}
                </td>
                <td className="px-6 py-5">
                  <p className="text-lg font-bold text-slate-900">{product.name}</p>
                  <p className="mt-1 text-sm text-slate-400">SKU: {product._id.slice(-8).toUpperCase()}</p>
                </td>
                <td className="px-6 py-5">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                    {product.brand}
                  </span>
                </td>
                <td className="px-6 py-5 text-lg font-extrabold text-blue-600">
                  {formatCurrency(product.price)}
                </td>
                <td className="px-6 py-5">
                  <span className="text-lg font-bold text-slate-800">
                    {Number(product.stock) || 0}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <StockBadge stock={product.stock} />
                </td>
                <td className="px-6 py-5">
                  <ConditionBadge condition={product.condition} />
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(product._id)}
                      className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductFormModal({
  editingProduct,
  formData,
  submitting,
  uploadingImage,
  onClose,
  onSubmit,
  onFieldChange,
  onUsedDetailChange,
  onSpecChange,
  onImageUpload,
  onRemoveImage
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 px-4 py-10">
      <div className="mx-auto max-w-5xl rounded-[32px] bg-white p-6 shadow-2xl md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600">
              {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">
              {editingProduct ? "Cập nhật thông tin máy" : "Tạo sản phẩm cho cửa hàng"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          >
            Đóng
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          <section className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
            <h3 className="text-lg font-black text-slate-900">Thông tin cơ bản</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Tên sản phẩm" required>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={onFieldChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </FormField>

              <FormField label="Hãng" required>
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={onFieldChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                >
                  {formBrandOptions.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Tình trạng máy">
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={onFieldChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                >
                  {formConditionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Giá bán (VNĐ)" required>
                <input
                  type="number"
                  min="0"
                  name="price"
                  value={formData.price}
                  onChange={onFieldChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </FormField>

              <FormField label="Tồn kho" required>
                <input
                  type="number"
                  min="0"
                  name="stock"
                  value={formData.stock}
                  onChange={onFieldChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </FormField>
            </div>

            <FormField label="Mô tả sản phẩm">
              <textarea
                rows="4"
                name="description"
                value={formData.description}
                onChange={onFieldChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                placeholder="Mô tả ngắn về máy, đối tượng phù hợp, lưu ý khi bán..."
              />
            </FormField>
          </section>

          <section className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Ảnh sản phẩm</h3>
                <p className="text-sm text-slate-500">
                  Có thể tải nhiều ảnh để chụp các góc khác nhau của máy.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                {uploadingImage ? "Đang tải ảnh..." : "Chọn ảnh từ máy"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  onChange={onImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {formData.images.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                Chưa có ảnh nào được tải lên.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {formData.images.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
                  >
                    <img
                      src={image}
                      alt={`Ảnh sản phẩm ${index + 1}`}
                      className="h-48 w-full object-cover"
                    />
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="truncate text-sm text-slate-500">
                        Ảnh {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveImage(index)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-500 transition hover:bg-rose-50"
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
            <h3 className="text-lg font-black text-slate-900">Thông số máy</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <SpecField label="Màn hình" name="screen" value={formData.specs.screen} onChange={onSpecChange} />
              <SpecField label="Chip" name="chip" value={formData.specs.chip} onChange={onSpecChange} />
              <SpecField label="RAM" name="ram" value={formData.specs.ram} onChange={onSpecChange} />
              <SpecField label="Dung lượng" name="storage" value={formData.specs.storage} onChange={onSpecChange} />
              <SpecField label="Pin" name="battery" value={formData.specs.battery} onChange={onSpecChange} />
              <SpecField label="Camera" name="camera" value={formData.specs.camera} onChange={onSpecChange} />
            </div>
          </section>

          <section className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
            <h3 className="text-lg font-black text-slate-900">Tình trạng thực tế của máy</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Màu sắc">
                <input
                  type="text"
                  name="color"
                  value={formData.usedDetails.color}
                  onChange={onUsedDetailChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </FormField>
              <FormField label="Pin còn (%)">
                <input
                  type="text"
                  name="batteryHealth"
                  value={formData.usedDetails.batteryHealth}
                  onChange={onUsedDetailChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </FormField>
              <FormField label="Bảo hành">
                <input
                  type="text"
                  name="warranty"
                  value={formData.usedDetails.warranty}
                  onChange={onUsedDetailChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </FormField>
              <FormField label="Màn hình">
                <input
                  type="text"
                  name="screenStatus"
                  value={formData.usedDetails.screenStatus}
                  onChange={onUsedDetailChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </FormField>
              <FormField label="Ngoại hình">
                <input
                  type="text"
                  name="bodyStatus"
                  value={formData.usedDetails.bodyStatus}
                  onChange={onUsedDetailChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </FormField>
              <FormField label="Face ID / Touch ID">
                <input
                  type="text"
                  name="faceIdStatus"
                  value={formData.usedDetails.faceIdStatus}
                  onChange={onUsedDetailChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </FormField>
              <FormField label="Phụ kiện">
                <input
                  type="text"
                  name="accessories"
                  value={formData.usedDetails.accessories}
                  onChange={onUsedDetailChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </FormField>
              <FormField label="Lịch sử sửa chữa">
                <input
                  type="text"
                  name="repairHistory"
                  value={formData.usedDetails.repairHistory}
                  onChange={onUsedDetailChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </FormField>
            </div>

            <FormField label="Ghi chú thêm">
              <textarea
                rows="3"
                name="note"
                value={formData.usedDetails.note}
                onChange={onUsedDetailChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                placeholder="Ví dụ: có trầy nhẹ cạnh viền, pin zin, đã thay kính..."
              />
            </FormField>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {submitting
                ? "Đang lưu..."
                : editingProduct
                  ? "Lưu thay đổi"
                  : "Tạo sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, required = false, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
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
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
      />
    </FormField>
  );
}

function ConditionBadge({ condition }) {
  const label = getConditionLabel(condition);
  const classes =
    condition === "new"
      ? "bg-emerald-100 text-emerald-700"
      : condition === "used_99"
        ? "bg-amber-100 text-amber-700"
        : condition === "used_good"
          ? "bg-blue-100 text-blue-700"
          : "bg-slate-200 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${classes}`}>
      {label}
    </span>
  );
}

function StockBadge({ stock }) {
  const meta = getStockStatusMeta(stock);

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function getConditionLabel(condition) {
  switch (condition) {
    case "new":
      return "Máy mới";
    case "used_99":
      return "Cũ 99%";
    case "used_good":
      return "Cũ đẹp";
    case "used_fair":
      return "Cũ dùng tốt";
    default:
      return "Chưa rõ";
  }
}

function getStockStatusMeta(stockValue) {
  const stock = Number(stockValue) || 0;

  if (stock === 0) {
    return {
      label: "Hết hàng",
      className: "bg-rose-100 text-rose-700"
    };
  }

  if (stock <= 5) {
    return {
      label: "Sắp hết",
      className: "bg-amber-100 text-amber-700"
    };
  }

  return {
    label: "Còn hàng",
    className: "bg-emerald-100 text-emerald-700"
  };
}

function normalizeBrand(brand) {
  return (brand || "").trim().toLowerCase();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function getAdminApiErrorMessage(data, fallbackMessage) {
  if (data?.message && typeof data.message === "string") {
    return data.message;
  }

  if (data?.error && typeof data.error === "string") {
    return data.error;
  }

  return fallbackMessage;
}
