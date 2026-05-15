import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

const paymentOptions = [
  {
    value: "cod",
    title: "Thanh toán khi nhận hàng",
    description: "Thanh toán trực tiếp cho nhân viên giao hàng."
  },
  {
    value: "bank_transfer",
    title: "Chuyển khoản ngân hàng",
    description: "Chuyển khoản trước, cửa hàng xác nhận sau khi nhận tiền."
  },
  {
    value: "online_mock",
    title: "Thanh toán online giả lập",
    description: "Dùng để demo trạng thái đã thanh toán ngay."
  }
];

const initialShippingInfo = {
  fullName: "",
  phoneNumber: "",
  address: "",
  city: "",
  district: "",
  ward: "",
  note: ""
};

function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [shippingInfo, setShippingInfo] = useState(initialShippingInfo);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  function handleShippingChange(event) {
    const { name, value } = event.target;
    setShippingInfo((current) => ({
      ...current,
      [name]: value
    }));
  }

  function validateShippingInfo() {
    if (!shippingInfo.fullName.trim()) {
      return "Vui lòng nhập họ tên người nhận";
    }

    if (!shippingInfo.phoneNumber.trim()) {
      return "Vui lòng nhập số điện thoại người nhận";
    }

    if (!shippingInfo.address.trim()) {
      return "Vui lòng nhập địa chỉ giao hàng";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const validationError = validateShippingInfo();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const headers = {
        "Content-Type": "application/json"
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const orderData = {
        shippingInfo: {
          fullName: shippingInfo.fullName.trim(),
          phoneNumber: shippingInfo.phoneNumber.trim(),
          address: shippingInfo.address.trim(),
          city: shippingInfo.city.trim(),
          district: shippingInfo.district.trim(),
          ward: shippingInfo.ward.trim(),
          note: shippingInfo.note.trim()
        },
        paymentMethod,
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
        headers,
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Đặt hàng thất bại");
      }

      const orderSummary = {
        orderId: data._id,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        shippingInfo: data.shippingInfo || orderData.shippingInfo
      };

      sessionStorage.setItem("latest-order-summary", JSON.stringify(orderSummary));
      clearCart();
      navigate("/order-success", {
        state: orderSummary
      });
    } catch (submitError) {
      setError(submitError.message || "Đặt hàng thất bại");
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

            <h1 className="mt-6 text-3xl font-black text-slate-900">Chưa thể thanh toán</h1>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-500">
              Giỏ hàng của bạn đang trống. Hãy quay lại trang chủ để tiếp tục lựa chọn
              sản phẩm trước khi đặt hàng.
            </p>

            <Link
              to="/"
              className="mt-8 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Quay lại mua hàng
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
              Thanh toán
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
              Thông tin đặt hàng
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Điền thông tin giao hàng và kiểm tra lại đơn trước khi xác nhận.
            </p>
          </div>

          <Link
            to="/cart"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            Quay lại giỏ hàng
          </Link>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <UserIcon />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Thông tin giao hàng</h2>
                <p className="text-sm text-slate-500">
                  Cửa hàng sẽ liên hệ và giao hàng theo thông tin bên dưới
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
                label="Họ tên người nhận"
                name="fullName"
                value={shippingInfo.fullName}
                onChange={handleShippingChange}
              />
              <FormField
                label="Số điện thoại"
                name="phoneNumber"
                value={shippingInfo.phoneNumber}
                onChange={handleShippingChange}
              />
              <FormField
                label="Địa chỉ"
                name="address"
                value={shippingInfo.address}
                onChange={handleShippingChange}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  label="Thành phố"
                  name="city"
                  value={shippingInfo.city}
                  onChange={handleShippingChange}
                />
                <FormField
                  label="Quận/Huyện"
                  name="district"
                  value={shippingInfo.district}
                  onChange={handleShippingChange}
                />
                <FormField
                  label="Phường/Xã"
                  name="ward"
                  value={shippingInfo.ward}
                  onChange={handleShippingChange}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ghi chú
                </label>
                <textarea
                  name="note"
                  value={shippingInfo.note}
                  onChange={handleShippingChange}
                  rows="4"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  placeholder="Ví dụ: giao giờ hành chính, gọi trước khi giao..."
                />
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-slate-700">
                  Phương thức thanh toán
                </p>
                <div className="space-y-3">
                  {paymentOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`block rounded-2xl border px-4 py-4 transition ${
                        paymentMethod === option.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={option.value}
                          checked={paymentMethod === option.value}
                          onChange={(event) => setPaymentMethod(event.target.value)}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{option.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{option.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {paymentMethod === "bank_transfer" && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-slate-700">
                  <p className="font-semibold text-blue-700">Thông tin chuyển khoản demo</p>
                  <p className="mt-2">Ngân hàng: Vietcombank</p>
                  <p>Số tài khoản: 1234567890</p>
                  <p>Chủ tài khoản: CỬA HÀNG MẠNH HƯƠNG</p>
                  <p className="mt-2 text-slate-500">
                    Nội dung: Thanh toan don hang + số điện thoại của bạn
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || cartItems.length === 0}
                className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {submitting ? "Đang đặt hàng..." : "Đặt hàng"}
              </button>
            </form>
          </section>

          <section className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 xl:sticky xl:top-28">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ReceiptIcon />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Tóm tắt đơn hàng</h2>
                <p className="text-sm text-slate-500">
                  {cartItems.length} sản phẩm đang chờ thanh toán
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
                    src={item.images?.[0] || "https://via.placeholder.com/240x180?text=Khong+co+anh"}
                    alt={item.name}
                    className="h-20 w-20 rounded-xl object-cover"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">Số lượng: {item.quantity}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      Đơn giá: {item.price?.toLocaleString("vi-VN")} đ
                    </p>
                    <p className="mt-2 text-lg font-bold text-blue-700">
                      {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <SummaryRow
                label="Tổng số lượng"
                value={`${cartItems.reduce((total, item) => total + item.quantity, 0)} món`}
              />
              <SummaryRow label="Phí vận chuyển" value="Sẽ tính khi xác nhận" />
              <SummaryRow label="Thanh toán" value={formatPaymentMethod(paymentMethod)} />
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Tổng thanh toán
                  </p>
                </div>
                <span className="text-3xl font-black text-blue-700">
                  {totalPrice.toLocaleString("vi-VN")} đ
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
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
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

function formatPaymentMethod(value) {
  if (value === "bank_transfer") {
    return "Chuyển khoản ngân hàng";
  }

  if (value === "online_mock") {
    return "Thanh toán online giả lập";
  }

  return "Thanh toán khi nhận hàng";
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
