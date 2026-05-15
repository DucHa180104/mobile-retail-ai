import { Link, useLocation } from "react-router-dom";

function OrderSuccessPage() {
  const location = useLocation();
  const storedSummary = getStoredOrderSummary();
  const orderSummary = location.state || storedSummary;
  const shippingInfo = orderSummary?.shippingInfo || {};

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
        <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-14">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-inner">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="h-14 w-14"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <span className="mt-8 inline-flex rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
            Đơn hàng hoàn tất
          </span>

          <h1 className="mt-6 text-3xl font-black text-slate-900 sm:text-4xl">
            Đặt hàng thành công
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-500">
            Cảm ơn bạn đã mua hàng. Cửa hàng sẽ liên hệ xác nhận đơn trong thời gian sớm
            nhất.
          </p>

          {orderSummary && (
            <div className="mx-auto mt-8 max-w-2xl rounded-2xl bg-slate-50 px-5 py-5 text-left">
              <SummaryRow
                label="Mã đơn hàng"
                value={
                  orderSummary.orderId
                    ? `#${String(orderSummary.orderId).slice(-8).toUpperCase()}`
                    : "Đang cập nhật"
                }
              />
              <SummaryRow
                label="Người nhận"
                value={shippingInfo.fullName || "Đang cập nhật"}
              />
              <SummaryRow
                label="Số điện thoại"
                value={shippingInfo.phoneNumber || "Đang cập nhật"}
              />
              <SummaryRow
                label="Địa chỉ giao hàng"
                value={formatShippingAddress(shippingInfo)}
              />
              <SummaryRow
                label="Phương thức thanh toán"
                value={formatPaymentMethod(orderSummary.paymentMethod)}
              />
              <SummaryRow
                label="Trạng thái thanh toán"
                value={formatPaymentStatus(orderSummary.paymentStatus)}
              />
            </div>
          )}

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/"
              className="rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-700"
            >
              Tiếp tục mua hàng
            </Link>

            <Link
              to="/my-orders"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
            >
              Xem đơn hàng của tôi
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function getStoredOrderSummary() {
  try {
    const storedValue = sessionStorage.getItem("latest-order-summary");
    return storedValue ? JSON.parse(storedValue) : null;
  } catch {
    return null;
  }
}

function formatShippingAddress(shippingInfo) {
  const parts = [
    shippingInfo.address,
    shippingInfo.ward,
    shippingInfo.district,
    shippingInfo.city
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Đang cập nhật";
}

function formatPaymentMethod(paymentMethod) {
  if (paymentMethod === "bank_transfer") {
    return "Chuyển khoản ngân hàng";
  }

  if (paymentMethod === "online_mock") {
    return "Thanh toán online giả lập";
  }

  return "Thanh toán khi nhận hàng";
}

function formatPaymentStatus(paymentStatus) {
  if (paymentStatus === "paid") {
    return "Đã thanh toán";
  }

  if (paymentStatus === "pending") {
    return "Chờ xác nhận thanh toán";
  }

  if (paymentStatus === "failed") {
    return "Thanh toán thất bại";
  }

  return "Chưa thanh toán";
}

export default OrderSuccessPage;
