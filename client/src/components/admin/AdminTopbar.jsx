import { Link } from "react-router-dom";

function AdminTopbar() {
  return (
    <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full max-w-xl">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm hệ thống..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </label>

        <div className="flex items-center gap-4 text-sm text-slate-500">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <BackIcon />
            <span>Về trang khách</span>
          </Link>

          <button type="button" className="font-medium transition hover:text-slate-800">
            Thông báo
          </button>
          <button type="button" className="font-medium transition hover:text-slate-800">
                  Trợ giúp
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700">
              A
            </span>
            <div>
              <p className="font-semibold text-slate-900">Quản trị viên</p>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Quản trị hệ thống</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function BackIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="m21 21-4.35-4.35" />
      <circle cx="11" cy="11" r="6" />
    </svg>
  );
}

export default AdminTopbar;
