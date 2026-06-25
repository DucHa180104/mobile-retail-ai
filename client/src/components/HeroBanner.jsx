import { Link } from "react-router-dom";

function HeroBanner({ featuredProduct }) {
  const detailLink = featuredProduct ? `/products/${featuredProduct._id}` : "/";
  const imageUrl =
    featuredProduct?.images?.[0] ||
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=80";

  return (
    <section className="grid animate-fade-in gap-3 lg:grid-cols-[2fr_0.95fr]">
      {/* Main hero card */}
      <article className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#1d4ed8_0%,#1e40af_50%,#1e3a8a_100%)] px-7 py-8 text-white shadow-lg shadow-blue-900/20 sm:px-8 sm:py-9">
        {/* Background image */}
        <img
          src={imageUrl}
          alt={featuredProduct?.name || "iPhone cũ"}
          className="absolute right-0 top-0 h-full w-full object-cover opacity-15 mix-blend-screen"
        />
        {/* Decorative gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.15),transparent_40%)]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-300" />
            Nổi bật
          </span>
          <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight sm:text-[2.5rem] sm:leading-[1.15]">
            {featuredProduct?.name || "Điện thoại cũ giá tốt"}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-blue-100/90">
            Máy đẹp, giá thật, mô tả đúng tình trạng thực tế. Kiểm tra kỹ ngoại hình,
            pin và chức năng trước khi chốt đơn.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#new-arrivals"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-blue-700 shadow-sm transition-all duration-200 hover:bg-blue-50 hover:shadow-md"
            >
              Xem máy ngay
            </a>
            <Link
              to={detailLink}
              className="rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
            >
              Xem chi tiết
            </Link>
          </div>

          {featuredProduct?.price ? (
            <p className="mt-5 text-sm font-semibold text-blue-200">
              Chỉ từ{" "}
              <span className="text-xl font-black text-white">
                {featuredProduct.price.toLocaleString("vi-VN")} đ
              </span>
            </p>
          ) : null}
        </div>
      </article>

      {/* Side cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <SidePromoCard
          title="Thu cũ đổi mới"
          description="Định giá nhanh, hỗ trợ lên đời máy gọn và rõ ràng."
          accentClass="from-orange-600 to-amber-600"
          icon={<TradeIcon />}
          subtle={false}
          href="/trade-in"
        />
        <SidePromoCard
          title="Bảo hành minh bạch"
          description="Cam kết thông tin rõ ràng, hỗ trợ kiểm tra và bảo hành tận tâm."
          accentClass="from-slate-50 to-slate-100"
          textClass="text-slate-800"
          icon={<ShieldIcon />}
          subtle
        />
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
  href = "/"
}) {
  return (
    <article
      className={`group overflow-hidden rounded-2xl bg-gradient-to-br ${accentClass} px-5 py-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className={`flex h-full flex-col justify-between gap-4 ${textClass}`}>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${
            subtle ? "bg-white text-slate-600 shadow-sm" : "bg-white/15 text-white"
          }`}
        >
          {icon}
        </span>
        <div>
          <h2 className="text-[1.3rem] font-black leading-tight">{title}</h2>
          <p className={`mt-2 text-sm leading-6 ${subtle ? "text-slate-500" : "text-white/80"}`}>
            {description}
          </p>
        </div>
      </div>
    </article>
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
