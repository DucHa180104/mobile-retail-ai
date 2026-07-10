import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

const emptyForm = {
  brand: "Apple",
  modelName: "",
  storage: "",
  basePrice: "",
  isActive: true,
  note: "",
  deductionRules: {
    battery80To85: "",
    batteryBelow80: "",
    displayReplaced: "",
    displayUnknown: "",
    bodyLightScratches: "",
    bodyHeavyScratches: "",
    faceIdBroken: "",
    missingBoxOrCable: ""
  }
};

function AdminTradeInPricingPage() {
  const { token } = useAuth();
  const [pricingRules, setPricingRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPricingRules();
  }, [token]);

  async function fetchPricingRules() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(buildApiUrl("/api/admin/tradein/pricing"), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải bảng giá thu cũ.");
      }

      setPricingRules(data.pricingRules || []);
    } catch (fetchError) {
      setError(fetchError.message || "Không thể tải bảng giá thu cũ.");
    } finally {
      setLoading(false);
    }
  }

  const filteredRules = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return pricingRules;
    }

    return pricingRules.filter((rule) => {
      const brand = rule.brand?.toLowerCase() || "";
      const modelName = rule.modelName?.toLowerCase() || "";
      const storage = rule.storage?.toLowerCase() || "";

      return (
        brand.includes(keyword) ||
        modelName.includes(keyword) ||
        storage.includes(keyword)
      );
    });
  }, [pricingRules, searchTerm]);

  function openCreateModal() {
    setEditingRule(null);
    setFormData(emptyForm);
    setActionError("");
    setIsModalOpen(true);
  }

  function openEditModal(rule) {
    setEditingRule(rule);
    setFormData({
      brand: rule.brand || "Apple",
      modelName: rule.modelName || "",
      storage: rule.storage || "",
      basePrice: rule.basePrice ?? "",
      isActive: rule.isActive ?? true,
      note: rule.note || "",
      deductionRules: {
        battery80To85: rule.deductionRules?.battery80To85 ?? "",
        batteryBelow80: rule.deductionRules?.batteryBelow80 ?? "",
        displayReplaced: rule.deductionRules?.displayReplaced ?? "",
        displayUnknown: rule.deductionRules?.displayUnknown ?? "",
        bodyLightScratches: rule.deductionRules?.bodyLightScratches ?? "",
        bodyHeavyScratches: rule.deductionRules?.bodyHeavyScratches ?? "",
        faceIdBroken: rule.deductionRules?.faceIdBroken ?? "",
        missingBoxOrCable: rule.deductionRules?.missingBoxOrCable ?? ""
      }
    });
    setActionError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingRule(null);
    setFormData(emptyForm);
    setActionError("");
  }

  function handleFieldChange(event) {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function handleDeductionChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      deductionRules: {
        ...current.deductionRules,
        [name]: value
      }
    }));
  }

  function validateForm() {
    if (!formData.brand.trim()) {
      return "Hãng là bắt buộc.";
    }

    if (!formData.modelName.trim()) {
      return "Tên dòng máy là bắt buộc.";
    }

    if (!formData.storage.trim()) {
      return "Dung lượng là bắt buộc.";
    }

    if (Number(formData.basePrice) < 0 || Number.isNaN(Number(formData.basePrice))) {
      return "Giá gốc phải là số lớn hơn hoặc bằng 0.";
    }

    const invalidDeduction = Object.values(formData.deductionRules).some((value) => {
      if (value === "") {
        return false;
      }

      return Number(value) < 0 || Number.isNaN(Number(value));
    });

    if (invalidDeduction) {
      return "Các mức trừ hao phải là số lớn hơn hoặc bằng 0.";
    }

    return "";
  }

  function buildPayload() {
    return {
      brand: formData.brand.trim(),
      modelName: formData.modelName.trim(),
      storage: formData.storage.trim(),
      basePrice: Number(formData.basePrice || 0),
      isActive: formData.isActive,
      note: formData.note.trim(),
      deductionRules: {
        battery80To85: Number(formData.deductionRules.battery80To85 || 0),
        batteryBelow80: Number(formData.deductionRules.batteryBelow80 || 0),
        displayReplaced: Number(formData.deductionRules.displayReplaced || 0),
        displayUnknown: Number(formData.deductionRules.displayUnknown || 0),
        bodyLightScratches: Number(formData.deductionRules.bodyLightScratches || 0),
        bodyHeavyScratches: Number(formData.deductionRules.bodyHeavyScratches || 0),
        faceIdBroken: Number(formData.deductionRules.faceIdBroken || 0),
        missingBoxOrCable: Number(formData.deductionRules.missingBoxOrCable || 0)
      }
    };
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

      const method = editingRule ? "PUT" : "POST";
      const endpoint = editingRule
        ? buildApiUrl(`/api/admin/tradein/pricing/${editingRule.id}`)
        : buildApiUrl("/api/admin/tradein/pricing");

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(buildPayload())
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể lưu bảng giá thu cũ.");
      }

      if (editingRule) {
        setPricingRules((current) =>
          current.map((rule) => (rule.id === data.pricingRule.id ? data.pricingRule : rule))
        );
      } else {
        setPricingRules((current) => [data.pricingRule, ...current]);
      }

      closeModal();
    } catch (submitError) {
      setActionError(submitError.message || "Không thể lưu bảng giá thu cũ.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(ruleId) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa rule giá thu cũ này không?");
    if (!confirmed) {
      return;
    }

    try {
      setActionError("");

      const response = await fetch(buildApiUrl(`/api/admin/tradein/pricing/${ruleId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể xóa rule giá thu cũ.");
      }

      setPricingRules((current) => current.filter((rule) => rule.id !== ruleId));
    } catch (deleteError) {
      setActionError(deleteError.message || "Không thể xóa rule giá thu cũ.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            Quản lý thu cũ
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Bảng giá thu cũ đổi mới
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Admin có thể đặt giá gốc cho từng dòng máy và điều chỉnh mức trừ hao theo
            từng lỗi thực tế của thiết bị.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + Thêm rule giá
        </button>
      </div>

      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {actionError}
        </div>
      ) : null}

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Tìm rule giá
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo hãng, model hoặc dung lượng..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </label>
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Đang tải bảng giá thu cũ...
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-10 text-center text-rose-600 shadow-sm">
          {error}
        </div>
      ) : (
        <PricingRuleTable
          pricingRules={filteredRules}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      )}

      {isModalOpen ? (
        <PricingRuleModal
          editingRule={editingRule}
          formData={formData}
          submitting={submitting}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onFieldChange={handleFieldChange}
          onDeductionChange={handleDeductionChange}
        />
      ) : null}
    </div>
  );
}

function PricingRuleTable({ pricingRules, onEdit, onDelete }) {
  if (pricingRules.length === 0) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
        Chưa có rule giá thu cũ nào phù hợp với bộ lọc hiện tại.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              <th className="px-6 py-4">Dòng máy</th>
              <th className="px-6 py-4">Dung lượng</th>
              <th className="px-6 py-4">Giá gốc</th>
              <th className="px-6 py-4">Pin 80-85%</th>
              <th className="px-6 py-4">Pin dưới 80%</th>
              <th className="px-6 py-4">Face ID hỏng</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pricingRules.map((rule) => (
              <tr key={rule.id} className="align-top transition hover:bg-slate-50/80">
                <td className="px-6 py-5">
                  <p className="text-lg font-bold text-slate-900">{rule.modelName}</p>
                  <p className="mt-1 text-sm text-slate-400">{rule.brand}</p>
                </td>
                <td className="px-6 py-5 text-sm font-semibold text-slate-700">{rule.storage}</td>
                <td className="px-6 py-5 text-lg font-extrabold text-blue-600">
                  {formatCurrency(rule.basePrice)}
                </td>
                <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                  {formatCurrency(rule.deductionRules?.battery80To85 || 0)}
                </td>
                <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                  {formatCurrency(rule.deductionRules?.batteryBelow80 || 0)}
                </td>
                <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                  {formatCurrency(rule.deductionRules?.faceIdBroken || 0)}
                </td>
                <td className="px-6 py-5">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                      rule.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {rule.isActive ? "Đang áp dụng" : "Tạm ẩn"}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(rule)}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(rule.id)}
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

function PricingRuleModal({
  editingRule,
  formData,
  submitting,
  onClose,
  onSubmit,
  onFieldChange,
  onDeductionChange
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 px-4 py-10">
      <div className="mx-auto max-w-5xl rounded-[32px] bg-white p-6 shadow-2xl md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600">
              {editingRule ? "Chỉnh sửa rule giá" : "Thêm rule giá mới"}
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">
              {editingRule ? "Cập nhật giá thu cũ" : "Tạo bảng giá thu cũ"}
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
            <h3 className="text-lg font-black text-slate-900">Thông tin dòng máy</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Hãng" required>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={onFieldChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </FormField>

              <FormField label="Tên dòng máy" required>
                <input
                  type="text"
                  name="modelName"
                  value={formData.modelName}
                  onChange={onFieldChange}
                  placeholder="Ví dụ: iPhone 13"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </FormField>

              <FormField label="Dung lượng" required>
                <input
                  type="text"
                  name="storage"
                  value={formData.storage}
                  onChange={onFieldChange}
                  placeholder="Ví dụ: 128GB"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </FormField>

              <FormField label="Giá gốc (VNĐ)" required>
                <input
                  type="number"
                  min="0"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={onFieldChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </FormField>
            </div>

            <FormField label="Ghi chú">
              <textarea
                rows="3"
                name="note"
                value={formData.note}
                onChange={onFieldChange}
                placeholder="Ghi chú nội bộ cho admin..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
              />
            </FormField>

            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={onFieldChange}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-slate-700">Đang áp dụng rule này</span>
            </label>
          </section>

          <section className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
            <h3 className="text-lg font-black text-slate-900">Mức trừ hao</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <DeductionField label="Pin từ 80% đến 85%" name="battery80To85" value={formData.deductionRules.battery80To85} onChange={onDeductionChange} />
              <DeductionField label="Pin dưới 80%" name="batteryBelow80" value={formData.deductionRules.batteryBelow80} onChange={onDeductionChange} />
              <DeductionField label="Màn hình đã thay" name="displayReplaced" value={formData.deductionRules.displayReplaced} onChange={onDeductionChange} />
              <DeductionField label="Không rõ tình trạng màn hình" name="displayUnknown" value={formData.deductionRules.displayUnknown} onChange={onDeductionChange} />
              <DeductionField label="Thân máy xước nhẹ" name="bodyLightScratches" value={formData.deductionRules.bodyLightScratches} onChange={onDeductionChange} />
              <DeductionField label="Thân máy xước nặng" name="bodyHeavyScratches" value={formData.deductionRules.bodyHeavyScratches} onChange={onDeductionChange} />
              <DeductionField label="Face ID hỏng" name="faceIdBroken" value={formData.deductionRules.faceIdBroken} onChange={onDeductionChange} />
              <DeductionField label="Thiếu hộp hoặc cáp sạc" name="missingBoxOrCable" value={formData.deductionRules.missingBoxOrCable} onChange={onDeductionChange} />
            </div>
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
              disabled={submitting}
              className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {submitting ? "Đang lưu..." : editingRule ? "Lưu thay đổi" : "Tạo rule giá"}
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
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function DeductionField({ label, name, value, onChange }) {
  return (
    <FormField label={label}>
      <input
        type="number"
        min="0"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
      />
    </FormField>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

export default AdminTradeInPricingPage;
