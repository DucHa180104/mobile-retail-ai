import { useEffect, useState } from "react";
import {
  tradeInBrands,
  tradeInDevices,
  tradeInStorageOptions
} from "../data/tradeInDevices.js";
import { buildApiUrl } from "../lib/api.js";

const imageFields = [
  "Mặt trước",
  "Mặt sau",
  "Cạnh viền",
  "Pin/BH",
  "Linh kiện sửa"
];

function TradeInPage() {
  const [formData, setFormData] = useState({
    brand: "iPhone",
    model: tradeInDevices.iPhone[0],
    storage: "256GB",
    batteryHealth: "85",
    displayStatus: "original",
    bodyCondition: "clean",
    faceIdStatus: "working",
    accessoryStatus: "full"
  });
  const [uploadedImages, setUploadedImages] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const availableModels = tradeInDevices[formData.brand] || [];

  useEffect(() => {
    return () => {
      Object.values(uploadedImages).forEach((item) => {
        if (item?.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [uploadedImages]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => {
      const nextData = {
        ...current,
        [name]: value
      };

      if (name === "brand") {
        nextData.model = (tradeInDevices[value] || [])[0] || "";
      }

      return nextData;
    });
  }

  function handleImageChange(label, event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadedImages((current) => {
      const previousPreview = current[label]?.previewUrl;

      if (previousPreview) {
        URL.revokeObjectURL(previousPreview);
      }

      return {
        ...current,
        [label]: {
          file,
          previewUrl: URL.createObjectURL(file)
        }
      };
    });
  }

  async function handleEstimate() {
    setError("");

    if (!formData.model) {
      setError("Vui lòng chọn tên máy.");
      return;
    }

    if (!formData.storage) {
      setError("Vui lòng chọn dung lượng.");
      return;
    }

    if (!formData.batteryHealth.trim()) {
      setError("Vui lòng nhập tình trạng pin.");
      return;
    }

    const batteryHealthValue = Number(formData.batteryHealth);

    if (Number.isNaN(batteryHealthValue)) {
      setError("Tình trạng pin phải là số.");
      return;
    }

    if (batteryHealthValue < 0 || batteryHealthValue > 100) {
      setError("Tình trạng pin phải nằm trong khoảng từ 0 đến 100.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(buildApiUrl("/api/tradein/estimate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          modelName: formData.model,
          storage: formData.storage,
          batteryHealth: batteryHealthValue,
          displayStatus: formData.displayStatus,
          bodyCondition: formData.bodyCondition,
          faceIdStatus: formData.faceIdStatus === "none" ? "working" : formData.faceIdStatus,
          accessoryStatus: formData.accessoryStatus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể định giá thiết bị");
      }

      setResult(data);
    } catch (submitError) {
      setResult(null);
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-[#f7f8fc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1120px] space-y-5">
        <section className="overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#22489d_0%,#234792_100%)] px-5 py-9 text-white shadow-sm sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-[30px] font-black leading-none">Thu cũ đổi mới</h1>
            <p className="mt-3 text-sm text-blue-100">
              Định giá nhanh trong vài phút - Ưu đãi lên đời đổi mới thị trường
            </p>
          </div>

          <div className="mx-auto mt-5 max-w-[600px] rounded-2xl border border-white/10 bg-white/10 p-2 backdrop-blur">
            <div className="grid gap-2 md:grid-cols-3">
              <HeaderSelect
                label="Hãng máy"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                options={tradeInBrands}
              />
              <HeaderSelect
                label="Tên máy"
                name="model"
                value={formData.model}
                onChange={handleChange}
                options={availableModels}
              />
              <HeaderSelect
                label="Dung lượng"
                name="storage"
                value={formData.storage}
                onChange={handleChange}
                options={tradeInStorageOptions}
              />
            </div>
          </div>
        </section>

        <section className="-mt-4 rounded-[18px] border border-slate-200 bg-white p-3 shadow-md">
          <div className="grid gap-2 md:grid-cols-4">
            {[
              "Chọn dòng máy",
              "Nhập tình trạng",
              "Upload ảnh",
              "Nhận giá"
            ].map((step, index) => (
              <StepperItem key={step} number={index + 1} title={step} active={index === 0} />
            ))}
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.18fr_0.58fr]">
          <section className="space-y-4">
            <article className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader icon={<DeviceIcon />} title="Thông tin thiết bị" />

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FormSelect
                  label="Hãng máy"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  options={tradeInBrands}
                />
                <FormSelect
                  label="Tên máy"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  options={availableModels}
                />
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Dung lượng
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tradeInStorageOptions.map((storage) => (
                      <ChoicePill
                        key={storage}
                        active={formData.storage === storage}
                        onClick={() =>
                          setFormData((current) => ({ ...current, storage }))
                        }
                      >
                        {storage}
                      </ChoicePill>
                    ))}
                  </div>
                </div>
                <FormInput
                  label="Tình trạng pin (%)"
                  name="batteryHealth"
                  value={formData.batteryHealth}
                  onChange={handleChange}
                  placeholder="Ví dụ: 85"
                />
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Màn hình
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ChoiceBox
                    active={formData.displayStatus === "original"}
                    label="Màn hình zin, đẹp"
                    onClick={() =>
                      setFormData((current) => ({ ...current, displayStatus: "original" }))
                    }
                  />
                  <ChoiceBox
                    active={formData.displayStatus === "replaced"}
                    label="Màn hình đã thay/trầy xước"
                    onClick={() =>
                      setFormData((current) => ({ ...current, displayStatus: "replaced" }))
                    }
                  />
                  <ChoiceBox
                    active={formData.displayStatus === "unknown"}
                    label="Không rõ"
                    onClick={() =>
                      setFormData((current) => ({ ...current, displayStatus: "unknown" }))
                    }
                  />
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Ngoại hình
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <ScoreCard
                    active={formData.bodyCondition === "clean"}
                    title="99%"
                    note="Như mới"
                    onClick={() =>
                      setFormData((current) => ({ ...current, bodyCondition: "clean" }))
                    }
                  />
                  <ScoreCard
                    active={formData.bodyCondition === "light_scratches"}
                    title="95%"
                    note="Cấn nhẹ nhẹ"
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        bodyCondition: "light_scratches"
                      }))
                    }
                  />
                  <ScoreCard
                    active={formData.bodyCondition === "heavy_scratches"}
                    title="<90%"
                    note="Vỡ/trầy móp nặng"
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        bodyCondition: "heavy_scratches"
                      }))
                    }
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FormSelect
                  label="Face ID / Touch ID"
                  name="faceIdStatus"
                  value={formData.faceIdStatus}
                  onChange={handleChange}
                  options={[
                    { label: "Hoạt động bình thường", value: "working" },
                    { label: "Bị lỗi", value: "broken" },
                    { label: "Không có", value: "none" }
                  ]}
                />
                <FormSelect
                  label="Phụ kiện đi kèm"
                  name="accessoryStatus"
                  value={formData.accessoryStatus}
                  onChange={handleChange}
                  options={[
                    { label: "Fullbox chính hãng", value: "full" },
                    { label: "Thiếu hộp hoặc cáp", value: "missing_box_or_cable" }
                  ]}
                />
              </div>
            </article>

            <article className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader icon={<ImageIcon />} title="Hình ảnh thực tế" />

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {imageFields.map((label) => (
                  <ImageUploadCard
                    key={label}
                    label={label}
                    image={uploadedImages[label]}
                    onChange={(event) => handleImageChange(label, event)}
                  />
                ))}
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Ảnh càng rõ càng giúp cửa hàng định giá sát với tình trạng thực tế.
              </p>
            </article>
          </section>

          <aside className="space-y-4">
            <article className="rounded-[18px] bg-[linear-gradient(180deg,#22499a_0%,#1e4188_100%)] p-5 text-white shadow-sm xl:sticky xl:top-24">
              <h2 className="text-sm font-bold">Định giá dự kiến</h2>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-4">
                <div className="flex items-end justify-between gap-3">
                  <p className="text-[28px] font-black tracking-tight">
                    {result
                      ? result.estimatedPrice.toLocaleString("vi-VN")
                      : "--.--.--"}
                  </p>
                  <span className="text-xs font-semibold text-blue-100">VND</span>
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-xl bg-red-100 px-3 py-2 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleEstimate}
                disabled={submitting}
                className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Đang định giá..." : "Nhận định giá tạm tính"}
              </button>

              <p className="mt-3 text-[11px] leading-5 text-blue-100">
                Giá cuối cùng do cửa hàng xác nhận sau khi kiểm tra thực tế thiết bị.
              </p>
            </article>

            <article className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-3">
                <BenefitRow text="Tại sao chọn chúng tôi?" heading />
                <BenefitRow text="Định giá sát nhất với tình trạng thực tế" />
                <BenefitRow text="Thu mua tận nơi hoặc tại cửa hàng" />
                <BenefitRow text="Thủ tục đơn giản, thanh toán ngay" />
              </div>
            </article>

            {result && (
              <article className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-900">Kết quả định giá</h2>

                <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4">
                  <ResultRow
                    label="Giá gốc"
                    value={`${result.basePrice.toLocaleString("vi-VN")} đ`}
                  />
                  {result.deductions.map((item) => (
                    <ResultRow
                      key={item.reason}
                      label={item.reason}
                      value={`- ${item.amount.toLocaleString("vi-VN")} đ`}
                    />
                  ))}
                </div>

                <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                    Giá tạm tính cuối cùng
                  </p>
                  <p className="mt-2 text-2xl font-bold text-blue-700">
                    {result.estimatedPrice.toLocaleString("vi-VN")} đ
                  </p>
                </div>
              </article>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function HeaderSelect({ label, name, value, onChange, options }) {
  return (
    <label className="block rounded-xl border border-white/10 bg-white px-3 py-2 shadow-sm">
      <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function StepperItem({ number, title, active }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
        active
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-slate-50 text-slate-400"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
          active ? "bg-blue-600 text-white" : "bg-white text-slate-500"
        }`}
      >
        {number}
      </span>
      <span className="text-sm font-semibold">{title}</span>
    </div>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </span>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    </div>
  );
}

function FormSelect({ label, name, value, onChange, options }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
      >
        {options.map((option) => {
          const item = typeof option === "string" ? { label: option, value: option } : option;

          return (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function FormInput({ label, name, value, onChange, placeholder }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
      />
    </div>
  );
}

function ChoicePill({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-blue-500 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
      }`}
    >
      {children}
    </button>
  );
}

function ChoiceBox({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[50px] items-center rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
        active
          ? "border-blue-500 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
      }`}
    >
      <span
        className={`mr-3 inline-flex h-4 w-4 shrink-0 rounded-full border ${
          active ? "border-blue-600 bg-blue-600 shadow-[inset_0_0_0_3px_white]" : "border-slate-300"
        }`}
      />
      <span>{label}</span>
    </button>
  );
}

function ScoreCard({ title, note, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-3 text-center transition ${
        active
          ? "border-blue-500 bg-blue-50"
          : "border-slate-200 bg-white hover:border-blue-300"
      }`}
    >
      <p className={`text-lg font-bold ${active ? "text-blue-700" : "text-slate-900"}`}>{title}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </button>
  );
}

function ImageUploadCard({ label, image, onChange }) {
  return (
    <label className="block cursor-pointer">
      <input type="file" accept="image/*" className="hidden" onChange={onChange} />
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center transition hover:border-blue-300 hover:bg-blue-50">
        {image ? (
          <img
            src={image.previewUrl}
            alt={label}
            className="mx-auto h-16 w-full rounded-xl object-cover"
          />
        ) : (
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
            <UploadIcon />
          </span>
        )}
        <p className="mt-3 text-xs font-semibold text-slate-700">{label}</p>
      </div>
    </label>
  );
}

function BenefitRow({ text, heading = false }) {
  return (
    <div className={`flex items-start gap-3 ${heading ? "text-slate-900" : "text-slate-600"}`}>
      <span className={`mt-0.5 ${heading ? "text-blue-600" : "text-blue-600"}`}>
        <CheckIcon />
      </span>
      <span className={heading ? "text-sm font-bold" : "text-sm"}>{text}</span>
    </div>
  );
}

function ResultRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function DeviceIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path strokeLinecap="round" d="M10 5.5h4" />
      <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 15-4-4L5 20" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8 11 4-4 4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 16.5a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 16.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
    </svg>
  );
}

export default TradeInPage;
