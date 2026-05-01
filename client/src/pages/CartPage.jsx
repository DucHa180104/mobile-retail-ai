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

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  if (cartItems.length === 0) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm sm:px-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <CartIcon />
            </div>

            <h1 className="mt-6 text-3xl font-black text-slate-900">
              Gio hang dang trong
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-500">
              Ban chua co san pham nao trong gio. Hay quay lai trang chu de
              tiep tuc kham pha cac mau dien thoai moi nhat.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/"
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Tiep tuc mua hang
              </Link>

              <Link
                to="/"
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
              >
                Xem san pham
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Gio hang
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
              San pham ban da chon
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Kiem tra lai don hang truoc khi tien hanh dat mua.
            </p>
          </div>

          <button
            type="button"
            onClick={clearCart}
            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            Xoa tat ca
          </button>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="space-y-4">
            {cartItems.map((item) => (
              <article
                key={item._id}
                className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="grid gap-5 md:grid-cols-[160px_1fr]">
                  <div className="overflow-hidden rounded-[1.5rem] bg-slate-100">
                    <img
                      src={item.images?.[0] || "https://via.placeholder.com/320x240?text=No+Image"}
                      alt={item.name}
                      className="h-40 w-full object-cover"
                    />
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-2xl">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                          San pham trong gio
                        </span>
                        <h2 className="mt-3 text-xl font-bold leading-8 text-slate-900">
                          {item.name}
                        </h2>
                        <p className="mt-3 text-sm text-slate-500">
                          Don gia:
                          <span className="ml-2 font-semibold text-slate-700">
                            {item.price?.toLocaleString("vi-VN")} VND
                          </span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item._id)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:text-red-600"
                      >
                        Xoa
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-4">
                      <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-white">
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(item._id)}
                          className="px-4 py-2 text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          -
                        </button>
                        <span className="min-w-14 px-4 py-2 text-center text-sm font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => increaseQuantity(item._id)}
                          className="px-4 py-2 text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Tam tinh
                        </p>
                        <p className="mt-2 text-2xl font-black text-blue-700">
                          {(item.price * item.quantity).toLocaleString("vi-VN")} VND
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 xl:sticky xl:top-28">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ReceiptIcon />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Tong don hang
                </h2>
                <p className="text-sm text-slate-500">
                  Xac nhan thong tin truoc khi thanh toan
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4 rounded-2xl bg-slate-50 p-5">
              <SummaryRow
                label="So san pham"
                value={`${cartItems.length} san pham`}
              />
              <SummaryRow
                label="Tong so luong"
                value={`${cartItems.reduce((total, item) => total + item.quantity, 0)} mon`}
              />
              <SummaryRow label="Tam tinh" value={`${totalPrice.toLocaleString("vi-VN")} VND`} />
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Tong thanh toan
                  </p>
                  <p className="mt-2 text-3xl font-black text-blue-700">
                    {totalPrice.toLocaleString("vi-VN")} VND
                  </p>
                </div>
              </div>

              <Link
                to="/checkout"
                className="mt-6 block rounded-xl bg-blue-600 px-5 py-3.5 text-center font-semibold text-white transition hover:bg-blue-700"
              >
                Tien hanh dat hang
              </Link>

              <Link
                to="/"
                className="mt-3 block rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-center font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
              >
                Tiep tuc mua hang
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
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

function ReceiptIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

export default CartPage;
