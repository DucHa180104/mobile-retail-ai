import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { resolveMediaUrl } from "../lib/api.js";

function ProductCard({ product, badge, isWishlisted = false, onToggleWishlist }) {
  const { addToCart } = useCart();
  const imageUrl =
    resolveMediaUrl(product.images?.[0]) ||
    "https://via.placeholder.com/420x360?text=Mobile+Retail+AI";
  const stock = Number(product.stock || 0);
  const conditionInfo = getConditionInfo(product.condition);
  const specs = getSpecLabels(product);

  const reviewCount = product.reviewCount || 0;
  const ratingVal = product.avgRating && product.avgRating > 0 ? Math.round(product.avgRating) : 5;
  const ratingText = product.avgRating && product.avgRating > 0 ? product.avgRating.toFixed(1) : "5.0";
  const originalPrice = product.price ? product.price + 1000000 : null;

  return (
    <article className="group flex flex-col bg-white">
      {/* Product Image and badges */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-50 border border-slate-100">
        <Link to={`/products/${product._id}`} className="block h-full w-full">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Hover Quick view overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10 pointer-events-none">
          <Link
            to={`/products/${product._id}`}
            className="rounded-full bg-white/90 backdrop-blur-sm px-4 py-1.5 text-[10px] font-extrabold text-slate-800 shadow-sm pointer-events-auto hover:bg-white transition"
          >
            Xem nhanh
          </Link>
        </div>

        {/* Top left badge */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-10">
          <span className="w-fit rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-sky-700 ring-1 ring-sky-100/50 backdrop-blur-sm">
            {badge || conditionInfo.label}
          </span>
        </div>

        {/* Wishlist button */}
        {onToggleWishlist ? (
          <button
            type="button"
            onClick={() => onToggleWishlist(product)}
            className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-110 hover:shadow-md z-10 ${
              isWishlisted ? "text-rose-500" : "text-slate-400 hover:text-rose-500"
            }`}
            aria-label={`${isWishlisted ? "Bỏ yêu thích" : "Thêm yêu thích"} ${product.name}`}
          >
            <HeartIcon isFilled={isWishlisted} />
          </button>
        ) : null}
      </div>

      {/* Info contents left-aligned */}
      <div className="flex flex-col pt-3 pb-1">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          {product.brand || "Mobile"}
        </span>

        <Link to={`/products/${product._id}`} className="mt-1 block">
          <h3 className="line-clamp-2 min-h-[36px] text-xs font-bold leading-normal text-slate-900 transition-colors duration-200 hover:text-slate-700">
            {product.name}
          </h3>
        </Link>

        {/* Rating stars & review count */}
        <div className="flex items-center gap-1 mt-1 text-[10px]">
          <span className="text-amber-400">{"★".repeat(ratingVal)}{"☆".repeat(5 - ratingVal)}</span>
          <span className="text-slate-400 font-bold">{ratingText} ({reviewCount})</span>
        </div>

        {/* Price & stock count */}
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-extrabold text-slate-900">
              {product.price?.toLocaleString("vi-VN")} đ
            </span>
            {originalPrice ? (
              <span className="text-[9px] text-slate-400 line-through">
                {originalPrice.toLocaleString("vi-VN")} đ
              </span>
            ) : null}
          </div>
          <span className={`text-[9px] font-bold ${stock > 0 ? "text-emerald-650 bg-emerald-50 px-2 py-0.5 rounded-md" : "text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md"}`}>
            {stock > 0 ? `Còn ${stock}` : "Hết hàng"}
          </span>
        </div>

        {/* Outlined Pill Add to Cart Button */}
        <button
          type="button"
          onClick={() => addToCart(product)}
          disabled={stock <= 0}
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white py-1.5 text-xs font-bold text-slate-800 transition duration-300 hover:border-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Thêm vào giỏ
        </button>
      </div>
    </article>
  );
}

function getConditionInfo(condition) {
  switch (condition) {
    case "used_99":
      return { label: "Cũ 99%", className: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 backdrop-blur-md" };
    case "used_good":
      return { label: "Cũ đẹp", className: "bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20 backdrop-blur-md" };
    case "used_fair":
      return { label: "Cũ dùng tốt", className: "bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20 backdrop-blur-md" };
    default:
      return { label: "Mới 100%", className: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 backdrop-blur-md" };
  }
}

function getSpecLabels(product) {
  const labels = [];

  if (product.specs?.storage) {
    labels.push(product.specs.storage);
  }

  if (product.specs?.ram) {
    labels.push(product.specs.ram);
  }

  if (product.usedDetails?.batteryHealth) {
    labels.push(`Pin ${product.usedDetails.batteryHealth}`);
  }

  if (labels.length === 0 && product.category) {
    labels.push(product.category);
  }

  return labels.slice(0, 3);
}

function HeartIcon({ isFilled }) {
  return (
    <svg viewBox="0 0 24 24" fill={isFilled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="m12 20-1.4-1.3C5.4 14 2 10.9 2 7.2 2 4.4 4.2 2 7 2c1.6 0 3.2.7 4.2 1.9C12.8 2.7 14.4 2 16 2c2.8 0 5 2.4 5 5.2 0 3.7-3.4 6.8-8.6 11.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default ProductCard;
