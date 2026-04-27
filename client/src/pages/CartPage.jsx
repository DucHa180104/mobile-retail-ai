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
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Gio hang</h1>
          <p className="mt-6 text-gray-600">Gio hang dang trong</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Gio hang</h1>
            <button
              type="button"
              onClick={clearCart}
              className="rounded bg-red-100 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-200"
            >
              Xoa tat ca
            </button>
          </div>

          <div className="mt-8 space-y-4">
            {cartItems.map((item) => (
              <article
                key={item._id}
                className="grid gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-[120px_1fr]"
              >
                <img
                  src={item.images?.[0] || "https://via.placeholder.com/240x180?text=No+Image"}
                  alt={item.name}
                  className="h-28 w-full rounded-lg object-cover"
                />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {item.name}
                    </h2>
                    <p className="mt-2 text-blue-600">
                      {item.price?.toLocaleString("vi-VN")} VND
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center overflow-hidden rounded border border-gray-300">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(item._id)}
                        className="px-3 py-2 text-lg text-gray-700 transition hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="min-w-12 px-4 py-2 text-center font-medium text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => increaseQuantity(item._id)}
                        className="px-3 py-2 text-lg text-gray-700 transition hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item._id)}
                      className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                    >
                      Xoa
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between gap-4">
              <span className="text-lg font-semibold text-gray-900">
                Tong tien
              </span>
              <span className="text-2xl font-bold text-blue-600">
                {totalPrice.toLocaleString("vi-VN")} VND
              </span>
            </div>

            <Link
              to="/checkout"
              className="mt-6 inline-block rounded bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              Tien hanh dat hang
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default CartPage;
