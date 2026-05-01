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

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const shippingFee = cartItems.length > 0 ? 0 : 0;
  const totalPrice = subtotal + shippingFee;

  if (cartItems.length === 0) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <CartIcon />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-900 sm:text-3xl">
              Giỏ hàng đang trống
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
              Bạn chưa có sản phẩm nào trong giỏ. Hãy quay lại trang chủ để tiếp tục mua sắm.
            </p>

            <Link
              to="/"
              className="mt-8 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Tiếp tục mua sắm
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Giỏ hàng của bạn
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Hiện có {cartItems.reduce((total, item) => total + item.quantity, 0)} sản phẩm trong giỏ hàng
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

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
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
                          {item.description || "Sản phẩm chính hãng, hỗ trợ bảo hành và giao hàng toàn quốc."}
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
            <section className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-24">
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">Tóm tắt đơn hàng</h2>

              <div className="mt-4 space-y-3">
                <SummaryRow label="Tạm tính" value={`${subtotal.toLocaleString("vi-VN")} đ`} />
                <SummaryRow label="Phí vận chuyển" value={shippingFee === 0 ? "Miễn phí" : `${shippingFee.toLocaleString("vi-VN")} đ`} />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Mã giảm giá
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-lg bg-blue-50 px-3.5 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                  Tổng cộng
                </p>
                <p className="mt-1 text-xl font-medium text-blue-700 sm:text-2xl">
                  {totalPrice.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <Link
                to={cartItems.length > 0 ? "/checkout" : "#"}
                className={`mt-5 block rounded-lg px-4 py-3 text-center text-sm font-semibold text-white transition ${
                  cartItems.length > 0
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "cursor-not-allowed bg-slate-300"
                }`}
              >
                Tiến hành thanh toán
              </Link>
            </section>

            <section className="space-y-3">
              <InfoCard
                icon={<ShieldIcon />}
                title="Thanh toán bảo mật"
                description="Hệ thống xác thực và lưu trữ an toàn cho mọi đơn hàng."
              />
              <InfoCard
                icon={<SupportIcon />}
                title="Hỗ trợ 24/7"
                description="Đội ngũ hỗ trợ luôn sẵn sàng tư vấn trong suốt quá trình mua hàng."
              />
            </section>
          </aside>
        </div>

        <section className="overflow-hidden rounded-[1.5rem] bg-[linear-gradient(135deg,#2563eb_0%,#1d4ed8_55%,#1e3a8a_100%)] px-6 py-7 text-white shadow-sm">
          <h2 className="text-xl font-black sm:text-2xl">Ưu đãi độc quyền!</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-50">
            Giảm thêm 5% khi mua kèm phụ kiện hoặc dán cường lực. Áp dụng cho khách hàng mua máy trong tuần này.
          </p>
        </section>
      </div>
    </main>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function InfoCard({ icon, title, description }) {
  return (
    <article className="rounded-[1rem] border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>
    </article>
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

function SupportIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 13a8 8 0 1 1 16 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 13v4a2 2 0 0 0 2 2h1v-8H8a2 2 0 0 0-2 2Zm12-2h-1v8h1a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Z" />
    </svg>
  );
}

export default CartPage;
