import { Link } from "react-router-dom";

function ProductCard({ product, badge, rating, onAddToCart }) {
  const imageUrl =
    product.images?.[0] ||
    "https://via.placeholder.com/400x300?text=No+Image";

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative overflow-hidden rounded-2xl bg-slate-100">
        <span className="absolute left-3 top-3 z-10 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
          {badge}
        </span>

        <Link to={`/products/${product._id}`} className="block">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-52 w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </Link>
      </div>

      <div className="px-1 pt-4">
        <Link to={`/products/${product._id}`}>
          <h3 className="line-clamp-2 min-h-[56px] text-base font-bold text-slate-900 transition hover:text-blue-700">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <div className="flex items-center gap-1 text-amber-400">
            <StarIcon />
            <StarIcon />
            <StarIcon />
            <StarIcon />
            <StarIcon className="opacity-50" />
          </div>
          <span>{rating}</span>
        </div>

        <p className="mt-4 text-2xl font-extrabold text-blue-700">
          {product.price?.toLocaleString("vi-VN")} VND
        </p>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Them vao gio
          </button>

          <Link
            to={`/products/${product._id}`}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Chi tiet
          </Link>
        </div>
      </div>
    </article>
  );
}

function StarIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`h-4 w-4 ${className}`}
    >
      <path d="M12 2 9.2 8.6 2 9.3l5.4 4.7L5.8 21 12 17.3 18.2 21l-1.6-7 5.4-4.7-7.2-.7z" />
    </svg>
  );
}

export default ProductCard;
