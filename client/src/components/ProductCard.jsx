import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../lib/api.js";

function ProductCard({ product, badge, isWishlisted = false, onToggleWishlist }) {
  const imageUrl =
    resolveMediaUrl(product.images?.[0]) ||
    "https://via.placeholder.com/400x320?text=Khong+co+anh";

  // Xác định nhãn tình trạng máy
  const getConditionInfo = (cond) => {
    switch (cond) {
      case "used_99":
        return { label: "Cũ 99%", class: "from-amber-500 to-orange-500 text-white" };
      case "used_good":
        return { label: "Cũ đẹp", class: "from-blue-500 to-indigo-500 text-white" };
      case "used_fair":
        return { label: "Cũ dùng tốt", class: "from-slate-500 to-slate-600 text-white" };
      default:
        return { label: "Mới 100%", class: "from-emerald-500 to-teal-500 text-white" };
    }
  };

  const condInfo = getConditionInfo(product.condition);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-100/30">
      {/* Media area */}
      <div className="relative overflow-hidden rounded-xl bg-slate-50 aspect-[4/3]">
        {/* Nhãn máy cũ/mới */}
        <span className={`absolute left-2.5 top-2.5 z-10 rounded-full bg-gradient-to-r px-2.5 py-1 text-[9px] font-black uppercase tracking-wider shadow-sm ${condInfo.class}`}>
          {condInfo.label}
        </span>

        {/* Nhãn bổ sung (nếu có từ danh sách) */}
        {badge && badge !== condInfo.label && (
          <span className="absolute left-2.5 top-9 z-10 rounded-full bg-gradient-to-r from-rose-500 to-red-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
            {badge}
          </span>
        )}

        {onToggleWishlist ? (
          <button
            type="button"
            onClick={() => onToggleWishlist(product)}
            className={`absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all duration-300 active:scale-95 ${
              isWishlisted
                ? "text-red-500 shadow-red-100"
                : "text-slate-400 hover:text-red-500 hover:shadow-red-100"
            }`}
            aria-label={`${isWishlisted ? "Bỏ yêu thích" : "Thêm yêu thích"} ${product.name}`}
          >
            <HeartIcon isFilled={isWishlisted} />
          </button>
        ) : null}

        <Link to={`/products/${product._id}`} className="block h-full w-full">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
      </div>

      {/* Content area */}
      <div className="pt-3 flex flex-col justify-between min-h-[160px]">
        <div>
          {/* Tags cấu hình nhanh */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {product.specs?.storage && (
              <span className="inline-flex items-center rounded-md bg-slate-50 border border-slate-100 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-500">
                💾 {product.specs.storage}
              </span>
            )}
            {product.usedDetails?.batteryHealth && (
              <span className="inline-flex items-center rounded-md bg-emerald-50/50 border border-emerald-100 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-600">
                🔋 Pin {product.usedDetails.batteryHealth}
              </span>
            )}
            {product.brand && (
              <span className="inline-flex items-center rounded-md bg-indigo-50/50 border border-indigo-100 px-1.5 py-0.5 text-[10px] font-extrabold text-indigo-600">
                {product.brand}
              </span>
            )}
          </div>

          <Link to={`/products/${product._id}`}>
            <h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-800 transition-colors duration-150 hover:text-indigo-600">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="mt-1.5 flex items-center gap-1">
            <div className="flex items-center text-amber-400">
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon className="h-3 w-3 fill-current text-slate-200" />
            </div>
            <span className="text-[11px] font-bold text-slate-400">4.0 (24)</span>
          </div>
        </div>

        <div>
          {/* Price */}
          <p className="mt-2.5 text-base sm:text-lg font-black text-rose-500">
            {product.price?.toLocaleString("vi-VN")} đ
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Link
              to={`/products/${product._id}`}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-center text-xs font-bold text-white shadow-sm shadow-indigo-100 transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md hover:shadow-indigo-200/50 active:scale-95"
            >
              Xem chi tiết
            </Link>

            <Link
              to={`/products/${product._id}`}
              className="rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-500 transition-all duration-300 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95"
              aria-label={`Chi tiết ${product.name}`}
            >
              <ArrowIcon />
            </Link>
          </div>
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

function StarIcon({ className = "h-3 w-3 fill-current" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      className={className}
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default ProductCard;
