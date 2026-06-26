import { Link } from "react-router-dom";

function HeroBanner({ featuredProduct }) {
  const detailLink = featuredProduct ? `/products/${featuredProduct._id}` : "/";
  const imageUrl =
    featuredProduct?.images?.[0] ||
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=80";

  return (
    <section className="grid gap-3 lg:grid-cols-[2fr_0.95fr]">
      {/* Main hero card */}
      <article className="relative overflow-hidden rounded-[2rem] bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-950 px-8 py-9 text-white shadow-xl shadow-indigo-950/20 sm:px-10 sm:py-12 animate-fade-in border border-slate-800">
        {/* Background image */}
        <img
          src={imageUrl}
          alt={featuredProduct?.name || "iPhone cũ"}
          className="absolute right-0 top-0 h-full w-full object-cover opacity-20 mix-blend-screen transition-transform duration-1000 group-hover:scale-105"
        />
        {/* Decorative gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-sm animate-fade-in-up">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Nổi bật hôm nay
          </span>
          <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-[2.75rem] sm:leading-[1.1] animate-fade-in-up animation-delay-75">
            {featuredProduct?.name || "Điện thoại cũ giá tốt"}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300 animate-fade-in-up animation-delay-100">
            Máy đẹp likenew, nguyên zin, kiểm định nghiêm ngặt qua 30 bước. Cam kết giá tốt nhất thị trường cùng chính sách bảo hành minh bạch.
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5 animate-fade-in-up animation-delay-150">
            <a
              href="#new-arrivals"
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-md transition-all duration-300 hover:bg-slate-50 hover:scale-105 active:scale-95"
            >
              Xem máy ngay
            </a>
            <Link
              to={detailLink}
              className="rounded-xl border border-slate-700 bg-slate-800/40 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:bg-slate-800/60 hover:scale-105 active:scale-95"
            >
              Xem chi tiết
            </Link>
          </div>

          {featuredProduct?.price ? (
            <p className="mt-6 text-sm font-bold text-slate-400 animate-fade-in-up animation-delay-200">
              Đồng giá cực tốt chỉ từ{" "}
              <span className="text-2xl font-black text-rose-500 ml-1">
                {featuredProduct.price.toLocaleString("vi-VN")} đ
              </span>
            </p>
          ) : null}
        </div>
      </article>

      {/* Side cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div className="animate-slide-in-right animation-delay-100">
          <SidePromoCard
            title="Thu cũ đổi mới"
            description="Định giá nhanh 5 phút, trợ giá lên đời đến 99% giá trị máy."
            accentClass="from-indigo-600 via-indigo-700 to-blue-700"
            icon={<TradeIcon />}
            to="/trade-in"
          />
        </div>
        <div className="animate-slide-in-right animation-delay-200">
          <SidePromoCard
            title="Bảo hành minh bạch"
            description="Bao test 1 đổi 1 trong 30 ngày. Bảo hành phần cứng lên tới 12 tháng."
            accentClass="from-white to-white"
            textClass="text-slate-800"
            icon={<ShieldIcon />}
            subtle
            to="/phones"
          />
        </div>
      </div>
    </section>
  );
}

function SidePromoCard({
  title,
  description,
  icon,
  accentClass,
  textClass = "text-white",
  subtle = false,
  to = "/"
}) {
  return (
    <Link
      to={to}
      className={`group block overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${accentClass} px-6 py-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 border ${
        subtle ? "border-slate-100" : "border-transparent"
      }`}
    >
      <div className={`flex h-full flex-col justify-between gap-5 ${textClass}`}>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
            subtle ? "bg-indigo-50 text-indigo-600 shadow-sm" : "bg-white/15 text-white"
          }`}
        >
          {icon}
        </span>
        <div>
          <h2 className="text-lg font-black leading-tight">{title}</h2>
          <p className={`mt-1.5 text-xs leading-relaxed ${subtle ? "text-slate-500" : "text-white/80"}`}>
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

function TradeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h7M7 17h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 5 2 2-2 2M12 15l-2 2 2 2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 5 6v6c0 4.3 2.9 7.8 7 9 4.1-1.2 7-4.7 7-9V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default HeroBanner;
