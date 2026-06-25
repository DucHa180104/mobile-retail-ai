import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const menuItems = [
  { label: "Trang chủ", to: "/", activePaths: ["/"] },
  { label: "Điện thoại", to: "/phones", activePaths: ["/phones", "/products"] },
  { label: "Máy tính bảng", to: "/" },
  { label: "Phụ kiện", to: "/" },
  { label: "Thu cũ đổi mới", to: "/trade-in", activePaths: ["/trade-in"] },
  { label: "Liên hệ", to: "/" }
];

function Navbar({ searchValue, onSearchChange, totalItems }) {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/50 bg-white/75 shadow-sm backdrop-blur-lg transition-all duration-300">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-5 lg:px-6">
        <div className="py-3.5">
          <div className="flex flex-wrap items-center gap-4 lg:flex-nowrap">
            {/* Logo */}
            <Link to="/" className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-80">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-black text-white shadow-md shadow-blue-200">
                M
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-black tracking-tight text-blue-700">
                  MẠNH HƯƠNG
                </p>
              </div>
            </Link>

            {/* Search */}
            <div className="order-3 w-full lg:order-2 lg:mx-6 lg:flex-1">
              <label className="relative block">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  value={searchValue}
                  onChange={onSearchChange}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            {/* Actions */}
            <div className="order-2 ml-auto flex items-center gap-2 lg:order-3 lg:ml-0">
              <Link
                to="/cart"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700"
                aria-label="Giỏ hàng"
              >
                <CartIcon />
                {totalItems > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 animate-fade-in items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {totalItems}
                  </span>
                ) : null}
              </Link>

              {isAuthenticated ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <AccountDropdown user={user} isAdmin={isAdmin} onLogout={logout} />
                </div>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    to="/login"
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-300"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="mt-3.5 hidden items-center gap-1 border-t border-slate-100 pt-3.5 lg:flex">
            {menuItems.map((item) => (
              <MenuLink key={item.label} item={item} pathname={location.pathname} />
            ))}
          </nav>
        </div>

        {/* Mobile nav chips */}
        <div className="flex gap-2 overflow-x-auto border-t border-slate-100 pb-3.5 pt-3.5 lg:hidden">
          {menuItems.map((item) => (
            <MenuChip key={item.label} item={item} pathname={location.pathname} />
          ))}

          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Hồ sơ
              </Link>
              <Link
                to="/my-orders"
                className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Đơn hàng của tôi
              </Link>
              <Link
                to="/wishlist"
                className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Yêu thích
              </Link>
              {isAdmin ? (
                <Link
                  to="/admin/dashboard"
                  className="whitespace-nowrap rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Admin Dashboard
                </Link>
              ) : null}
              <button
                type="button"
                onClick={logout}
                className="whitespace-nowrap rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="whitespace-nowrap rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function AccountDropdown({ user, isAdmin, onLogout }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-black text-white shadow-sm">
          {getInitial(user?.name)}
        </span>
        <span className="max-w-[110px] truncate font-semibold">{user?.name}</span>
        <span className="text-slate-400 transition-transform duration-200 group-open:rotate-180">
          <ChevronDownIcon />
        </span>
      </summary>

      <div className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-64 animate-fade-in rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/60">
        <div className="border-b border-slate-100 px-3 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-black text-white">
              {getInitial(user?.name)}
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email || "Tài khoản người dùng"}</p>
            </div>
          </div>
        </div>

        <div className="mt-1.5 space-y-0.5">
          <DropdownLink to="/profile" label="Hồ sơ" />
          <DropdownLink to="/my-orders" label="Đơn hàng của tôi" />
          <DropdownLink to="/wishlist" label="Yêu thích" />
          {isAdmin ? <DropdownLink to="/admin/dashboard" label="Admin Dashboard" /> : null}
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors duration-150 hover:bg-red-50"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </details>
  );
}

function DropdownLink({ to, label }) {
  return (
    <Link
      to={to}
      className="flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50 hover:text-blue-700"
    >
      {label}
    </Link>
  );
}

function MenuLink({ item, pathname }) {
  const isActive = item.activePaths?.includes(pathname);

  return (
    <Link
      to={item.to}
      className={`relative px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
        isActive
          ? "text-blue-700"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {item.label}
      <span className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-600 transition-all duration-300 origin-center ${
        isActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
      }`} />
    </Link>
  );
}

function MenuChip({ item, pathname }) {
  const isActive = item.activePaths?.includes(pathname);

  return (
    <Link
      to={item.to}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
        isActive
          ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {item.label}
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
      <circle cx="11" cy="11" r="6" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4h2l2.2 10.3a1 1 0 0 0 1 .7h9.9a1 1 0 0 0 1-.8L21 7H7.1"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

function getInitial(name) {
  if (!name) {
    return "U";
  }

  return name.trim().charAt(0).toUpperCase();
}

export default Navbar;
