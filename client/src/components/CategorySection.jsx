const categories = [
  { name: "iPhone", icon: <PhoneIcon /> },
  { name: "Samsung", icon: <PhoneIcon /> },
  { name: "Oppo", icon: <PhoneIcon /> },
  { name: "Xiaomi", icon: <PhoneIcon /> },
  { name: "Phụ kiện", icon: <HeadphoneIcon /> }
];

function CategorySection({ activeCategory, onCategoryChange }) {
  return (
    <section className="space-y-4">
      <SectionTitle title="Danh mục nổi bật" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((category) => {
          const isActive = activeCategory === category.name;

          return (
            <button
              key={category.name}
              type="button"
              onClick={() => onCategoryChange(isActive ? "" : category.name)}
              className={`rounded-[1.35rem] border px-4 py-5 text-center transition ${
                isActive
                  ? "border-blue-200 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-sm"
              }`}
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                {category.icon}
              </span>
              <span className="mt-3 block text-sm font-bold text-slate-800">
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-black text-slate-900 sm:text-[1.75rem]">{title}</h2>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path strokeLinecap="round" d="M10 5.5h4" />
      <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HeadphoneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 13a8 8 0 0 1 16 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 13v4a2 2 0 0 0 2 2h1v-8H8a2 2 0 0 0-2 2Zm12-2h-1v8h1a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Z" />
    </svg>
  );
}

export default CategorySection;
