const categories = [
  { name: "iPhone", description: "iOS, camera đẹp", icon: <PhoneIcon /> },
  { name: "Samsung", description: "Màn hình đẹp", icon: <ScreenIcon /> },
  { name: "Oppo", description: "Selfie, sạc nhanh", icon: <CameraIcon /> },
  { name: "Xiaomi", description: "Cấu hình mạnh", icon: <ChipIcon /> },
  { name: "Phụ kiện", description: "Tai nghe, sạc, ốp", icon: <HeadphoneIcon /> }
];

function CategorySection({ activeCategory, onCategoryChange }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-950 tracking-tight">Khám phá danh mục</h2>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
        <button
          type="button"
          onClick={() => onCategoryChange("")}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 ${
            !activeCategory
              ? "border-slate-900 bg-slate-900 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-800"
          }`}
        >
          Tất cả đề xuất
        </button>
        {categories.map((category) => {
          const isActive = activeCategory === category.name;

          return (
            <button
              key={category.name}
              type="button"
              onClick={() => onCategoryChange(isActive ? "" : category.name)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 ${
                isActive
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-800"
              }`}
            >
              <span className={`h-3.5 w-3.5 flex items-center justify-center ${isActive ? "text-white" : "text-slate-400"}`}>
                {category.icon}
              </span>
              {category.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M10 5.5h4M11 18h2" strokeLinecap="round" />
    </svg>
  );
}

function ScreenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M4 8h4l2-3h4l2 3h4v11H4z" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="3" />
    </svg>
  );
}

function ChipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M4 9h3M4 15h3M17 9h3M17 15h3M9 4v3M15 4v3M9 17v3M15 17v3" strokeLinecap="round" />
    </svg>
  );
}

function HeadphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M4 13a8 8 0 0 1 16 0" strokeLinecap="round" />
      <path d="M6 13v4a2 2 0 0 0 2 2h1v-8H8a2 2 0 0 0-2 2Zm12-2h-1v8h1a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Z" />
    </svg>
  );
}

export default CategorySection;
