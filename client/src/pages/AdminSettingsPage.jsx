import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

function AdminSettingsPage() {
  const { token } = useAuth();
  const [storePhone, setStorePhone] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [qrUploading, setQrUploading] = useState(false);

  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneSuccess, setPhoneSuccess] = useState("");

  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressSuccess, setAddressSuccess] = useState("");

  const [qrSaving, setQrSaving] = useState(false);
  const [qrError, setQrError] = useState("");
  const [qrSuccess, setQrSuccess] = useState("");

  useEffect(() => {
    fetchContactSettings();
  }, [token]);

  async function fetchContactSettings() {
    try {
      setSettingsLoading(true);

      const response = await fetch(buildApiUrl("/api/contact-settings"), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải cấu hình liên hệ");
      }

      setStorePhone(data.storePhone || "");
      setSupportEmail(data.supportEmail || "");
      setStoreAddress(data.storeAddress || "");
      setQrImageUrl(data.zaloQrImageUrl || "");
      setPreviewImageUrl(data.zaloQrImageUrl || "");
    } finally {
      setSettingsLoading(false);
    }
  }

  async function saveContactSettings(payload) {
    const response = await fetch(buildApiUrl("/api/contact-settings"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        storePhone: storePhone.trim(),
        supportEmail: supportEmail.trim(),
        storeAddress: storeAddress.trim(),
        zaloQrImageUrl: qrImageUrl.trim(),
        ...payload
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Không thể cập nhật thông tin liên hệ");
    }

    setStorePhone(data.storePhone || "");
    setSupportEmail(data.supportEmail || "");
    setStoreAddress(data.storeAddress || "");
    setQrImageUrl(data.zaloQrImageUrl || "");
    setPreviewImageUrl(data.zaloQrImageUrl || "");

    return data;
  }

  async function handleSavePhone() {
    try {
      setPhoneSaving(true);
      setPhoneError("");
      setPhoneSuccess("");
      await saveContactSettings({ storePhone: storePhone.trim() });
      setPhoneSuccess("Đã lưu số điện thoại.");
    } catch (error) {
      setPhoneError(error.message || "Không thể lưu số điện thoại");
    } finally {
      setPhoneSaving(false);
    }
  }

  async function handleSaveEmail() {
    try {
      setEmailSaving(true);
      setEmailError("");
      setEmailSuccess("");
      await saveContactSettings({ supportEmail: supportEmail.trim() });
      setEmailSuccess("Đã lưu email hỗ trợ.");
    } catch (error) {
      setEmailError(error.message || "Không thể lưu email hỗ trợ");
    } finally {
      setEmailSaving(false);
    }
  }

  async function handleSaveAddress() {
    try {
      setAddressSaving(true);
      setAddressError("");
      setAddressSuccess("");
      await saveContactSettings({ storeAddress: storeAddress.trim() });
      setAddressSuccess("Đã lưu địa chỉ cửa hàng.");
    } catch (error) {
      setAddressError(error.message || "Không thể lưu địa chỉ cửa hàng");
    } finally {
      setAddressSaving(false);
    }
  }

  async function handleUploadQrFile(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setQrUploading(true);
      setQrError("");
      setQrSuccess("");

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(buildApiUrl("/api/uploads"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải ảnh QR lên");
      }

      setQrImageUrl(data.imageUrl || "");
      setPreviewImageUrl(data.imageUrl || "");
      setQrSuccess("Đã tải ảnh QR lên thành công. Bấm Lưu QR để áp dụng.");
    } catch (error) {
      setQrError(error.message || "Không thể tải ảnh QR lên");
    } finally {
      setQrUploading(false);
      event.target.value = "";
    }
  }

  async function handleSaveQr() {
    try {
      setQrSaving(true);
      setQrError("");
      setQrSuccess("");
      await saveContactSettings({ zaloQrImageUrl: qrImageUrl.trim() });
      setQrSuccess("Đã lưu QR Zalo.");
    } catch (error) {
      setQrError(error.message || "Không thể lưu QR Zalo");
    } finally {
      setQrSaving(false);
    }
  }

  function handleClearPreview() {
    setQrImageUrl("");
    setPreviewImageUrl("");
    setQrError("");
    setQrSuccess("");
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-2 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Cổng quản trị / <span className="text-indigo-600">Cài đặt</span>
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            Cài đặt hệ thống
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Quản lý tập trung thông tin liên hệ của cửa hàng để các trang phía user tự đồng bộ theo.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Nhóm cấu hình
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            Liên hệ, QR Zalo, thông tin cửa hàng
          </p>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cài đặt liên hệ
            </p>
            <h2 className="text-xl font-black text-slate-900">
              Thông tin cửa hàng và QR liên hệ
            </h2>
            <p className="text-sm leading-7 text-slate-500">
              Mỗi mục có nút lưu riêng. Sau khi lưu, trang liên hệ và footer sẽ lấy dữ liệu mới ngay từ backend.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <SingleSettingCard
                title="Số điện thoại"
                value={storePhone}
                placeholder="Ví dụ: 0909 123 456"
                disabled={settingsLoading || phoneSaving}
                onChange={setStorePhone}
                onSave={handleSavePhone}
                saving={phoneSaving}
                currentValue={storePhone || "Đang cập nhật"}
                error={phoneError}
                success={phoneSuccess}
              />

              <SingleSettingCard
                title="Email hỗ trợ"
                value={supportEmail}
                placeholder="Ví dụ: contact@manhhuongmobile.vn"
                type="email"
                disabled={settingsLoading || emailSaving}
                onChange={setSupportEmail}
                onSave={handleSaveEmail}
                saving={emailSaving}
                currentValue={supportEmail || "Đang cập nhật"}
                error={emailError}
                success={emailSuccess}
              />
            </div>

            <SingleSettingCard
              title="Địa chỉ cửa hàng"
              value={storeAddress}
              placeholder="Ví dụ: 123 Lê Đại Hành, Quận 11, TP.HCM"
              disabled={settingsLoading || addressSaving}
              onChange={setStoreAddress}
              onSave={handleSaveAddress}
              saving={addressSaving}
              currentValue={storeAddress || "Đang cập nhật"}
              error={addressError}
              success={addressSuccess}
              fullWidth
            />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                Link QR hoặc đường dẫn uploads
              </label>
              <input
                type="text"
                value={qrImageUrl}
                onChange={(event) => setQrImageUrl(event.target.value)}
                placeholder="Nhập URL QR Zalo hoặc /uploads/ten-file.png"
                disabled={settingsLoading || qrSaving}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 disabled:bg-slate-50"
              />
              <p className="mt-2 text-xs text-slate-400">
                Bạn có thể dán link ngoài hoặc dùng nút tải ảnh bên dưới để lấy link tự động.
              </p>

              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Tải ảnh QR từ máy
                    </p>
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        onChange={handleUploadQrFile}
                        disabled={qrUploading || qrSaving}
                        className="hidden"
                      />
                      {qrUploading ? "Đang tải ảnh..." : "Chọn ảnh QR"}
                    </label>
                    <p className="text-xs text-slate-400">
                      Hỗ trợ PNG, JPG, JPEG, WEBP. Ảnh sẽ đi qua API upload admin hiện có.
                    </p>
                  </div>

                  <div className="w-full max-w-[180px]">
                    <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
                      Xem trước
                    </p>
                    <div className="relative flex h-[180px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      {previewImageUrl ? (
                        <>
                          <button
                            type="button"
                            onClick={handleClearPreview}
                            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm font-black text-rose-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-rose-50"
                            aria-label="Xóa ảnh QR"
                          >
                            ×
                          </button>
                          <img
                            src={previewImageUrl}
                            alt="QR preview"
                            className="h-full w-full object-contain"
                          />
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center text-slate-400">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm ring-1 ring-slate-200">
                            <PlaceholderImageIcon />
                          </div>
                          <p className="mt-3 text-xs font-bold uppercase tracking-wider">
                            Chưa cài đặt ảnh QR
                          </p>
                          <p className="mt-2 max-w-[140px] text-xs leading-5">
                            Tải ảnh lên hoặc nhập link để hiển thị QR Zalo.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  Giá trị hiện tại: <span className="font-semibold text-slate-600">{qrImageUrl || "Đang cập nhật"}</span>
                </p>
                <button
                  type="button"
                  onClick={handleSaveQr}
                  disabled={settingsLoading || qrSaving || qrUploading}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {qrSaving ? "Đang lưu..." : "Lưu QR"}
                </button>
              </div>

              {qrError ? <p className="mt-2 text-xs font-semibold text-rose-600">{qrError}</p> : null}
              {qrSuccess ? <p className="mt-2 text-xs font-semibold text-emerald-600">{qrSuccess}</p> : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <SettingsCard
            title="Thông tin cửa hàng"
            description="Số điện thoại, email và địa chỉ đều có nút lưu riêng và sẽ đồng bộ ra giao diện user."
            status="Đang dùng"
          />
          <SettingsCard
            title="Kênh hỗ trợ"
            description="QR Zalo có thể nhập link tay hoặc upload từ máy rồi preview trước khi lưu."
            status="Đang dùng"
          />
          <SettingsCard
            title="Bảo mật"
            description="Cấu hình tài khoản admin, luật đăng nhập, cảnh báo phiên hết hạn."
            status="Mở rộng sau"
          />
          <SettingsCard
            title="Hệ thống"
            description="Mailtrap, Gemini, CORS, biến môi trường và log quan trọng."
            status="Chỉ đọc / bảo trì"
          />
        </div>
      </section>
    </div>
  );
}

function SingleSettingCard({
  title,
  value,
  placeholder,
  type = "text",
  disabled,
  onChange,
  onSave,
  saving,
  currentValue,
  error,
  success,
  fullWidth = false
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 ${fullWidth ? "" : ""}`}>
      <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
        {title}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 disabled:bg-slate-50"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          Giá trị hiện tại: <span className="font-semibold text-slate-600">{currentValue}</span>
        </p>
        <button
          type="button"
          onClick={onSave}
          disabled={disabled}
          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p> : null}
      {success ? <p className="mt-2 text-xs font-semibold text-emerald-600">{success}</p> : null}
    </div>
  );
}

function SettingsCard({ title, description, status }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{status}</p>
      <h3 className="mt-2 text-lg font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p>
    </article>
  );
}

function PlaceholderImageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <circle cx="9" cy="10" r="1.2" />
      <path d="m20.5 16-4.7-4.7a1 1 0 0 0-1.4 0L9 16" />
      <path d="m12.5 16-1.7-1.7a1 1 0 0 0-1.4 0L6 18" />
    </svg>
  );
}

export default AdminSettingsPage;
