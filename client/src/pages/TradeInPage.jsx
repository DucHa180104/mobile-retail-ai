import { useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../lib/api.js";

const imageFields = [
  "Mặt trước",
  "Mặt sau",
  "Cạnh viền",
  "Pin/BH",
  "Linh kiện sửa"
];

const brandDisplayData = {
  Apple: { logo: "🍎", bg: "from-indigo-600 to-slate-900", label: "Apple iPhone" },
  Samsung: { logo: "📱", bg: "from-blue-600 to-cyan-900", label: "Samsung Galaxy" },
  Xiaomi: { logo: "🟧", bg: "from-orange-500 to-amber-800", label: "Xiaomi Note/Pro" },
  Oppo: { logo: "🟢", bg: "from-emerald-500 to-teal-800", label: "Oppo Reno/Series" }
};

const initialFormData = {
  brand: "",
  model: "",
  storage: "",
  batteryHealth: "85",
  displayStatus: "original",
  bodyCondition: "clean",
  faceIdStatus: "working",
  accessoryStatus: "full"
};

function TradeInPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [pricingRules, setPricingRules] = useState([]);
  const [pricingRulesLoading, setPricingRulesLoading] = useState(true);
  const [uploadedImages, setUploadedImages] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const availableBrands = useMemo(
    () => [...new Set(pricingRules.map((rule) => rule.brand))],
    [pricingRules]
  );

  const availableModels = useMemo(
    () => [
      ...new Set(
        pricingRules
          .filter((rule) => rule.brand === formData.brand)
          .map((rule) => rule.modelName)
      )
    ],
    [pricingRules, formData.brand]
  );

  const availableStorageOptions = useMemo(
    () =>
      pricingRules
        .filter(
          (rule) =>
            rule.brand === formData.brand && rule.modelName === formData.model
        )
        .map((rule) => rule.storage),
    [pricingRules, formData.brand, formData.model]
  );

  useEffect(() => {
    fetchPricingRules();
  }, []);

  useEffect(() => {
    return () => {
      Object.values(uploadedImages).forEach((item) => {
        if (item?.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [uploadedImages]);

  useEffect(() => {
    if (pricingRules.length === 0) {
      return;
    }

    setFormData((current) => {
      const nextBrand =
        current.brand && availableBrands.includes(current.brand)
          ? current.brand
          : availableBrands[0] || "";

      const nextModels = [
        ...new Set(
          pricingRules
            .filter((rule) => rule.brand === nextBrand)
            .map((rule) => rule.modelName)
        )
      ];

      const nextModel =
        current.model && nextModels.includes(current.model)
          ? current.model
          : nextModels[0] || "";

      const nextStorages = pricingRules
        .filter(
          (rule) => rule.brand === nextBrand && rule.modelName === nextModel
        )
        .map((rule) => rule.storage);

      const nextStorage =
        current.storage && nextStorages.includes(current.storage)
          ? current.storage
          : nextStorages[0] || "";

      return {
        ...current,
        brand: nextBrand,
        model: nextModel,
        storage: nextStorage
      };
    });
  }, [pricingRules, availableBrands]);

  useEffect(() => {
    if (currentStep === 4) {
      handleEstimate();
    }
  }, [currentStep]);

  async function fetchPricingRules() {
    try {
      setPricingRulesLoading(true);
      setError("");

      const response = await fetch(buildApiUrl("/api/tradein/pricing-rules"));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải danh sách máy thu cũ.");
      }

      setPricingRules(data.pricingRules || []);
    } catch (fetchError) {
      setError(fetchError.message || "Không thể tải danh sách máy thu cũ.");
    } finally {
      setPricingRulesLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => {
      const nextData = {
        ...current,
        [name]: value
      };

      if (name === "brand") {
        const nextModels = [
          ...new Set(
            pricingRules
              .filter((rule) => rule.brand === value)
              .map((rule) => rule.modelName)
          )
        ];

        nextData.model = nextModels[0] || "";
        nextData.storage =
          pricingRules.find(
            (rule) =>
              rule.brand === value && rule.modelName === nextData.model
          )?.storage || "";
      }

      if (name === "model") {
        nextData.storage =
          pricingRules.find(
            (rule) =>
              rule.brand === current.brand && rule.modelName === value
          )?.storage || "";
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

    if (!formData.brand) {
      setError("Vui lòng chọn hãng máy.");
      return;
    }

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
          brand: formData.brand,
          modelName: formData.model,
          storage: formData.storage,
          batteryHealth: batteryHealthValue,
          displayStatus: formData.displayStatus,
          bodyCondition: formData.bodyCondition,
          faceIdStatus:
            formData.faceIdStatus === "none" ? "working" : formData.faceIdStatus,
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
      if (!formData.brand) {
        setError("Vui lòng chọn hãng máy trước khi tiếp tục.");
        return;
      }

      if (!formData.model) {
        setError("Vui lòng chọn tên dòng máy trước khi tiếp tục.");
        return;
      }

      if (!formData.storage) {
        setError("Vui lòng chọn dung lượng máy trước khi tiếp tục.");
        return;
      }

      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      const batteryHealthValue = Number(formData.batteryHealth);

      if (
        Number.isNaN(batteryHealthValue) ||
        batteryHealthValue < 50 ||
        batteryHealthValue > 100
      ) {
        setError("Tình trạng pin phải trong khoảng từ 50% đến 100%.");
        return;
      }

      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
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
      <div className="mx-auto max-w-[1120px] space-y-6 px-4">
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-12 text-white shadow-xl shadow-indigo-950/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.15),transparent_50%)]" />
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-3xl space-y-3 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/20 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-300">
              ⚡ Định giá trong 30 giây
            </span>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Thu Cũ Đổi Mới Lên Đời
            </h1>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-300">
              Chọn đúng dòng máy từ bảng giá thật của shop để hệ thống ước tính giá
              thu mua sát hơn và tránh nhầm model, nhầm dung lượng.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { id: 1, label: "Chọn dòng máy" },
              { id: 2, label: "Nhập tình trạng" },
              { id: 3, label: "Tải ảnh thực tế" },
              { id: 4, label: "Nhận kết quả" }
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

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.6fr]">
          <div className="space-y-6">
            {currentStep === 1 ? (
              <article className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <SectionHeader icon={<DeviceIcon />} title="1. Thông tin dòng máy cần định giá" />

                {pricingRulesLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Đang tải danh sách máy từ bảng giá thu cũ...
                  </div>
                ) : null}

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Hãng điện thoại
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {availableBrands.map((brandName) => {
                      const details = brandDisplayData[brandName] || {
                        logo: "📱",
                        bg: "from-slate-600 to-slate-900",
                        label: brandName
                      };
                      const isSelected = formData.brand === brandName;

                      return (
                        <button
                          key={brandName}
                          type="button"
                          onClick={() => {
                            handleChange({
                              target: { name: "brand", value: brandName }
                            });
                          }}
                          className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all duration-300 ${
                            isSelected
                              ? `border-transparent bg-gradient-to-br ${details.bg} text-white shadow-lg`
                              : "border-slate-100 bg-slate-50 text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          <span className="mb-1.5 text-2xl">{details.logo}</span>
                          <span className="text-sm font-bold">{brandName}</span>
                          <span
                            className={`text-[10px] ${
                              isSelected ? "text-indigo-200" : "text-slate-400"
                            }`}
                          >
                            {details.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Tên điện thoại cụ thể
                    </label>
                    <select
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      disabled={pricingRulesLoading || availableModels.length === 0}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {availableModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Dung lượng máy
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableStorageOptions.map((storage) => (
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
            ) : null}

            {currentStep === 2 ? (
              <article className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <SectionHeader icon={<CheckIcon />} title="2. Tình trạng chi tiết của máy" />

                <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Tình trạng pin (%)</p>
                      <p className="text-xs text-slate-400">
                        Hiệu năng sạc tối đa hiện tại
                      </p>
                    </div>
                    <span className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xl font-extrabold text-indigo-600">
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
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                  />
                  <div className="flex justify-between px-1 text-[10px] font-semibold text-slate-400">
                    <span>Cần thay thế (50%)</span>
                    <span>Tốt (80%)</span>
                    <span>Hoàn hảo (100%)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Màn hình hiển thị
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      {
                        value: "original",
                        label: "Màn hình zin, đẹp",
                        desc: "Không trầy xước, hiển thị sắc nét"
                      },
                      {
                        value: "replaced",
                        label: "Đã thay/trầy xước",
                        desc: "Có trầy xước nhẹ hoặc đã ép kính/thay màn"
                      },
                      {
                        value: "unknown",
                        label: "Không xác định",
                        desc: "Bị ố vàng, đốm đen, liệt cảm ứng hoặc lỗi khác"
                      }
                    ].map((opt) => (
                      <ChoiceBox
                        key={opt.value}
                        active={formData.displayStatus === opt.value}
                        label={opt.label}
                        description={opt.desc}
                        onClick={() =>
                          setFormData((current) => ({
                            ...current,
                            displayStatus: opt.value
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Ngoại hình máy
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <ScoreCard
                      active={formData.bodyCondition === "clean"}
                      title="99% - Như mới"
                      note="Không trầy xước, cấn móp, khung sườn nguyên bản"
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          bodyCondition: "clean"
                        }))
                      }
                    />
                    <ScoreCard
                      active={formData.bodyCondition === "light_scratches"}
                      title="95% - Trầy xước nhẹ"
                      note="Có xước dăm nhẹ, cấn nhẹ ở góc máy khó thấy"
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          bodyCondition: "light_scratches"
                        }))
                      }
                    />
                    <ScoreCard
                      active={formData.bodyCondition === "heavy_scratches"}
                      title="<90% - Móp nặng"
                      note="Có vết nứt vỏ, móp méo sâu, trầy xước diện rộng"
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          bodyCondition: "heavy_scratches"
                        }))
                      }
                    />
                  </div>
                </div>

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
                      {
                        label: "Thiếu hộp / chỉ có cáp hoặc máy trần",
                        value: "missing_box_or_cable"
                      }
                    ]}
                  />
                </div>
              </article>
            ) : null}

            {currentStep === 3 ? (
              <article className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <SectionHeader icon={<ImageIcon />} title="3. Hình ảnh chụp thực tế từ máy" />
                <p className="text-sm text-slate-500">
                  Vui lòng tải tối thiểu ảnh mặt trước và mặt sau của máy. Ảnh rõ
                  ràng sẽ giúp nhân viên xác minh nhanh hơn khi bạn mang máy tới shop.
                </p>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
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
            ) : null}

            {currentStep === 4 ? (
              <article className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <SectionHeader icon={<CheckIcon />} title="4. Kết quả định giá sơ bộ" />

                {submitting ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Đang tính giá thu cũ từ bảng giá hiện hành...
                  </div>
                ) : result ? (
                  <div className="space-y-5">
                    <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Chi tiết ước tính
                        </p>
                        <div className="mt-4 space-y-2">
                          <ResultRow
                            label="Giá gốc theo bảng giá"
                            value={`${result.basePrice.toLocaleString("vi-VN")} đ`}
                            highlight
                          />
                          <div className="my-2 border-t border-dashed border-slate-200" />
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
                            <p className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              ✨ Không có khoản giảm trừ, máy đang ở tình trạng rất tốt.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-2xl bg-indigo-900 p-6 text-white shadow-md">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
                        <div className="relative space-y-2">
                          <span className="inline-block rounded-full border border-indigo-400/20 bg-indigo-500/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider">
                            Ước tính giá thu mua
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black tracking-tight sm:text-4xl">
                              {result.estimatedPrice.toLocaleString("vi-VN")}
                            </span>
                            <span className="text-sm font-bold text-indigo-300">VND</span>
                          </div>
                          <p className="text-xs leading-relaxed text-indigo-200">
                            Đây là mức giá sơ bộ theo rule hiện hành. Khi mang máy tới
                            cửa hàng, nhân viên sẽ kiểm tra thực tế để chốt giá cuối.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4">
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Tóm tắt cấu hình máy định giá
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                        <SummaryBox label="Hãng" value={formData.brand} />
                        <SummaryBox label="Dòng máy" value={formData.model} />
                        <SummaryBox
                          label="Dung lượng & pin"
                          value={`${formData.storage} - Pin ${formData.batteryHealth}%`}
                        />
                        <SummaryBox
                          label="Ảnh tải lên"
                          value={`${Object.keys(uploadedImages).length} ảnh minh họa`}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
                    Chưa thể định giá. Vui lòng kiểm tra lại thông tin máy và thử lại.
                  </div>
                )}
              </article>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-4">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
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
                  disabled={pricingRulesLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/10 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  Tiếp theo <ArrowRightIcon />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setResult(null);
                    setError("");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  🔄 Định giá máy khác
                </button>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <article className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="border-b border-slate-100 pb-3 text-sm font-extrabold uppercase tracking-wider text-slate-900">
                Quyền lợi thu cũ tại shop
              </h3>
              <div className="space-y-3">
                <BenefitRow
                  text="Thủ tục nhanh chóng"
                  desc="Kiểm tra máy nhanh và báo giá minh bạch theo bảng giá hiện hành."
                />
                <BenefitRow
                  text="Lên đời dễ dàng"
                  desc="Có thể dùng mức định giá này để bù sang máy khác tại cửa hàng."
                />
                <BenefitRow
                  text="Đỡ nhập sai model"
                  desc="Bạn chọn trực tiếp từ danh sách máy đang được hỗ trợ thu cũ."
                />
                <BenefitRow
                  text="Ảnh minh họa rõ ràng"
                  desc="Ảnh càng rõ, quá trình xác minh thực tế tại cửa hàng càng nhanh."
                />
              </div>
            </article>

            <article className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 p-6 text-white shadow-md">
              <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
              <div className="relative space-y-4">
                <span className="text-2xl">💬</span>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Bạn muốn chốt giao dịch?</h4>
                  <p className="text-xs leading-relaxed text-blue-100">
                    Sau khi có giá sơ bộ, bạn có thể nhắn Zalo hoặc đến cửa hàng để
                    nhân viên kiểm tra thực tế và chốt giá cuối.
                  </p>
                </div>
                <a
                  href="https://zalo.me/0901234567"
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-blue-700 transition hover:bg-blue-50"
                >
                  Nhắn Zalo nhận tư vấn
                </a>
              </div>
            </article>
          </aside>
        </div>
      </div>
    </main>
  );
}

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
              : "border border-slate-200 bg-white text-slate-400"
        }`}
      >
        {completed ? (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          number
        )}
      </span>
      <span
        className={`truncate text-sm font-semibold ${
          active ? "font-bold text-indigo-950" : "text-slate-600"
        }`}
      >
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
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white"
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
      className={`flex flex-col rounded-xl border p-4 text-left transition-all duration-300 ${
        active
          ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border ${
            active ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
          }`}
        >
          {active ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
        </span>
        <span className="text-sm font-bold text-slate-800">{label}</span>
      </div>
      <p className="mt-2 text-xs font-normal leading-relaxed text-slate-500">
        {description}
      </p>
    </button>
  );
}

function ScoreCard({ title, note, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full flex-col justify-between rounded-xl border p-4 text-left transition-all duration-300 ${
        active
          ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
          : "border-slate-200 bg-white hover:border-indigo-300"
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          <span
            className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border ${
              active ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
            }`}
          >
            {active ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
          </span>
          <span className={`text-sm font-extrabold ${active ? "text-indigo-800" : "text-slate-800"}`}>
            {title}
          </span>
        </div>
        <p className="mt-2 text-xs font-normal leading-normal text-slate-500">
          {note}
        </p>
      </div>
    </button>
  );
}

function ImageUploadCard({ label, image, onChange, onRemove }) {
  return (
    <div className="group relative rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-2.5 text-center transition hover:border-indigo-400 hover:bg-indigo-50/20">
      {image ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-xl">
          <img
            src={image.previewUrl}
            alt={label}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-1.5 top-1.5 rounded-lg bg-red-600/80 p-1 text-white shadow backdrop-blur-sm transition hover:bg-red-700"
            title="Xóa hình ảnh này"
          >
            <svg
              xmlns="http://www.w3.org/2500/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center">
          <input type="file" accept="image/*" className="hidden" onChange={onChange} />
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 shadow-sm transition group-hover:border-indigo-200 group-hover:text-indigo-600">
            <UploadIcon />
          </span>
          <p className="mt-2.5 text-[11px] font-bold leading-none text-slate-600">
            {label}
          </p>
          <span className="mt-1 text-[9px] font-semibold text-slate-400">
            Tải ảnh lên
          </span>
        </label>
      )}
    </div>
  );
}

function BenefitRow({ text, desc }) {
  return (
    <div className="flex items-start gap-2.5 text-slate-600">
      <span className="mt-0.5 shrink-0 text-emerald-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4.5 w-4.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </span>
      <div>
        <p className="text-xs font-bold leading-none text-slate-800">{text}</p>
        <p className="mt-1 text-[11px] font-normal leading-relaxed text-slate-400">
          {desc}
        </p>
      </div>
    </div>
  );
}

function ResultRow({ label, value, isDeduction = false, highlight = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5 text-xs">
      <span
        className={`font-semibold ${
          isDeduction
            ? "text-slate-500"
            : highlight
              ? "text-indigo-700"
              : "text-slate-700"
        }`}
      >
        {label}
      </span>
      <span
        className={`font-bold ${
          isDeduction
            ? "text-red-500"
            : highlight
              ? "text-sm text-indigo-700"
              : "text-slate-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SummaryBox({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-2.5">
      <span className="mb-0.5 block text-slate-400">{label}</span>
      <span className="font-bold text-slate-800">{value}</span>
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
