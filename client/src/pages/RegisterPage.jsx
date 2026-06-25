import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
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

    try {
      const response = await fetch(buildApiUrl("/api/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name.trim(),
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

  return (
    <div className="mx-auto flex min-h-[calc(100vh-220px)] w-full max-w-4xl items-center px-4 py-10">
      <div className="w-full animate-fade-in overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg lg:grid lg:grid-cols-12">
        {/* Form Container */}
        <div className="w-full p-7 sm:p-9 lg:col-span-7 flex flex-col justify-center">
          {/* Logo */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-md shadow-blue-200">
              <span className="text-xl font-black text-white">M</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Mạnh Hường Mobile
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Đăng ký</h1>
            <p className="mt-2 text-sm text-slate-500">
              Tạo tài khoản mới để theo dõi đơn hàng và đăng nhập nhanh hơn.
            </p>
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
            <FormField label="Họ và tên">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="Nguyễn Văn A"
                required
              />
            </FormField>

            <FormField label="Email">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="admin@example.com"
                required
              />
            </FormField>

            <FormField label="Mật khẩu">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="Nhập mật khẩu"
                required
              />
            </FormField>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang đăng ký...
                </span>
              ) : "Đăng ký"}
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
                Tham gia thành viên Mạnh Hường Mobile
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
