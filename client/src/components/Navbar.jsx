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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-4 py-4 lg:flex-nowrap">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-sm">
              M
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-black text-blue-700">MẠNH HƯỜNG</p>
            </div>
          </Link>

          <nav className="order-2 hidden items-center gap-6 lg:flex">
            {menuItems.map((item) => (
              <MenuLink key={item.label} item={item} pathname={location.pathname} />
            ))}
          </nav>

          <div className="order-3 w-full lg:order-3 lg:ml-auto lg:max-w-sm lg:flex-1">
            <label className="relative block">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={searchValue}
                onChange={onSearchChange}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
              />
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                <SearchMiniIcon />
              </span>
            </label>
          </div>

          <div className="order-4 ml-auto flex items-center gap-3 lg:ml-4">
            <Link
              to="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-blue-700"
              aria-label="Giỏ hàng"
            >
              <CartIcon />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  to="/my-orders"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                >
                  Đơn hàng của tôi
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-700">
                    {getInitial(user?.name)}
                  </span>
                  <span className="max-w-[120px] truncate font-semibold">{user?.name}</span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  to="/login"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 lg:hidden">
          {menuItems.map((item) => (
            <MenuChip key={item.label} item={item} pathname={location.pathname} />
          ))}

          {isAuthenticated ? (
            <>
              <Link
                to="/my-orders"
                className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Đơn hàng của tôi
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="whitespace-nowrap rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="whitespace-nowrap rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
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

function MenuLink({ item, pathname }) {
  const isActive = item.activePaths?.includes(pathname);

  return (
    <Link
      to={item.to}
      className={`border-b-2 pb-1 text-sm font-semibold transition ${
        isActive
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-slate-600 hover:text-slate-900"
      }`}
    >
      {item.label}
    </Link>
  );
}

function MenuChip({ item, pathname }) {
  const isActive = item.activePaths?.includes(pathname);

  return (
    <Link
      to={item.to}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
        isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
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

function SearchMiniIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M10.5 3a7.5 7.5 0 1 0 4.72 13.33l4.22 4.23 1.06-1.06-4.23-4.22A7.5 7.5 0 0 0 10.5 3Zm0 1.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z" />
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

function getInitial(name) {
  if (!name) {
    return "U";
  }

  return name.trim().charAt(0).toUpperCase();
}

export default Navbar;
