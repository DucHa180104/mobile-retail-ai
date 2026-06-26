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

const brandDisplayData = {
  iPhone: { logo: "🍎", bg: "from-indigo-600 to-slate-900", label: "Apple iPhone" },
  Samsung: { logo: "🪐", bg: "from-blue-600 to-cyan-900", label: "Samsung Galaxy" },
  Xiaomi: { logo: "🍊", bg: "from-orange-500 to-amber-800", label: "Xiaomi Note/Pro" },
  Oppo: { logo: "🟢", bg: "from-emerald-500 to-teal-800", label: "Oppo Reno/Series" }
};

function TradeInPage() {
  const [currentStep, setCurrentStep] = useState(1);
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

  // When step becomes 4, automatically calculate price
  useEffect(() => {
    if (currentStep === 4) {
      handleEstimate();
    }
  }, [currentStep]);

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

  function removeImage(label, event) {
    event.preventDefault();
    setUploadedImages((current) => {
      const target = current[label];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const next = { ...current };
      delete next[label];
      return next;
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

    if (!formData.batteryHealth.toString().trim()) {
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

  function handleNextStep() {
    setError("");
    if (currentStep === 1) {
      if (!formData.model) {
        setError("Vui lòng chọn tên dòng máy trước khi tiếp tục.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const batteryHealthValue = Number(formData.batteryHealth);
      if (Number.isNaN(batteryHealthValue) || batteryHealthValue < 50 || batteryHealthValue > 100) {
        setError("Tình trạng pin phải trong khoảng từ 50% đến 100%.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  }

  function handlePrevStep() {
    setError("");
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/50 pb-16 pt-6">
      <div className="mx-auto max-w-[1120px] px-4 space-y-6">
        
        {/* Modern Header Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-12 text-white shadow-xl shadow-indigo-950/10 border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.15),transparent_50%)]" />
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
          
          <div className="relative mx-auto max-w-3xl text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-300 border border-indigo-500/30">
              ⚡ Định giá trong 30 giây
            </span>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Thu Cũ Đổi Mới Lên Đời
            </h1>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-300">
              Định giá tự động cực kỳ chính xác dựa trên tình trạng thực tế của máy. Nhận ngay trợ giá lên tới <span className="text-emerald-400 font-bold">1,000,000đ</span> khi đổi cũ lấy mới.
            </p>
          </div>
        </section>

        {/* Stepper Wizard Indicator */}
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { id: 1, label: "Chọn Dòng Máy" },
              { id: 2, label: "Nhập Tình Trạng" },
              { id: 3, label: "Tải Ảnh Thực Tế" },
              { id: 4, label: "Nhận Kết Quả" }
            ].map((step) => (
              <StepperItem
                key={step.id}
                number={step.id}
                title={step.label}
                active={currentStep === step.id}
                completed={currentStep > step.id}
              />
            ))}
          </div>
        </section>

        {/* Main Content Area */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.6fr]">
          <div className="space-y-6">
            
            {/* Step 1: Chọn dòng máy */}
            {currentStep === 1 && (
              <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6 animate-fade-in">
                <SectionHeader icon={<DeviceIcon />} title="1. Thông tin dòng máy cần định giá" />
                
                {/* Brand Grid Selection */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Hãng điện thoại</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {tradeInBrands.map((brandName) => {
                      const details = brandDisplayData[brandName] || { logo: "📱", bg: "from-slate-600 to-slate-900", label: brandName };
                      const isSelected = formData.brand === brandName;
                      return (
                        <button
                          key={brandName}
                          type="button"
                          onClick={() => {
                            handleChange({ target: { name: "brand", value: brandName } });
                          }}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-300 ${
                            isSelected
                              ? `border-transparent bg-gradient-to-br ${details.bg} text-white shadow-lg`
                              : "border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-800"
                          }`}
                        >
                          <span className="text-2xl mb-1.5">{details.logo}</span>
                          <span className="text-sm font-bold">{brandName}</span>
                          <span className={`text-[10px] ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>{details.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Model Selection */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tên điện thoại cụ thể</label>
                    <select
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 font-medium outline-none transition focus:border-indigo-500 focus:bg-white"
                    >
                      {availableModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Storage pills */}
                  <div>
                    <p className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Dung lượng máy</p>
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
                </div>
              </article>
            )}

            {/* Step 2: Nhập tình trạng */}
            {currentStep === 2 && (
              <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6 animate-fade-in">
                <SectionHeader icon={<CheckIcon />} title="2. Tình trạng chi tiết của máy" />
                
                {/* Battery health custom slider */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Tình trạng pin (%)</p>
                      <p className="text-xs text-slate-400">Hiệu năng sạc tối đa hiện tại</p>
                    </div>
                    <span className="text-xl font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
                      {formData.batteryHealth}%
                    </span>
                  </div>
                  <input
                    type="range"
                    name="batteryHealth"
                    min="50"
                    max="100"
                    value={formData.batteryHealth}
                    onChange={handleChange}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1">
                    <span>Cần thay thế (50%)</span>
                    <span>Tốt (80%)</span>
                    <span>Hoàn hảo (100%)</span>
                  </div>
                </div>

                {/* Display Status */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Màn hình hiển thị</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { value: "original", label: "Màn hình zin, đẹp", desc: "Không trầy xước, hiển thị sắc nét" },
                      { value: "replaced", label: "Đã thay/trầy xước", desc: "Có trầy xước nhẹ hoặc đã ép kính/thay màn" },
                      { value: "unknown", label: "Không xác định", desc: "Bị lỗi ám màn, ố vàng, đốm đen hoặc liệt cảm ứng" }
                    ].map((opt) => (
                      <ChoiceBox
                        key={opt.value}
                        active={formData.displayStatus === opt.value}
                        label={opt.label}
                        description={opt.desc}
                        onClick={() =>
                          setFormData((current) => ({ ...current, displayStatus: opt.value }))
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Body condition (ScoreCard style) */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Ngoại hình máy</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <ScoreCard
                      active={formData.bodyCondition === "clean"}
                      title="99% - Như mới"
                      note="Không trầy xước, cấn móp, khung sườn nguyên bản"
                      onClick={() =>
                        setFormData((current) => ({ ...current, bodyCondition: "clean" }))
                      }
                    />
                    <ScoreCard
                      active={formData.bodyCondition === "light_scratches"}
                      title="95% - Trầy xước nhẹ"
                      note="Có xước dăm nhẹ, cấn nhẹ ở góc máy khó thấy"
                      onClick={() =>
                        setFormData((current) => ({ ...current, bodyCondition: "light_scratches" }))
                      }
                    />
                    <ScoreCard
                      active={formData.bodyCondition === "heavy_scratches"}
                      title="<90% - Vỡ móp nặng"
                      note="Có vết nứt vỏ, móp méo sâu, trầy xước diện rộng"
                      onClick={() =>
                        setFormData((current) => ({ ...current, bodyCondition: "heavy_scratches" }))
                      }
                    />
                  </div>
                </div>

                {/* FaceID & Accessories */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormSelect
                    label="Tính năng bảo mật (Face ID / Vân tay)"
                    name="faceIdStatus"
                    value={formData.faceIdStatus}
                    onChange={handleChange}
                    options={[
                      { label: "Hoạt động hoàn hảo", value: "working" },
                      { label: "Bị lỗi / không sử dụng được", value: "broken" },
                      { label: "Không có sẵn trên dòng máy này", value: "none" }
                    ]}
                  />
                  <FormSelect
                    label="Phụ kiện kèm theo máy"
                    name="accessoryStatus"
                    value={formData.accessoryStatus}
                    onChange={handleChange}
                    options={[
                      { label: "Đầy đủ hộp & cáp sạc zin", value: "full" },
                      { label: "Thiếu hộp / Chỉ có cáp hoặc máy trần", value: "missing_box_or_cable" }
                    ]}
                  />
                </div>
              </article>
            )}

            {/* Step 3: Tải ảnh thực tế */}
            {currentStep === 3 && (
              <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6 animate-fade-in">
                <SectionHeader icon={<ImageIcon />} title="3. Hình ảnh chụp thực tế từ máy" />
                <p className="text-sm text-slate-500">
                  Vui lòng tải lên tối thiểu ảnh mặt trước & mặt sau của máy. Ảnh sắc nét giúp kết quả định giá chính xác và dễ dàng được duyệt đơn hơn.
                </p>

                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                  {imageFields.map((label) => (
                    <ImageUploadCard
                      key={label}
                      label={label}
                      image={uploadedImages[label]}
                      onChange={(event) => handleImageChange(label, event)}
                      onRemove={(event) => removeImage(label, event)}
                    />
                  ))}
                </div>
              </article>
            )}

            {/* Step 4: Kết quả định giá */}
            {currentStep === 4 && (
              <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6 animate-fade-in">
                <SectionHeader icon={<CheckIcon />} title="4. Tổng kết định giá tạm tính" />
                
                {submitting && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-800 text-base">Đang định giá thiết bị của bạn...</p>
                      <p className="text-xs text-slate-400 mt-1">Đang phân tích các thông số và áp dụng khấu hao trừ lỗi</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl bg-red-50 border border-red-100 p-5 text-center space-y-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 text-xl font-bold">⚠️</span>
                    <p className="font-bold text-red-800">{error}</p>
                    <button
                      type="button"
                      onClick={handleEstimate}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-xs font-bold text-white transition"
                    >
                      Thử định giá lại
                    </button>
                  </div>
                )}

                {!submitting && !error && result && (
                  <div className="space-y-6">
                    {/* Valuation Panel */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Chi tiết linh kiện khấu trừ</h3>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                          <ResultRow
                            label="Giá trị máy đẹp tối đa (Zin 99%)"
                            value={`${result.basePrice.toLocaleString("vi-VN")} đ`}
                            highlight={false}
                          />
                          <div className="border-t border-dashed border-slate-200 my-2" />
                          {result.deductions && result.deductions.length > 0 ? (
                            result.deductions.map((item, idx) => (
                              <ResultRow
                                key={idx}
                                label={item.reason}
                                value={`- ${item.amount.toLocaleString("vi-VN")} đ`}
                                isDeduction
                              />
                            ))
                          ) : (
                            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              ✨ Không có khoản giảm trừ! Máy đạt chuẩn xuất sắc.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-between rounded-2xl bg-indigo-900 p-6 text-white shadow-md relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
                        <div className="relative space-y-2">
                          <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 border border-indigo-400/20 px-2.5 py-1 rounded-full">
                            Ước tính giá thu mua
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                              {result.estimatedPrice.toLocaleString("vi-VN")}
                            </span>
                            <span className="text-sm font-bold text-indigo-300">VND</span>
                          </div>
                          <p className="text-xs text-indigo-200 leading-relaxed">
                            Giá trị thực tế sẽ được nhân viên thẩm định lại tại cửa hàng. Giá có thể chênh lệch không đáng kể so với bảng định giá online này.
                          </p>
                        </div>
                        <div className="relative mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-indigo-300 font-medium">
                          <span>Trợ giá lên đời: +1,000,000đ</span>
                          <span className="text-emerald-400 font-bold">Đã tính trợ giá</span>
                        </div>
                      </div>
                    </div>

                    {/* Specifications Summary List */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tóm tắt cấu hình máy định giá</h4>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                        <div className="p-2.5 rounded-lg bg-white border border-slate-100">
                          <span className="text-slate-400 block mb-0.5">Dòng máy</span>
                          <span className="font-bold text-slate-800">{formData.model}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-slate-100">
                          <span className="text-slate-400 block mb-0.5">Dung lượng & Pin</span>
                          <span className="font-bold text-slate-800">{formData.storage} - Pin {formData.batteryHealth}%</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-slate-100">
                          <span className="text-slate-400 block mb-0.5">Màn hình & Vỏ</span>
                          <span className="font-bold text-slate-800">
                            {formData.displayStatus === "original" ? "Zin đẹp" : "Đã thay/xước"} - {formData.bodyCondition === "clean" ? "Mới 99%" : formData.bodyCondition === "light_scratches" ? "Trầy nhẹ 95%" : "Móp nặng"}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-slate-100">
                          <span className="text-slate-400 block mb-0.5">Ảnh tải lên</span>
                          <span className="font-bold text-slate-800">{Object.keys(uploadedImages).length} ảnh minh họa</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            )}

            {/* Stepper Wizard Navigation Buttons */}
            <div className="flex items-center justify-between gap-4">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-6 py-3 text-sm font-bold text-slate-700 transition"
                >
                  <ArrowLeftIcon /> Quay lại
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/10 transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  Tiếp theo <ArrowRightIcon />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setResult(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-850 px-6 py-3 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  🔄 Định giá máy khác
                </button>
              )}
            </div>
          </div>

          {/* Right sidebar details */}
          <aside className="space-y-6">
            {/* Quick benefits checklist */}
            <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider">
                Quyền lợi thu cũ tại shop
              </h3>
              <div className="space-y-3">
                <BenefitRow text="Thủ tục nhanh chóng" desc="Nhận tiền mặt hoặc chuyển khoản chỉ sau 10 phút kiểm tra." />
                <BenefitRow text="Hỗ trợ trả góp 0%" desc="Hỗ trợ lên đời trả góp 0% lãi suất trên phần chênh lệch." />
                <BenefitRow text="Hỗ trợ sao lưu dữ liệu" desc="Nhân viên hỗ trợ backup ảnh, danh bạ, Zalo từ máy cũ sang máy mới." />
                <BenefitRow text="Trợ giá cực khủng" desc="Tặng thêm voucher trị giá lên tới 1,000,000đ khi mua máy mới." />
              </div>
            </article>

            {/* Zalo / Call CTA box */}
            <article className="rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 p-6 text-white shadow-md relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
              <div className="relative space-y-4">
                <span className="text-2xl">💬</span>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Bạn muốn chốt giao dịch?</h4>
                  <p className="text-xs text-blue-100 leading-relaxed">
                    Liên hệ Zalo của cửa hàng để gửi kết quả định giá này và đặt lịch hẹn mang máy đến cửa hàng tiện lợi nhất.
                  </p>
                </div>
                <a
                  href="https://zalo.me/0901234567"
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50 active:scale-95"
                >
                  Nhắn Zalo Nhận Trợ Giá
                </a>
              </div>
            </article>
          </aside>
        </div>

      </div>
    </main>
  );
}

// Sub-components
function StepperItem({ number, title, active, completed }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-300 ${
        active
          ? "border-indigo-200 bg-indigo-50/50 text-indigo-900 shadow-sm shadow-indigo-100/50"
          : completed
          ? "border-emerald-100 bg-emerald-50/30 text-slate-800"
          : "border-slate-100 bg-slate-50/50 text-slate-400"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
          active
            ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
            : completed
            ? "bg-emerald-500 text-white"
            : "bg-white text-slate-400 border border-slate-200"
        }`}
      >
        {completed ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          number
        )}
      </span>
      <span className={`text-sm font-semibold truncate ${active ? "text-indigo-950 font-bold" : "text-slate-600"}`}>
        {title}
      </span>
    </div>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        {icon}
      </span>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
    </div>
  );
}

function FormSelect({ label, name, value, onChange, options }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 font-medium outline-none transition focus:border-indigo-500 focus:bg-white"
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

function ChoicePill({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-300 ${
        active
          ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
      }`}
    >
      {children}
    </button>
  );
}

function ChoiceBox({ label, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col p-4 rounded-xl border text-left transition-all duration-300 ${
        active
          ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-4.5 w-4.5 shrink-0 rounded-full border items-center justify-center ${
            active ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
          }`}
        >
          {active && <span className="h-2 w-2 rounded-full bg-white" />}
        </span>
        <span className="text-sm font-bold text-slate-800">{label}</span>
      </div>
      <p className="mt-2 text-xs text-slate-450 leading-relaxed font-normal">{description}</p>
    </button>
  );
}

function ScoreCard({ title, note, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col p-4 rounded-xl border text-left transition-all duration-300 h-full justify-between ${
        active
          ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
          : "border-slate-200 bg-white hover:border-indigo-300"
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          <span
            className={`flex h-4.5 w-4.5 shrink-0 rounded-full border items-center justify-center ${
              active ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
            }`}
          >
            {active && <span className="h-2 w-2 rounded-full bg-white" />}
          </span>
          <span className={`text-sm font-extrabold ${active ? "text-indigo-800" : "text-slate-800"}`}>{title}</span>
        </div>
        <p className="mt-2 text-xs text-slate-450 leading-normal font-normal">{note}</p>
      </div>
    </button>
  );
}

function ImageUploadCard({ label, image, onChange, onRemove }) {
  return (
    <div className="relative group rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-2.5 text-center transition hover:border-indigo-400 hover:bg-indigo-50/20">
      {image ? (
        <div className="relative rounded-xl overflow-hidden aspect-square w-full">
          <img
            src={image.previewUrl}
            alt={label}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-red-650/80 backdrop-blur-sm hover:bg-red-700 text-white transition shadow"
            title="Xóa hình ảnh này"
          >
            <svg xmlns="http://www.w3.org/2500/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center cursor-pointer aspect-square w-full">
          <input type="file" accept="image/*" className="hidden" onChange={onChange} />
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm border border-slate-100 group-hover:text-indigo-600 group-hover:border-indigo-200 transition">
            <UploadIcon />
          </span>
          <p className="mt-2.5 text-[11px] font-bold text-slate-600 leading-none">{label}</p>
          <span className="text-[9px] text-slate-400 mt-1 font-semibold">Tải ảnh lên</span>
        </label>
      )}
    </div>
  );
}

function BenefitRow({ text, desc }) {
  return (
    <div className="flex items-start gap-2.5 text-slate-600">
      <span className="mt-0.5 text-emerald-500 shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
      <div>
        <p className="text-xs font-bold text-slate-800 leading-none">{text}</p>
        <p className="mt-1 text-[11px] text-slate-400 leading-relaxed font-normal">{desc}</p>
      </div>
    </div>
  );
}

function ResultRow({ label, value, isDeduction = false, highlight = false }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs py-0.5">
      <span className={`font-semibold ${isDeduction ? "text-slate-500" : highlight ? "text-indigo-700" : "text-slate-700"}`}>
        {label}
      </span>
      <span className={`font-bold ${isDeduction ? "text-red-500" : highlight ? "text-indigo-700 text-sm" : "text-slate-800"}`}>
        {value}
      </span>
    </div>
  );
}

// Icons
function DeviceIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="h-4 w-4"
    >
      <rect x="7" y="2" width="10" height="20" rx="2.5" />
      <path strokeLinecap="round" d="M11 5h2" />
      <circle cx="12" cy="18" r="0.75" fill="currentColor" stroke="none" />
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
      strokeWidth="2.5"
      className="h-4 w-4"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 15-5-5L5 20" />
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
      strokeWidth="2.5"
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V6m0 0L8.5 9.5M12 6l3.5 3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 16.5v1.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2500/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

export default TradeInPage;
