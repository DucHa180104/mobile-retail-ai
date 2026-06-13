import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

function OrderDetailPage() {
  const { id } = useParams();
  const { token, isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    fetchOrderDetail();
  }, [id, isAuthenticated, token]);

  async function fetchOrderDetail() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(buildApiUrl(`/api/orders/${id}`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải chi tiết đơn hàng");
      }

      setOrder(data);
    } catch (fetchError) {
      setError(fetchError.message || "Không thể tải chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <main className="px-4 py-6 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1120px] rounded-[2rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-slate-600">Đang tải chi tiết đơn hàng...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-6 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1120px] rounded-[2rem] border border-red-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="px-4 py-6 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1120px] rounded-[2rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-slate-600">Không tìm thấy đơn hàng.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-6 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1120px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Đơn hàng
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Chi tiết đơn #{String(order._id).slice(-8).toUpperCase()}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Theo dõi trạng thái và xem đầy đủ thông tin đơn hàng của bạn.
            </p>
          </div>

          <Link
            to="/my-orders"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            Quay lại đơn hàng của tôi
          </Link>
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-slate-500">
                Mã đơn
                <span className="ml-2 font-bold text-slate-900">
                  #{String(order._id).slice(-8).toUpperCase()}
                </span>
              </p>
              <p className="text-sm text-slate-500">
                Ngày đặt
                <span className="ml-2 font-semibold text-slate-900">
                  {formatDateTime(order.createdAt)}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge status={order.status} />
              <PaymentBadge paymentStatus={order.paymentStatus} />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Theo dõi đơn hàng</h2>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-4">
              <span className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full ${getTimelineClass(order.status)}`}>
                <TimelineIcon />
              </span>
              <div>
                <p className="font-bold text-slate-900">{getTimelineLabel(order.status)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {getTimelineDescription(order.status)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Danh sách sản phẩm</h2>
            <div className="mt-5 space-y-3">
              {(order.items || []).map((item, index) => {
                const productId = item?.productId?._id || item?.productId || "";

                return (
                  <div
                    key={`${productId}-${index}`}
                    className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <img
                      src={item.image || "https://via.placeholder.com/160x120?text=No+Image"}
                      alt={item.name}
                      className="h-16 w-16 rounded-xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">Số lượng: {item.quantity}</p>
                      {productId ? (
                        <Link
                          to={`/products/${productId}`}
                          className="mt-1 inline-block text-xs font-semibold text-blue-700 hover:text-blue-800"
                        >
                          Xem sản phẩm
                        </Link>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-slate-500">
                        {formatCurrency(item.price)} / sản phẩm
                      </p>
                      <p className="mt-1 font-bold text-slate-900">
                        {formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 0))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-5">
            <InfoCard title="Thông tin giao hàng">
              <InfoRow label="Người nhận" value={getOrderFullName(order)} />
              <InfoRow label="Số điện thoại" value={getOrderPhoneNumber(order)} />
              <InfoRow label="Địa chỉ giao hàng" value={formatOrderAddress(order)} />
              <InfoRow label="Ghi chú" value={order.shippingInfo?.note || order.note || "Không có"} />
            </InfoCard>

            <InfoCard title="Thanh toán">
              <InfoRow label="Phương thức thanh toán" value={formatPaymentMethod(order.paymentMethod)} />
              <InfoRow label="Trạng thái thanh toán" value={formatPaymentStatus(order.paymentStatus)} />
              <InfoRow label="Mã giao dịch" value={order.transactionId || "Không có"} />
            </InfoCard>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                Tổng tiền
              </h2>
              <p className="mt-4 text-3xl font-black text-blue-700">
                {formatCurrency(order.totalAmount)}
              </p>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ title, children }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value || "Đang cập nhật"}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const badgeMap = {
    pending: { label: "Chờ xác nhận", className: "bg-amber-100 text-amber-700" },
    confirmed: { label: "Đã xác nhận", className: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: "Đã hủy", className: "bg-rose-100 text-rose-700" }
  };

  const badge = badgeMap[status] || badgeMap.pending;

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.className}`}>
      {badge.label}
    </span>
  );
}

function PaymentBadge({ paymentStatus }) {
  const badgeMap = {
    unpaid: { label: "Chưa thanh toán", className: "bg-slate-200 text-slate-700" },
    pending: { label: "Chờ xác nhận thanh toán", className: "bg-amber-100 text-amber-700" },
    paid: { label: "Đã thanh toán", className: "bg-emerald-100 text-emerald-700" },
    failed: { label: "Thanh toán thất bại", className: "bg-rose-100 text-rose-700" }
  };

  const badge = badgeMap[paymentStatus] || badgeMap.unpaid;

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.className}`}>
      {badge.label}
    </span>
  );
}

function getTimelineLabel(status) {
  if (status === "confirmed") {
    return "Đơn hàng đã được xác nhận";
  }

  if (status === "cancelled") {
    return "Đơn hàng đã bị hủy";
  }

  return "Đơn hàng đang chờ xác nhận";
}

function getTimelineDescription(status) {
  if (status === "confirmed") {
    return "Cửa hàng đã xác nhận đơn hàng của bạn và sẽ xử lý theo thông tin đã đặt.";
  }

  if (status === "cancelled") {
    return "Đơn hàng này đã bị hủy. Nếu cần hỗ trợ thêm, bạn có thể liên hệ cửa hàng.";
  }

  return "Đơn hàng đã được ghi nhận và đang chờ cửa hàng xác nhận.";
}

function getTimelineClass(status) {
  if (status === "confirmed") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "cancelled") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-amber-100 text-amber-700";
}

function getOrderFullName(order) {
  return order.shippingInfo?.fullName || order.customerName || "Đang cập nhật";
}

function getOrderPhoneNumber(order) {
  return order.shippingInfo?.phoneNumber || order.phoneNumber || "Đang cập nhật";
}

function formatOrderAddress(order) {
  const shippingInfo = order.shippingInfo || {};
  const parts = [
    shippingInfo.address || order.address,
    shippingInfo.ward,
    shippingInfo.district,
    shippingInfo.city
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Đang cập nhật";
}

function formatCurrency(value) {
  return `${(Number(value) || 0).toLocaleString("vi-VN")}đ`;
}

function formatDateTime(value) {
  if (!value) {
    return "Đang cập nhật";
  }

  return new Date(value).toLocaleString("vi-VN");
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

function TimelineIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export default OrderDetailPage;
