import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    address: "",
    note: ""
  });
  const [message, setMessage] = useState("");
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

    setMessage("");
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
      setFormData({
        customerName: "",
        phoneNumber: "",
        address: "",
        note: ""
      });
      setMessage("Dat hang thanh cong");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (cartItems.length === 0 && !message) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Thanh toan</h1>
          <p className="mt-6 text-gray-600">Gio hang dang trong</p>
          <Link
            to="/"
            className="mt-6 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Quay lai mua hang
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex justify-end">
          <Link
            to="/cart"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Gio hang
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900">Thanh toan</h1>

            {message && (
              <p className="mt-4 rounded bg-green-100 px-4 py-3 text-green-700">
                {message}
              </p>
            )}

            {error && (
              <p className="mt-4 rounded bg-red-100 px-4 py-3 text-red-700">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                <label className="mb-2 block font-medium text-gray-700">
                  Ghi chu
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  rows="4"
                  className="w-full rounded border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || cartItems.length === 0}
                className="w-full rounded bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {submitting ? "Dang dat hang..." : "Dat hang"}
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Don hang cua ban</h2>

            <div className="mt-6 space-y-4">
              {cartItems.map((item) => (
                <article
                  key={item._id}
                  className="flex gap-4 rounded-lg border border-gray-200 p-4"
                >
                  <img
                    src={item.images?.[0] || "https://via.placeholder.com/240x180?text=No+Image"}
                    alt={item.name}
                    className="h-20 w-20 rounded object-cover"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      So luong: {item.quantity}
                    </p>
                    <p className="mt-2 text-blue-600">
                      {(item.price * item.quantity).toLocaleString("vi-VN")} VND
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-lg font-semibold text-gray-900">
                  Tong tien
                </span>
                <span className="text-2xl font-bold text-blue-600">
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
      <label className="mb-2 block font-medium text-gray-700">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500"
      />
    </div>
  );
}

export default CheckoutPage;
