import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    // Front-end validation before sending to back-end
    if (formData.password.length < 8) {
      setError("Mật khẩu phải chứa ít nhất 8 ký tự");
      setLoading(false);
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError("Mật khẩu phải chứa ít nhất 1 chữ hoa");
      setLoading(false);
      return;
    }
    if (!/[a-z]/.test(formData.password)) {
      setError("Mật khẩu phải chứa ít nhất 1 chữ thường");
      setLoading(false);
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      setError("Mật khẩu phải chứa ít nhất 1 chữ số");
      setLoading(false);
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt");
      setLoading(false);
      return;
    }
    
    // Check personal info
    const lowerPassword = formData.password.toLowerCase();
    const lowerName = formData.name.toLowerCase().trim();
    const emailPrefix = formData.email.split("@")[0].toLowerCase();
    const cleanPhone = formData.phoneNumber ? formData.phoneNumber.replace(/\D/g, "") : "";
    if (
      lowerPassword.includes(lowerName) ||
      lowerPassword.includes(emailPrefix) ||
      (cleanPhone && lowerPassword.includes(cleanPhone))
    ) {
      setError("Mật khẩu không được chứa thông tin cá nhân (tên, email hoặc số điện thoại)");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/api/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          email: formData.email.trim(),
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Đăng ký thất bại");
      }

      login(data.user, data.token);
      navigate("/");
    } catch (submitError) {
      setError(submitError.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  // Calculate password strength criteria
  const password = formData.password;
  const name = formData.name;
  const email = formData.email;
  const phoneNumber = formData.phoneNumber;

  const criteria = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noPersonalInfo: true
  };

  if (password) {
    const lowerPassword = password.toLowerCase();
    const lowerName = name ? name.trim().toLowerCase() : "";
    const lowerEmail = email ? email.split("@")[0].toLowerCase() : "";
    const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, "") : "";

    if (
      (lowerName && lowerPassword.includes(lowerName)) ||
      (lowerEmail && lowerPassword.includes(lowerEmail)) ||
      (cleanPhone && lowerPassword.includes(cleanPhone))
    ) {
      criteria.noPersonalInfo = false;
    }
  } else {
    criteria.noPersonalInfo = false;
  }

  const metCount = Object.values(criteria).filter(Boolean).length;
  let strengthLabel = "Yếu";
  let strengthColor = "text-red-500";
  let barColor = "bg-slate-100";
  let barFillColor = "bg-red-500";
  let barWidth = "w-0";

  if (password.length > 0) {
    if (metCount === 6) {
      strengthLabel = "Mạnh";
      strengthColor = "text-emerald-500";
      barColor = "bg-emerald-100";
      barFillColor = "bg-emerald-500";
      barWidth = "w-full";
    } else if (metCount >= 4) {
      strengthLabel = "Trung bình";
      strengthColor = "text-amber-500";
      barColor = "bg-amber-100";
      barFillColor = "bg-amber-500";
      barWidth = "w-2/3";
    } else {
      strengthLabel = "Yếu";
      strengthColor = "text-red-500";
      barColor = "bg-red-100";
      barFillColor = "bg-red-500";
      barWidth = "w-1/3";
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-220px)] w-full max-w-4xl items-center px-4 py-10">
      <div className="w-full animate-fade-in overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg lg:grid lg:grid-cols-12">
        {/* Form Container */}
        <div className="w-full p-7 sm:p-9 lg:col-span-7 flex flex-col justify-center">
          {/* Logo */}
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500">
              TẠO TÀI KHOẢN THÀNH VIÊN
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Đăng ký</h1>
          </div>

          {error ? (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-4 w-4 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4M12 16h.01" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <FormField label="Họ tên">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Nhập họ và tên"
                required
              />
            </FormField>

            <FormField label="Số điện thoại">
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Nhập số điện thoại"
                required
              />
            </FormField>

            <FormField label="Email">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Nhập địa chỉ email"
                required
              />
            </FormField>

            <FormField label="Mật khẩu">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Nhập mật khẩu"
                required
              />
            </FormField>

            {/* Password Strength Indicator Box */}
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Độ mạnh mật khẩu</span>
                <span className={`text-xs font-bold ${strengthColor}`}>{strengthLabel}</span>
              </div>
              
              {/* Progress Bar */}
              <div className={`mt-2.5 h-1.5 w-full rounded-full ${barColor} overflow-hidden`}>
                <div className={`h-full ${barFillColor} transition-all duration-300 ${barWidth}`} />
              </div>
              
              {/* Criteria Grid */}
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                {/* 1. length */}
                <div className="flex items-center gap-2">
                  {criteria.length ? (
                    <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex h-4.5 w-4.5 items-center justify-center shrink-0">
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                    </div>
                  )}
                  <span className={`text-xs font-semibold leading-none ${criteria.length ? 'text-slate-700' : 'text-slate-400'}`}>Ít nhất 8 ký tự</span>
                </div>

                {/* 2. uppercase */}
                <div className="flex items-center gap-2">
                  {criteria.uppercase ? (
                    <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex h-4.5 w-4.5 items-center justify-center shrink-0">
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                    </div>
                  )}
                  <span className={`text-xs font-semibold leading-none ${criteria.uppercase ? 'text-slate-700' : 'text-slate-400'}`}>Có chữ hoa</span>
                </div>

                {/* 3. lowercase */}
                <div className="flex items-center gap-2">
                  {criteria.lowercase ? (
                    <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex h-4.5 w-4.5 items-center justify-center shrink-0">
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                    </div>
                  )}
                  <span className={`text-xs font-semibold leading-none ${criteria.lowercase ? 'text-slate-700' : 'text-slate-400'}`}>Có chữ thường</span>
                </div>

                {/* 4. number */}
                <div className="flex items-center gap-2">
                  {criteria.number ? (
                    <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex h-4.5 w-4.5 items-center justify-center shrink-0">
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                    </div>
                  )}
                  <span className={`text-xs font-semibold leading-none ${criteria.number ? 'text-slate-700' : 'text-slate-400'}`}>Có số</span>
                </div>

                {/* 5. specialChar */}
                <div className="flex items-center gap-2">
                  {criteria.specialChar ? (
                    <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex h-4.5 w-4.5 items-center justify-center shrink-0">
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                    </div>
                  )}
                  <span className={`text-xs font-semibold leading-none ${criteria.specialChar ? 'text-slate-700' : 'text-slate-400'}`}>Có ký tự đặc biệt</span>
                </div>

                {/* 6. noPersonalInfo */}
                <div className="flex items-center gap-2">
                  {criteria.noPersonalInfo ? (
                    <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex h-4.5 w-4.5 items-center justify-center shrink-0">
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                    </div>
                  )}
                  <span className={`text-xs font-semibold leading-none ${criteria.noPersonalInfo ? 'text-slate-700' : 'text-slate-400'}`}>Không chứa thông tin cá nhân</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-sky-400 to-sky-500 px-4 py-3.5 text-sm font-bold text-white shadow-sm shadow-sky-100 transition-all duration-200 hover:from-sky-500 hover:to-sky-600 hover:shadow-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang tạo tài khoản...
                </span>
              ) : "Tạo tài khoản"}
            </button>
          </form>


          <p className="mt-6 text-center text-sm text-slate-500">
            Đã có tài khoản?{" "}
            <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">
              Đăng nhập
            </Link>
          </p>
        </div>

        {/* Hero Side Panel */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-600 via-indigo-650 to-blue-900 p-9 text-white lg:col-span-5 lg:flex relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Hệ thống cửa hàng toàn quốc
              </div>
              <h2 className="mt-6 text-2xl font-black leading-tight tracking-tight">
                Tham gia thành viên Mạnh Hương Mobile
              </h2>
              <p className="mt-3 text-sm text-blue-100/90 leading-relaxed">
                Tạo tài khoản ngay hôm nay để nhận voucher giảm giá trực tiếp cho đơn hàng đầu tiên và hưởng chế độ bảo hành vàng.
              </p>
            </div>

            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-xs font-semibold">Tích lũy điểm thưởng khi mua sắm</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-xs font-semibold">Cập nhật nhanh nhất khuyến mãi mới</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-xs font-semibold">Hỗ trợ kỹ thuật 24/7 trực tuyến</span>
              </li>
            </ul>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-blue-200/80">
              <span>Hotline: 1900 1234</span>
              <span>manhhuongmobile.com</span>
            </div>
          </div>
        </div>
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

export default RegisterPage;
