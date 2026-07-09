import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { resolveMediaUrl } from "../lib/api.js";

function CartPage() {
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart
  } = useCart();

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const shippingFee = 0;
  const totalPrice = subtotal + shippingFee;

  if (cartItems.length === 0) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        <div className="mx-auto max-w-3xl">
          <section className="rounded-[2rem] border border-slate-100 bg-white px-6 py-16 text-center shadow-sm sm:px-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <CartIcon />
            </div>

            <h1 className="mt-6 text-2xl font-black text-slate-800 sm:text-3xl">
              Giỏ hàng của bạn đang trống
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-xs sm:text-sm leading-relaxed text-slate-400 font-medium">
              Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy quay lại cửa hàng để tiếp tục tìm kiếm sản phẩm ưng ý nhé.
            </p>

            <Link
              to="/"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-indigo-100 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Tiếp tục mua sắm
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <div className="mx-auto max-w-[1120px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 sm:text-3xl">Giỏ hàng của bạn</h1>
            <p className="mt-1 text-xs sm:text-sm font-bold text-slate-400">
              Đang có <span className="text-indigo-650 font-extrabold">{cartItems.reduce((total, item) => total + item.quantity, 0)}</span> sản phẩm trong giỏ hàng
            </p>
          </div>

          <button
            type="button"
            onClick={clearCart}
            className="rounded-xl border border-rose-100 bg-rose-50 px-4.5 py-2 text-xs font-black uppercase tracking-wider text-rose-600 transition-all duration-300 hover:bg-rose-100/60 active:scale-95"
          >
            Xóa toàn bộ
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="space-y-4">
            {cartItems.map((item) => (
              <article
                key={item._id}
                className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:border-indigo-100 hover:shadow-md sm:p-5"
              >
                <div className="grid gap-4 sm:grid-cols-[112px_1fr]">
                  <div className="overflow-hidden rounded-xl border border-slate-50 bg-slate-50 aspect-[4/3] flex items-center justify-center sm:h-28 sm:w-28">
                    <img
                      src={
                        resolveMediaUrl(item.images?.[0]) ||
                        "https://via.placeholder.com/320x240?text=Khong+co+anh"
                      }
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex flex-col justify-between gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-md">
                        <h2 className="text-sm sm:text-base font-bold text-slate-800 transition-colors duration-150 group-hover:text-indigo-650">
                          {item.name}
                        </h2>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-400 font-bold">
                          {item.brand ? `Thương hiệu: ${item.brand}` : "Sản phẩm chính hãng"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item._id)}
                        className="rounded-xl border border-slate-200/80 hover:border-rose-200 hover:bg-rose-50 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-rose-600 transition-all duration-300"
                      >
                        Xóa
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-50 pt-3">
                      <p className="text-lg font-black text-rose-500">
                        {item.price?.toLocaleString("vi-VN")} đ
                      </p>

                      <div className="flex items-center gap-4">
                        <div className="flex h-9 items-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                          <button
                            type="button; button"
                            onClick={() => decreaseQuantity(item._id)}
                            className="h-full px-3 text-sm font-black text-slate-400 transition-all hover:bg-white hover:text-slate-800"
                          >
                            -
                          </button>
                          <span className="flex h-full min-w-9 items-center justify-center bg-white px-2 text-xs font-black text-slate-800 border-x border-slate-100">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => increaseQuantity(item._id)}
                            className="h-full px-3 text-sm font-black text-slate-400 transition-all hover:bg-white hover:text-slate-800"
                          >
                            +
                          </button>
                        </div>

                        <p className="text-xs font-bold text-slate-400">
                          Thành tiền:
                          <span className="ml-2 text-sm font-black text-slate-800">
                            {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-650 transition-colors duration-300 hover:text-indigo-850"
              >
                <ArrowLeftIcon />
                Tiếp tục tìm kiếm máy khác
              </Link>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-base font-black text-slate-800">Tóm tắt đơn hàng</h2>

              <div className="mt-4 space-y-3.5">
                <SummaryRow label="Tạm tính" value={`${subtotal.toLocaleString("vi-VN")} đ`} />
                <SummaryRow label="Phí vận chuyển" value="Miễn phí" valueClass="text-emerald-600 font-bold text-xs uppercase tracking-wider" />
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Mã giảm giá / Voucher
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="MÃ GIẢM GIÁ..."
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs font-bold uppercase outline-none transition-all duration-300 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 px-4.5 py-2.5 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-300 active:scale-95"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-950 border border-slate-900 px-5 py-5 text-white shadow-md">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Tổng thanh toán</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {totalPrice.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <Link
                to={cartItems.length > 0 ? "/checkout" : "#"}
                className={`mt-5 block rounded-xl py-4 text-center text-xs font-black uppercase tracking-wider text-white transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-98 ${
                  cartItems.length > 0
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-750 hover:to-indigo-750 shadow-md shadow-indigo-100"
                    : "cursor-not-allowed bg-slate-200 border border-slate-350"
                }`}
              >
                Tiến hành thanh toán
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SummaryRow({ label, value, valueClass = "font-medium text-slate-900" }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-8 w-8"
    >
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4h2l2.2 10.3a1 1 0 0 0 1 .7h9.9a1 1 0 0 0 1-.8L21 7H7.1"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export default CartPage;
