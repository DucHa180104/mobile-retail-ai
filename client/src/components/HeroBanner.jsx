import { Link } from "react-router-dom";

function HeroBanner({ featuredProduct }) {
  const detailLink = featuredProduct ? `/products/${featuredProduct._id}` : "/";
  const imageUrl =
    featuredProduct?.images?.[0] ||
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=80";

  return (
    <section className="grid gap-3 lg:grid-cols-[2.1fr_1fr]">
      <article className="relative overflow-hidden rounded-[1.5rem] bg-[linear-gradient(135deg,#2853f6_0%,#1736b8_58%,#0b1f71_100%)] px-7 py-8 text-white sm:px-8 sm:py-9">
        <img
          src={imageUrl}
          alt={featuredProduct?.name || "iPhone 15 Pro Max"}
          className="absolute right-0 top-0 h-full w-full object-cover opacity-20 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%)]" />

        <div className="relative max-w-lg">
          <span className="inline-flex rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
            Hot Deal
          </span>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-[3rem]">
            iPhone 15 Pro Max
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-blue-50">
            Thiết kế Titanium bền bỉ. Camera 48MP đỉnh cao. Mạnh mẽ vượt trội với chip A17 Pro.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#new-arrivals"
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
            >
              Mua ngay
            </a>
            <Link
              to={detailLink}
              className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Chi tiết
            </Link>
          </div>
        </div>
      </article>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <SidePromoCard
          title="Thu cũ đổi mới"
          description="Trợ giá lên đến 2.000.000đ. Thủ tục nhanh gọn trong ngày."
          accentClass="from-orange-700 to-amber-700"
          icon={<TradeIcon />}
          subtle={false}
        />
        <SidePromoCard
          title="Bảo hành tận tâm"
          description="12 tháng bảo hành chính hãng. Lỗi 1 đổi 1 trong 30 ngày đầu."
          accentClass="from-slate-100 to-slate-50"
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
  subtle = false
}) {
  return (
    <article
      className={`overflow-hidden rounded-[1.25rem] bg-gradient-to-br ${accentClass} px-5 py-5 shadow-sm`}
    >
      <div className={`flex h-full flex-col justify-between gap-4 ${textClass}`}>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
            subtle ? "bg-white text-slate-600" : "bg-white/15 text-white"
          }`}
        >
          {icon}
        </span>
        <div>
          <h2 className="text-[1.65rem] font-black leading-tight">{title}</h2>
          <p className={`mt-2 text-sm leading-6 ${subtle ? "text-slate-500" : "text-white/85"}`}>
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

function TradeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h7M7 17h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 5 2 2-2 2M12 15l-2 2 2 2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 5 6v6c0 4.3 2.9 7.8 7 9 4.1-1.2 7-4.7 7-9V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default HeroBanner;
