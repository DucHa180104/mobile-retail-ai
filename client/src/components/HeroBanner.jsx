import { useState } from "react";
import { Link } from "react-router-dom";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=80",
    eyebrow: "IPHONE 15 PRO",
    title: "Mạnh mẽ vượt trội. Thiết kế Titan siêu nhẹ.",
    link: "/phones"
  },
  {
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80",
    eyebrow: "IPAD & TABLETS",
    title: "Sáng tạo và làm việc di động không giới hạn.",
    link: "/tablets"
  },
  {
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    eyebrow: "PHỤ KIỆN XỊN",
    title: "Tai nghe, cáp sạc, ốp lưng chính hãng giá tốt.",
    link: "/accessories"
  }
];

function HeroBanner() {
  const [current, setCurrent] = useState(0);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-6">
      {/* Main Slider Banner */}
      <section className="relative h-[340px] sm:h-[420px] w-full overflow-hidden rounded-2xl bg-slate-900">
        {/* Slides list */}
        <div className="relative h-full w-full">
          {slides.map((slide, index) => {
            const isActive = index === current;
            return (
              <div
                key={index}
                className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ease-in-out ${
                  isActive ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="h-full w-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/30 to-transparent" />

                <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-16 text-white max-w-xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    {slide.eyebrow}
                  </span>
                  <h1 className="mt-4 text-2xl sm:text-4xl font-extrabold leading-tight text-white">
                    {slide.title}
                  </h1>
                  <div className="mt-6">
                    <Link
                      to={slide.link}
                      className="inline-block rounded-full bg-white px-6 py-2.5 text-xs font-black text-slate-950 hover:bg-slate-100 transition duration-300"
                    >
                      Mua ngay
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrow Navigation */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/40"
          aria-label="Slide trước"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/40"
          aria-label="Slide tiếp theo"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
            <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Indicator dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrent(index)}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === current ? "bg-white w-4" : "bg-white/40"
              }`}
              aria-label={`Đi tới slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Promo Row - 4 small cards below slider */}
      <PromoRow />
    </div>
  );
}

function PromoRow() {
  const promos = [
    {
      label: "Khuyến mãi Tết",
      icon: (
        <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100/50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ),
      to: "/phones"
    },
    {
      label: "Hàng mới về",
      icon: (
        <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100/50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <path d="M12 18h.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ),
      to: "/phones"
    },
    {
      label: "AI tư vấn chọn máy",
      icon: (
        <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100/50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
            <path d="M12 2a8 8 0 0 0-8 8v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H5a6 6 0 0 1 12 0h-2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a8 8 0 0 0-8-8z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 18v4M9 22h6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ),
      to: "/chatbot"
    },
    {
      label: "Thu cũ đổi mới",
      icon: (
        <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
            <path d="M17 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 23l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ),
      to: "/trade-in"
    }
  ];

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {promos.map((promo, index) => (
        <Link
          key={index}
          to={promo.to}
          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-2.5 hover:border-slate-300 hover:bg-white transition-all duration-300"
        >
          {promo.icon}
          <span className="text-xs font-bold text-slate-800 tracking-tight leading-tight">
            {promo.label}
          </span>
        </Link>
      ))}
    </section>
  );
}

export default HeroBanner;
