import { Link } from "react-router-dom";

function HeroBanner({ featuredProduct }) {
  const imageUrl =
    featuredProduct?.images?.[0] ||
    "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1400&q=80";

  const detailLink = featuredProduct ? `/products/${featuredProduct._id}` : "/";

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-slate-900">
      <img
        src={imageUrl}
        alt={featuredProduct?.name || "iPhone 15 Pro Max"}
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/50 to-transparent" />

      <div className="relative flex min-h-[360px] items-center px-8 py-12 sm:px-12">
        <div className="max-w-2xl text-white">
          <span className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
            San pham moi
          </span>

          <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
            iPhone 15 Pro Max
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
            Suc manh moi tu chip A17 Pro, camera dinh cao va khung titan sang
            trong danh cho nguoi dung yeu trai nghiem cao cap.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#new-arrivals"
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Mua ngay
            </a>
            <Link
              to={detailLink}
              className="rounded-xl bg-white/16 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/24"
            >
              Chi tiet
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroBanner;
