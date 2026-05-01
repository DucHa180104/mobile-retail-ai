const categories = [
  { name: "iPhone", icon: "A" },
  { name: "Samsung", icon: "S" },
  { name: "Oppo", icon: "O" },
  { name: "Xiaomi", icon: "X" },
  { name: "Phu kien", icon: "P" }
];

function CategorySection({ activeCategory, onCategoryChange }) {
  return (
    <section>
      <SectionTitle title="Danh muc noi bat" />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((category) => {
          const isActive = activeCategory === category.name;

          return (
            <button
              key={category.name}
              type="button"
              onClick={() => onCategoryChange(category.name)}
              className={`rounded-2xl border px-4 py-6 text-center transition ${
                isActive
                  ? "border-blue-200 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-sm"
              }`}
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-700">
                {category.icon}
              </span>
              <span className="mt-4 block text-sm font-semibold text-slate-800">
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
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path d="M12 2 9.2 8.6 2 9.3l5.4 4.7L5.8 21 12 17.3 18.2 21l-1.6-7 5.4-4.7-7.2-.7z" />
        </svg>
      </span>
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
    </div>
  );
}

export default CategorySection;
