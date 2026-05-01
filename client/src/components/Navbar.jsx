import { Link } from "react-router-dom";

const menuItems = ["iPhone", "Samsung", "Oppo", "Xiaomi", "Phu kien"];

function Navbar({
  searchValue,
  onSearchChange,
  totalItems,
  activeCategory,
  onCategoryChange
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 text-lg font-extrabold text-blue-700"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm text-white">
            M
          </span>
          <span>Manh Huong</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {menuItems.map((item) => {
            const isActive = activeCategory === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => onCategoryChange(item)}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item}
              </button>
            );
          })}
        </nav>

        <div className="relative ml-auto hidden flex-1 lg:block">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Tim kiem san pham..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </div>

        <Link
          to="/cart"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
        >
          <CartIcon />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-bold text-white">
              {totalItems}
            </span>
          )}
        </Link>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 pb-4 lg:hidden sm:px-6 lg:px-8">
        {menuItems.map((item) => {
          const isActive = activeCategory === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onCategoryChange(item)}
              className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <div className="mx-auto px-4 pb-4 lg:hidden sm:px-6 lg:px-8">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Tim kiem san pham..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>
    </header>
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

export default Navbar;
