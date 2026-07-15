import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { resolveMediaUrl } from "../lib/api.js";

const menuItems = [
  { label: "Trang chủ", to: "/", activePaths: ["/"] },
  { label: "Điện thoại", to: "/phones", activePaths: ["/phones", "/products"] },
  { label: "Máy tính bảng", to: "/tablets", activePaths: ["/tablets"] },
  { label: "Phụ kiện", to: "/accessories", activePaths: ["/accessories"] },
  { label: "Thu cũ đổi mới", to: "/trade-in", activePaths: ["/trade-in"] },
  { label: "Liên hệ", to: "/contact", activePaths: ["/contact"] }
];

function Navbar({ searchValue, onSearchChange, totalItems }) {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartItems, removeFromCart } = useCart();
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white shadow-sm transition-all duration-300">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-4 py-3 lg:flex-nowrap">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-black text-white shadow-none transition-all duration-300">
              M
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-black tracking-tight text-slate-900 sm:text-lg">
                Mạnh Hương Mobile
              </p>
              <p className="-mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                AI Powered
              </p>
            </div>
          </Link>

          <div className="order-3 w-full lg:order-2 lg:mx-5 lg:flex-1">
            <label className="relative block">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400 transition-colors">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={searchValue}
                onChange={onSearchChange}
                placeholder="Tìm sản phẩm, thương hiệu..."
                className="w-full rounded-full border border-slate-200/80 bg-slate-50/50 py-2 pl-11 pr-4 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0"
              />
            </label>
          </div>

          <div className="order-2 ml-auto flex items-center gap-2 lg:order-3 lg:ml-0">
            <MiniCart totalItems={totalItems} cartItems={cartItems} onRemove={removeFromCart} />

            {isAuthenticated ? (
              <div className="hidden items-center gap-2 sm:flex">
                <AccountDropdown user={user} isAdmin={isAdmin} onLogout={logout} />
              </div>
            ) : (
              <div className="hidden items-center gap-1 sm:flex">
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2 text-xs font-bold text-slate-600 transition hover:text-slate-900"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 shadow-none"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>

        <nav className="hidden items-center gap-1.5 border-t border-slate-100/60 py-2.5 lg:flex">
          {menuItems.map((item) => (
            <MenuLink key={item.label} item={item} pathname={location.pathname} />
          ))}
        </nav>

        <div className="flex gap-2 overflow-x-auto border-t border-slate-100 pb-3 pt-3 lg:hidden">
          {menuItems.map((item) => (
            <MenuChip key={item.label} item={item} pathname={location.pathname} />
          ))}
          {isAuthenticated ? (
            <>
              <MenuChip item={{ label: "Hồ sơ", to: "/profile", activePaths: ["/profile"] }} pathname={location.pathname} />
              <MenuChip item={{ label: "Đơn hàng", to: "/my-orders", activePaths: ["/my-orders"] }} pathname={location.pathname} />
              {isAdmin ? (
                <MenuChip item={{ label: "Admin", to: "/admin/dashboard", activePaths: ["/admin/dashboard"] }} pathname={location.pathname} />
              ) : null}
              <button
                type="button"
                onClick={logout}
                className="whitespace-nowrap rounded-lg border border-rose-100 bg-rose-50 px-4 py-2 text-xs font-extrabold text-rose-600"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <MenuChip item={{ label: "Đăng nhập", to: "/login", activePaths: ["/login"] }} pathname={location.pathname} />
              <MenuChip item={{ label: "Đăng ký", to: "/register", activePaths: ["/register"] }} pathname={location.pathname} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function MiniCart({ totalItems, cartItems, onRemove }) {
  const previewItems = cartItems.slice(0, 3);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  return (
    <div className="group relative">
      <Link
        to="/cart"
        aria-label="Mở giỏ hàng"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-all duration-300 hover:bg-slate-100 hover:text-indigo-600"
      >
        <CartIcon />
        {totalItems > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white ring-2 ring-white animate-pulse">
            {totalItems}
          </span>
        ) : null}
      </Link>

      <div className="invisible absolute right-0 top-full z-50 w-[340px] pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="rounded-2xl border border-slate-200/60 bg-white/95 p-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <p className="font-black text-slate-950 text-sm">Giỏ hàng</p>
            <p className="text-xs text-slate-500">{totalItems} sản phẩm đang chọn</p>
          </div>
          <Link to="/cart" className="text-xs font-black text-indigo-600 hover:underline">
            Xem giỏ hàng
          </Link>
        </div>

        {previewItems.length === 0 ? (
          <div className="py-8 text-center">
            <p className="font-bold text-sm text-slate-700">Giỏ hàng đang trống</p>
            <p className="mt-1 text-xs text-slate-500">Chọn sản phẩm để bắt đầu đặt hàng.</p>
          </div>
        ) : (
          <div className="space-y-3 py-3">
            {previewItems.map((item) => (
              <MiniCartItem key={item._id} item={item} onRemove={onRemove} />
            ))}
            {cartItems.length > previewItems.length ? (
              <p className="text-center text-[11px] font-bold text-slate-400">
                Còn {cartItems.length - previewItems.length} sản phẩm khác trong giỏ
              </p>
            ) : null}
          </div>
        )}

        <div className="border-t border-slate-100/80 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-400 uppercase tracking-wider">Tạm tính</span>
            <span className="font-black text-sm text-rose-600">{totalPrice.toLocaleString("vi-VN")} đ</span>
          </div>
          <Link
            to="/checkout"
            className="mt-3 block rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-center text-xs font-black text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 hover:shadow-indigo-200/50 hover:shadow-md transition-all duration-300"
          >
            Thanh toán
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}

function MiniCartItem({ item, onRemove }) {
  const imageUrl =
    resolveMediaUrl(item.images?.[0]) ||
    "https://via.placeholder.com/80x80?text=Phone";

  return (
    <div className="grid grid-cols-[56px_1fr_auto] gap-3 items-center">
      <img src={imageUrl} alt={item.name} className="h-14 w-14 rounded-xl object-cover border border-slate-100" />
      <div className="min-w-0">
        <p className="line-clamp-1 text-xs font-black text-slate-900">{item.name}</p>
        <p className="mt-1 text-[11px] text-slate-500">
          SL: {item.quantity} × {Number(item.price || 0).toLocaleString("vi-VN")} đ
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(item._id)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 font-bold"
        aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
      >
        ×
      </button>
    </div>
  );
}

function AccountDropdown({ user, isAdmin, onLogout }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-white">
          {getInitial(user?.name)}
        </span>
        <span className="max-w-[120px] truncate font-bold text-slate-800">{user?.name}</span>
        <ChevronDownIcon />
      </summary>

      <div className="absolute right-0 top-[calc(100%+0.7rem)] z-50 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
        <div className="border-b border-slate-100 px-3 py-3">
          <p className="text-xs font-black text-slate-950">{user?.name}</p>
          <p className="text-[11px] text-slate-500 truncate">{user?.email || "Tài khoản người dùng"}</p>
        </div>
        <div className="mt-2 space-y-0.5">
          <DropdownLink to="/profile" label="Hồ sơ" />
          <DropdownLink to="/my-orders" label="Đơn hàng của tôi" />
          <DropdownLink to="/wishlist" label="Yêu thích" />
          {isAdmin ? <DropdownLink to="/admin/dashboard" label="Admin Dashboard" /> : null}
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-xs font-bold text-rose-600 transition hover:bg-rose-50"
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
    <Link to={to} className="flex items-center rounded-lg px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
      {label}
    </Link>
  );
}

function MenuLink({ item, pathname }) {
  const isActive = item.activePaths?.includes(pathname);

  return (
    <Link
      to={item.to}
      className={`px-3 py-1 text-xs font-bold transition-all duration-200 ${
        isActive
          ? "text-slate-950 font-black border-b-2 border-slate-950"
          : "text-slate-500 hover:text-slate-950"
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
      className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-extrabold transition-all duration-300 sm:text-sm ${
        isActive
          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-100"
          : "border border-slate-200/80 bg-white text-slate-600 hover:border-slate-300"
      }`}
    >
      {item.label}
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="m21 21-4.35-4.35" strokeLinecap="round" />
      <circle cx="11" cy="11" r="6" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M3 4h2l2.2 10.3a1 1 0 0 0 1 .7h9.9a1 1 0 0 0 1-.8L21 7H7.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-slate-400">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
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
