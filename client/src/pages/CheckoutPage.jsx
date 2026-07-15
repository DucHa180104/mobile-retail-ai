import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { buildApiUrl, resolveMediaUrl } from "../lib/api.js";

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
  const {
    cartItems,
    clearCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart
  } = useCart();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [shippingInfo, setShippingInfo] = useState(initialShippingInfo);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setContactEmail(user.email);
    }
  }, [user?.email]);

  const totalPrice = cartItems.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  const totalQuantity = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
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
    if (!contactEmail.trim()) {
      return "Vui lòng nhập email nhận xác nhận đơn hàng";
    }

    if (!isValidEmail(contactEmail.trim())) {
      return "Email nhận xác nhận đơn hàng không hợp lệ";
    }

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
        contactEmail: contactEmail.trim(),
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

      const response = await fetch(buildApiUrl("/api/orders"), {
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
        contactEmail: data.contactEmail || orderData.contactEmail,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        shippingInfo: data.shippingInfo || orderData.shippingInfo
      };

      sessionStorage.setItem("latest-order-summary", JSON.stringify(orderSummary));
      await clearCart();
      navigate("/order-success", {
        state: orderSummary
      });
    } catch (submitError) {
      setError(submitError.message || "Đặt hàng thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleIncrease(productId) {
    setError("");
    await increaseQuantity(productId);
  }

  async function handleDecrease(productId) {
    setError("");
    await decreaseQuantity(productId);
  }

  if (cartItems.length === 0) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        <div className="mx-auto max-w-3xl">
          <section className="rounded-[2rem] border border-slate-100 bg-white px-6 py-16 text-center shadow-sm sm:px-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50/50 text-blue-600 border border-blue-100/50">
              <CheckoutIcon />
            </div>

            <h1 className="mt-6 text-2xl font-black text-slate-800 sm:text-3xl">Chưa thể thanh toán</h1>

            <p className="mx-auto mt-3 max-w-sm text-xs sm:text-sm leading-relaxed text-slate-400 font-medium">
              Giỏ hàng của bạn đang trống. Hãy quay lại cửa hàng để tiếp tục lựa chọn sản phẩm trước khi tiến hành thanh toán nhé.
            </p>

            <Link
              to="/"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-blue-100 hover:from-blue-750 hover:to-blue-800 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Quay lại mua hàng
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
              Thanh toán đơn hàng
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-850">
              Thông tin đặt hàng
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-400">
              Điền thông tin nhận máy và lựa chọn phương thức thanh toán phù hợp.
            </p>
          </div>

          <Link
            to="/cart"
            className="rounded-full border border-slate-100 bg-white px-4.5 py-2 text-xs sm:text-sm font-bold text-slate-655 transition shadow-sm hover:border-blue-200 hover:text-blue-600"
          >
            Quay lại giỏ hàng
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50/50 text-blue-650 border border-blue-100/50">
                <UserIcon />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-800">Thông tin người nhận máy</h2>
                <p className="text-[11px] text-slate-400 font-bold">
                  Vui lòng điền đúng số điện thoại để nhân viên gọi xác nhận trạng thái máy trước khi gửi.
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-5 rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-xs sm:text-sm font-bold text-rose-600">
                ⚠️ {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                  Email nhận hóa đơn xác nhận
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all duration-300 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50/30"
                  placeholder="example@email.com"
                />
              </div>

              <FormField
                label="Họ tên khách hàng"
                name="fullName"
                value={shippingInfo.fullName}
                onChange={handleShippingChange}
              />
              <FormField
                label="Số điện thoại nhận hàng"
                name="phoneNumber"
                value={shippingInfo.phoneNumber}
                onChange={handleShippingChange}
              />
              <FormField
                label="Địa chỉ giao hàng (Số nhà, tên đường...)"
                name="address"
                value={shippingInfo.address}
                onChange={handleShippingChange}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  label="Thành phố / Tỉnh"
                  name="city"
                  value={shippingInfo.city}
                  onChange={handleShippingChange}
                />
                <FormField
                  label="Quận / Huyện"
                  name="district"
                  value={shippingInfo.district}
                  onChange={handleShippingChange}
                />
                <FormField
                  label="Phường / Xã"
                  name="ward"
                  value={shippingInfo.ward}
                  onChange={handleShippingChange}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Ghi chú giao hàng</label>
                <textarea
                  name="note"
                  value={shippingInfo.note}
                  onChange={handleShippingChange}
                  rows="3"
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none transition-all duration-300 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50/30"
                  placeholder="Ví dụ: Giao ngoài giờ hành chính, gọi trước 15 phút..."
                />
              </div>

              <div className="border-t border-slate-100 pt-5">
                <p className="mb-3.5 text-xs font-black uppercase tracking-wider text-slate-400">
                  Phương thức thanh toán
                </p>
                <div className="space-y-3">
                  {paymentOptions.map((option) => {
                    const isSelected = paymentMethod === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`block cursor-pointer rounded-2xl border p-4 transition-all duration-300 ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/20 shadow-sm ring-1 ring-blue-600"
                            : "border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50/30"
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <input
                             type="radio"
                             name="paymentMethod"
                             value={option.value}
                             checked={isSelected}
                             onChange={(event) => setPaymentMethod(event.target.value)}
                             className="mt-1 h-4.5 w-4.5 border-slate-200 text-blue-600 accent-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                          />
                          <div>
                            <p className={`font-bold text-sm ${isSelected ? "text-blue-950" : "text-slate-800"}`}>{option.title}</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500 font-medium">{option.description}</p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {paymentMethod === "bank_transfer" && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-5 text-blue-950 animate-fade-in space-y-2">
                  <p className="font-black text-blue-800">Thông tin chuyển khoản thanh toán</p>
                  <div className="grid gap-1.5 text-xs sm:text-sm font-bold text-slate-650 pt-1">
                    <p>• Ngân hàng: <span className="text-slate-800 font-black">Vietcombank (VCB)</span></p>
                    <p>• Số tài khoản: <span className="text-slate-850 font-black text-base">1234567890</span></p>
                    <p>• Chủ tài khoản: <span className="text-slate-850 font-black">CỬA HÀNG MẠNH HƯƠNG MOBILE</span></p>
                    <p>• Nội dung chuyển khoản: <span className="text-rose-600 font-black">MHB {shippingInfo.phoneNumber || "SỐ ĐIỆN THOẠI"}</span></p>
                  </div>
                  <p className="text-[11px] font-bold text-blue-600/90 pt-1 leading-relaxed">
                    * Đơn hàng sẽ được xử lý lập tức ngay sau khi nhận được biến động số dư. Cửa hàng sẽ gọi điện xác thực.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || cartItems.length === 0}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-750 hover:to-blue-800 text-xs font-black uppercase tracking-wider text-white py-4 shadow-md shadow-blue-100 transition-all duration-300 hover:shadow-lg active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Đang xử lý đặt hàng..." : "Xác nhận đặt hàng"}
              </button>
            </form>
          </section>

          <section className="h-fit rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-7 lg:sticky lg:top-24">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50/50 text-blue-650 border border-blue-100/50">
                <ReceiptIcon />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-800">Tóm tắt giỏ hàng</h2>
                <p className="text-[11px] text-slate-400 font-bold">
                  Đang thanh toán {cartItems.length} sản phẩm
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {cartItems.map((item) => (
                <article
                  key={item._id}
                  className="rounded-2xl border border-slate-55 bg-slate-50/50 p-4 hover:border-blue-100 transition-all duration-300"
                >
                  <div className="flex gap-4">
                    <img
                      src={
                        resolveMediaUrl(item.images?.[0]) ||
                        "https://via.placeholder.com/240x180?text=Khong+co+anh"
                      }
                      alt={item.name}
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover border border-slate-100"
                      loading="lazy"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-sm text-slate-800 truncate">{item.name}</h3>
                        <button
                          type="button"
                          onClick={() => handleRemove(item._id)}
                          className="text-[10px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-600 transition"
                        >
                          Xóa
                        </button>
                      </div>

                      <p className="mt-1 text-xs text-slate-400 font-bold">
                        Đơn giá: {formatCurrency(item.price)}
                      </p>

                      <div className="mt-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center rounded-lg border border-slate-150 bg-white">
                          <button
                            type="button"
                            onClick={() => handleDecrease(item._id)}
                            className="flex h-8 w-8 items-center justify-center text-xs font-black text-slate-500 transition hover:bg-slate-50"
                            aria-label={`Giảm số lượng ${item.name}`}
                          >
                            -
                          </button>
                          <span className="flex min-w-[28px] items-center justify-center text-xs font-bold text-slate-700">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncrease(item._id)}
                            className="flex h-8 w-8 items-center justify-center text-xs font-black text-slate-500 transition hover:bg-slate-50"
                            aria-label={`Tăng số lượng ${item.name}`}
                          >
                            +
                          </button>
                        </div>

                        <p className="text-sm font-black text-blue-650">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-slate-50 bg-slate-50/50 p-4.5 space-y-3">
              <SummaryRow label="Tổng số lượng sản phẩm" value={`${totalQuantity} máy`} />
              <SummaryRow label="Phí giao nhận hàng" value="Miễn phí ship" />
              <SummaryRow label="Hình thức thanh toán" value={formatPaymentMethod(paymentMethod)} />
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Tổng chi phí
                </p>
                <span className="text-2xl font-black text-rose-500">
                  {formatCurrency(totalPrice)}
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
      <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all duration-300 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50/30"
      />
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs font-bold">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-700">{value}</span>
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

function formatCurrency(value) {
  return `${(Number(value) || 0).toLocaleString("vi-VN")} đ`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3 4 7v5c0 5 3.4 8 8 9 4.6-1 8-4 8-9V7z"
      />
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

export default CheckoutPage;
