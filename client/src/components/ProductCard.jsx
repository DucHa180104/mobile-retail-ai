import { Link } from "react-router-dom";

function ProductCard({ product, badge, onAddToCart }) {
  const imageUrl =
    product.images?.[0] || "https://via.placeholder.com/400x320?text=Khong+co+anh";

  return (
    <article className="group overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative overflow-hidden rounded-[1rem] bg-slate-100">
        {badge && (
          <span
            className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase text-white shadow-sm ${
              badge === "Nổi bật" ? "bg-red-500" : "bg-blue-600"
            }`}
          >
            {badge}
          </span>
        )}

        <Link to={`/products/${product._id}`} className="block">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-44 w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </Link>
      </div>

      <div className="pt-3">
        <Link to={`/products/${product._id}`}>
          <h3 className="line-clamp-2 min-h-[42px] text-sm font-bold leading-5 text-slate-900 transition hover:text-blue-700">
            {product.name}
          </h3>
        </Link>

        <p className="mt-2 text-lg font-black text-red-500">
          {product.price?.toLocaleString("vi-VN")} đ
        </p>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Mua ngay
          </button>

          <Link
            to={`/products/${product._id}`}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            aria-label={`Chi tiết ${product.name}`}
          >
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}

function ArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

export default ProductCard;
