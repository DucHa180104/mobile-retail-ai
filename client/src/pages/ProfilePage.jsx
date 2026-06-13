import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

const emptyShippingInfo = {
  fullName: "",
  phoneNumber: "",
  address: "",
  city: "",
  district: "",
  ward: "",
  note: ""
};

function ProfilePage() {
  const { token, isAuthenticated, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    shippingInfo: emptyShippingInfo
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      if (!isAuthenticated || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError("");

        const response = await fetch(buildApiUrl("/api/auth/me"), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Không thể tải hồ sơ người dùng");
        }

        const nextUser = data.user;
        updateUser(nextUser);
        setProfileForm({
          name: nextUser.name || "",
          email: nextUser.email || "",
          phoneNumber: nextUser.phoneNumber || "",
          shippingInfo: {
            ...emptyShippingInfo,
            ...(nextUser.shippingInfo || {})
          }
        });
      } catch (fetchError) {
        setLoadError(fetchError.message || "Không thể tải hồ sơ người dùng");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [isAuthenticated, token]);

  function handleProfileChange(event) {
    const { name, value } = event.target;

    setProfileForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleShippingChange(event) {
    const { name, value } = event.target;

    setProfileForm((current) => ({
      ...current,
      shippingInfo: {
        ...current.shippingInfo,
        [name]: value
      }
    }));
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;

    setPasswordForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const response = await fetch(buildApiUrl("/api/auth/profile"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          phoneNumber: profileForm.phoneNumber.trim(),
          shippingInfo: {
            fullName: profileForm.shippingInfo.fullName.trim(),
            phoneNumber: profileForm.shippingInfo.phoneNumber.trim(),
            address: profileForm.shippingInfo.address.trim(),
            city: profileForm.shippingInfo.city.trim(),
            district: profileForm.shippingInfo.district.trim(),
            ward: profileForm.shippingInfo.ward.trim(),
            note: profileForm.shippingInfo.note.trim()
          }
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể cập nhật hồ sơ");
      }

      updateUser(data.user);
      setProfileForm({
        name: data.user.name || "",
        email: data.user.email || "",
        phoneNumber: data.user.phoneNumber || "",
        shippingInfo: {
          ...emptyShippingInfo,
          ...(data.user.shippingInfo || {})
        }
      });
      setProfileSuccess("Cập nhật hồ sơ thành công");
    } catch (submitError) {
      setProfileError(submitError.message || "Không thể cập nhật hồ sơ");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      if (!passwordForm.currentPassword || !passwordForm.newPassword) {
        throw new Error("Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới");
      }

      if (passwordForm.newPassword.length < 6) {
        throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự");
      }

      if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
        throw new Error("Xác nhận mật khẩu mới không khớp");
      }

      const response = await fetch(buildApiUrl("/api/auth/change-password"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể đổi mật khẩu");
      }

      setPasswordSuccess("Đổi mật khẩu thành công");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      });
    } catch (submitError) {
      setPasswordError(submitError.message || "Không thể đổi mật khẩu");
    } finally {
      setPasswordLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-5 lg:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">Hồ sơ người dùng</h1>
          <p className="mt-3 text-slate-600">Vui lòng đăng nhập để xem và cập nhật hồ sơ của bạn.</p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Đi đến đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-5 lg:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-slate-600">Đang tải hồ sơ người dùng...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-5 lg:px-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-12 text-center shadow-sm">
          <p className="text-red-700">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-5 lg:px-6">
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
            Tài khoản
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-900">Hồ sơ của tôi</h1>
          <p className="mt-2 text-sm text-slate-500">
            Cập nhật thông tin cá nhân, địa chỉ giao hàng mặc định và mật khẩu đăng nhập.
          </p>
        </section>

        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Thông tin cá nhân</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FormField label="Họ và tên">
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                  required
                />
              </FormField>

              <FormField label="Email">
                <input
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
                />
              </FormField>

              <FormField label="Số điện thoại">
                <input
                  type="text"
                  name="phoneNumber"
                  value={profileForm.phoneNumber}
                  onChange={handleProfileChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                  placeholder="0900000000"
                />
              </FormField>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Địa chỉ giao hàng mặc định</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FormField label="Họ tên người nhận">
                <input
                  type="text"
                  name="fullName"
                  value={profileForm.shippingInfo.fullName}
                  onChange={handleShippingChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </FormField>

              <FormField label="Số điện thoại nhận hàng">
                <input
                  type="text"
                  name="phoneNumber"
                  value={profileForm.shippingInfo.phoneNumber}
                  onChange={handleShippingChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </FormField>

              <FormField label="Địa chỉ">
                <input
                  type="text"
                  name="address"
                  value={profileForm.shippingInfo.address}
                  onChange={handleShippingChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </FormField>

              <FormField label="Thành phố">
                <input
                  type="text"
                  name="city"
                  value={profileForm.shippingInfo.city}
                  onChange={handleShippingChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </FormField>

              <FormField label="Quận / Huyện">
                <input
                  type="text"
                  name="district"
                  value={profileForm.shippingInfo.district}
                  onChange={handleShippingChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </FormField>

              <FormField label="Phường / Xã">
                <input
                  type="text"
                  name="ward"
                  value={profileForm.shippingInfo.ward}
                  onChange={handleShippingChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Ghi chú">
                  <textarea
                    name="note"
                    value={profileForm.shippingInfo.note}
                    onChange={handleShippingChange}
                    rows="4"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </FormField>
              </div>
            </div>

            {profileError ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {profileError}
              </div>
            ) : null}

            {profileSuccess ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {profileSuccess}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={profileLoading}
              className="mt-5 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {profileLoading ? "Đang lưu hồ sơ..." : "Lưu hồ sơ"}
            </button>
          </section>
        </form>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Đổi mật khẩu</h2>
          <form onSubmit={handlePasswordSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
            <FormField label="Mật khẩu hiện tại">
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                required
              />
            </FormField>

            <FormField label="Mật khẩu mới">
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                required
              />
            </FormField>

            <FormField label="Xác nhận mật khẩu mới">
              <input
                type="password"
                name="confirmNewPassword"
                value={passwordForm.confirmNewPassword}
                onChange={handlePasswordChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                required
              />
            </FormField>

            <div className="md:col-span-2">
              {passwordError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {passwordError}
                </div>
              ) : null}

              {passwordSuccess ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {passwordSuccess}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={passwordLoading}
                className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {passwordLoading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export default ProfilePage;
