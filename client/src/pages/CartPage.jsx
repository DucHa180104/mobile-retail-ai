import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

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
      <main className="px-4 py-6 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm sm:px-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-500">
              <CartIcon />
            </div>

            <h1 className="mt-6 text-2xl font-black text-slate-900 sm:text-3xl">
              Giỏ hàng đang trống
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-500">
              Bạn chưa có sản phẩm nào trong giỏ. Hãy quay lại trang chủ để tiếp tục mua sắm.
            </p>

            <Link
              to="/"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-sm shadow-blue-200 transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-300"
            >
              Tiếp tục mua sắm
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-6 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1120px] space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Giỏ hàng của bạn</h1>
            <p className="mt-2 text-sm text-slate-500">
              Hiện có {cartItems.reduce((total, item) => total + item.quantity, 0)} sản phẩm trong
              giỏ hàng
            </p>
          </div>

          <button
            type="button"
            onClick={clearCart}
            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            Xóa tất cả
          </button>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-4">
            {cartItems.map((item) => (
              <article
                key={item._id}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="grid gap-4 md:grid-cols-[104px_1fr]">
                  <div className="overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={item.images?.[0] || "https://via.placeholder.com/320x240?text=Khong+co+anh"}
                      alt={item.name}
                      className="h-24 w-full object-cover md:h-28"
                    />
                  </div>

                  <div className="flex flex-col justify-between gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-xl">
                        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                          {item.name}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {item.description ||
                            "Sản phẩm chính hãng, hỗ trợ bảo hành và giao hàng toàn quốc."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item._id)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:text-red-600"
                      >
                        Xóa
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <p className="text-xl font-black text-red-500 sm:text-2xl">
                        {item.price?.toLocaleString("vi-VN")} đ
                      </p>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => decreaseQuantity(item._id)}
                            className="px-3 py-2 text-base font-semibold text-slate-700 transition hover:bg-white"
                          >
                            -
                          </button>
                          <span className="min-w-10 px-3 text-center text-sm font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => increaseQuantity(item._id)}
                            className="px-3 py-2 text-base font-semibold text-slate-700 transition hover:bg-white"
                          >
                            +
                          </button>
                        </div>

                        <p className="text-sm font-semibold text-slate-500">
                          Thành tiền:
                          <span className="ml-2 text-base font-bold text-slate-900">
                            {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            >
              <ArrowLeftIcon />
              Tiếp tục mua sắm
            </Link>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-24">
              <h2 className="text-base font-black text-slate-900">Tóm tắt đơn hàng</h2>

              <div className="mt-4 space-y-3">
                <SummaryRow label="Tạm tính" value={`${subtotal.toLocaleString("vi-VN")} đ`} />
                <SummaryRow label="Phí vận chuyển" value="Miễn phí" valueClass="text-emerald-600 font-semibold" />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Mã giảm giá
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Tổng cộng</p>
                <p className="mt-1 text-2xl font-black text-blue-700">
                  {totalPrice.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <Link
                to={cartItems.length > 0 ? "/checkout" : "#"}
                className={`mt-5 block rounded-xl px-4 py-3.5 text-center text-sm font-bold text-white transition-all duration-200 ${
                  cartItems.length > 0
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-sm shadow-blue-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-300"
                    : "cursor-not-allowed bg-slate-300"
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
