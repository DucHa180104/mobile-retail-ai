const categories = [
  {
    name: "iPhone",
    icon: <AppleIcon />,
    bg: "bg-slate-50",
    text: "text-slate-700",
    activeBg: "from-slate-800 to-slate-950",
    ring: "ring-slate-900/20"
  },
  {
    name: "Samsung",
    icon: <SamsungIcon />,
    bg: "bg-blue-50/50",
    text: "text-blue-600",
    activeBg: "from-blue-600 to-indigo-600",
    ring: "ring-indigo-600/20"
  },
  {
    name: "Oppo",
    icon: <OppoIcon />,
    bg: "bg-emerald-50/50",
    text: "text-emerald-600",
    activeBg: "from-emerald-500 to-teal-600",
    ring: "ring-emerald-600/20"
  },
  {
    name: "Xiaomi",
    icon: <XiaomiIcon />,
    bg: "bg-orange-50/50",
    text: "text-orange-500",
    activeBg: "from-orange-500 to-amber-500",
    ring: "ring-orange-600/20"
  },
  {
    name: "Phụ kiện",
    icon: <HeadphoneIcon />,
    bg: "bg-violet-50/50",
    text: "text-violet-600",
    activeBg: "from-violet-600 to-fuchsia-600",
    ring: "ring-violet-600/20"
  }
];

function CategorySection({ activeCategory, onCategoryChange }) {
  return (
    <section className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-850 sm:text-[1.45rem]">Danh mục nổi bật</h2>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((category, index) => {
          const isActive = activeCategory === category.name;

          return (
            <button
              key={category.name}
              type="button"
              onClick={() => onCategoryChange(isActive ? "" : category.name)}
              style={{ animationDelay: `${index * 60}ms` }}
              className={`group animate-fade-in rounded-2xl border px-4 py-4 text-center transition-all duration-300 ${
                isActive
                  ? `border-transparent bg-gradient-to-tr ${category.activeBg} shadow-lg ring-4 ${category.ring}`
                  : "border-slate-100 bg-white hover:-translate-y-1 hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-500/5"
              }`}
            >
              <span
                className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 ${
                  isActive ? "bg-white/20 text-white" : `${category.bg} ${category.text}`
                }`}
              >
                {category.icon}
              </span>
              <span
                className={`mt-3 block text-sm font-bold transition-colors duration-300 ${
                  isActive ? "text-white" : "text-slate-700 group-hover:text-indigo-650"
                }`}
              >
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AppleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function SamsungIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path strokeLinecap="round" d="M10 5.5h4" />
      <circle cx="12" cy="18.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function OppoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function XiaomiIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M5 5h6v14H5zM13 5h6v6h-6zM13 13h6v6h-6z" />
    </svg>
  );
}

function HeadphoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 13a8 8 0 0 1 16 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 13v4a2 2 0 0 0 2 2h1v-8H8a2 2 0 0 0-2 2Zm12-2h-1v8h1a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Z" />
    </svg>
  );
}

export default CategorySection;
