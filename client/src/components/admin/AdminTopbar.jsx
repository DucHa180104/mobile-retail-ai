function AdminTopbar() {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full max-w-xl">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search kiếm hệ thống..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </label>

        <div className="flex items-center gap-4 text-sm text-slate-500">
          <button type="button" className="font-medium transition hover:text-slate-800">
            notification
          </button>
          <button type="button" className="font-medium transition hover:text-slate-800">
            help
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700">
              A
            </span>
            <div>
              <p className="font-semibold text-slate-900">Admin User</p>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Super Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
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
