import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    address: "",
    note: ""
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const orderData = {
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        note: formData.note,
        items: cartItems.map((item) => ({
          productId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.images?.[0] || ""
        })),
        totalAmount: totalPrice
      };

      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Dat hang that bai");
      }

      clearCart();
      navigate("/order-success");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (cartItems.length === 0) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm sm:px-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <CheckoutIcon />
            </div>

            <h1 className="mt-6 text-3xl font-black text-slate-900">
              Chua the thanh toan
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-500">
              Gio hang cua ban dang trong. Hay quay lai trang chu de tiep tuc
              lua chon san pham truoc khi dat hang.
            </p>

            <Link
              to="/"
              className="mt-8 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Quay lai mua hang
            </Link>
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
              Checkout
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
              Thong tin dat hang
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Dien thong tin nguoi nhan va kiem tra lai don hang cua ban.
            </p>
          </div>

          <Link
            to="/cart"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            Quay lai gio hang
          </Link>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <UserIcon />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Thong tin khach hang
                </h2>
                <p className="text-sm text-slate-500">
                  Cua hang se lien he xac nhan don hang voi thong tin nay
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <FormField
                label="Ho va ten"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
              />
              <FormField
                label="So dien thoai"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
              <FormField
                label="Dia chi"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ghi chu
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  rows="4"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  placeholder="Vi du: giao gio hanh chinh, goi truoc khi giao..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting || cartItems.length === 0}
                className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {submitting ? "Dang dat hang..." : "Dat hang"}
              </button>
            </form>
          </section>

          <section className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 xl:sticky xl:top-28">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ReceiptIcon />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Tom tat don hang
                </h2>
                <p className="text-sm text-slate-500">
                  {cartItems.length} san pham dang cho thanh toan
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {cartItems.map((item) => (
                <article
                  key={item._id}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <img
                    src={item.images?.[0] || "https://via.placeholder.com/240x180?text=No+Image"}
                    alt={item.name}
                    className="h-20 w-20 rounded-xl object-cover"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      So luong: {item.quantity}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      Don gia: {item.price?.toLocaleString("vi-VN")} VND
                    </p>
                    <p className="mt-2 text-lg font-bold text-blue-700">
                      {(item.price * item.quantity).toLocaleString("vi-VN")} VND
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <SummaryRow
                label="Tong so luong"
                value={`${cartItems.reduce((total, item) => total + item.quantity, 0)} mon`}
              />
              <SummaryRow
                label="Phi van chuyen"
                value="Se tinh khi xac nhan"
              />
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Tong thanh toan
                  </p>
                </div>
                <span className="text-3xl font-black text-blue-700">
                  {totalPrice.toLocaleString("vi-VN")} VND
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function FormField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
      />
    </div>
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

function CheckoutIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-8 w-8"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 7v5c0 5 3.4 8 8 9 4.6-1 8-4 8-9V7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.5 12 1.8 1.8 3.2-3.6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20a8 8 0 0 1 16 0" />
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

export default CheckoutPage;
