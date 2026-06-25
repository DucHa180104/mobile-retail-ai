import { Link } from "react-router-dom";

function ProductCard({ product, badge, isWishlisted = false, onToggleWishlist }) {
  const imageUrl =
    product.images?.[0] || "https://via.placeholder.com/400x320?text=Khong+co+anh";

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-100 hover:shadow-lg hover:shadow-slate-200/60">
      <div className="relative overflow-hidden rounded-xl bg-slate-50">
        {badge ? (
          <span
            className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${
              badge === "Nổi bật"
                ? "bg-gradient-to-r from-red-500 to-rose-500"
                : "bg-gradient-to-r from-blue-600 to-blue-500"
            }`}
          >
            {badge}
          </span>
        ) : null}

        {onToggleWishlist ? (
          <button
            type="button"
            onClick={() => onToggleWishlist(product)}
            className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-all duration-200 ${
              isWishlisted
                ? "text-red-500 shadow-red-100"
                : "text-slate-400 hover:text-red-500 hover:shadow-red-100"
            }`}
            aria-label={`${isWishlisted ? "Bỏ yêu thích" : "Thêm yêu thích"} ${product.name}`}
          >
            <HeartIcon isFilled={isWishlisted} />
          </button>
        ) : null}

        <Link to={`/products/${product._id}`} className="block">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      </div>

      <div className="pt-3">
        <Link to={`/products/${product._id}`}>
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-slate-900 transition-colors duration-150 hover:text-blue-700">
            {product.name}
          </h3>
        </Link>

        <p className="mt-2 text-lg font-black text-rose-500">
          {product.price?.toLocaleString("vi-VN")} đ
        </p>

        <div className="mt-3 flex items-center gap-2">
          <Link
            to={`/products/${product._id}`}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-center text-sm font-bold text-white shadow-sm shadow-blue-200 transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-300"
          >
            Mua ngay
          </Link>

          <Link
            to={`/products/${product._id}`}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            aria-label={`Chi tiết ${product.name}`}
          >
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}

function HeartIcon({ isFilled }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={isFilled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m12 20-1.4-1.3C5.4 14 2 10.9 2 7.2 2 4.4 4.2 2 7 2c1.6 0 3.2.7 4.2 1.9C12.8 2.7 14.4 2 16 2c2.8 0 5 2.4 5 5.2 0 3.7-3.4 6.8-8.6 11.5Z"
      />
    </svg>
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
