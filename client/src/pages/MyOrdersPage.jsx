import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

function MyOrdersPage() {
  const { token, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    fetchMyOrders();
  }, [isAuthenticated, token]);

  async function fetchMyOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(buildApiUrl("/api/orders/my-orders"), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải lịch sử đơn hàng");
      }

      setOrders(data);
    } catch (fetchError) {
      setError(fetchError.message || "Không thể tải lịch sử đơn hàng");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="px-4 py-6 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1120px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Tài khoản
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Đơn hàng của tôi</h1>
            <p className="mt-2 text-sm text-slate-500">
              Theo dõi các đơn hàng bạn đã đặt tại cửa hàng Mạnh Hường.
            </p>
          </div>

          <Link
            to="/phones"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            Tiếp tục mua sắm
          </Link>
        </div>

        {loading ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-slate-600">Đang tải lịch sử đơn hàng...</p>
          </section>
        ) : error ? (
          <section className="rounded-[2rem] border border-red-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-red-600">{error}</p>
          </section>
        ) : orders.length === 0 ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <BoxIcon />
            </div>
            <h2 className="mt-6 text-2xl font-black text-slate-900">Bạn chưa có đơn hàng nào</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
              Hãy chọn sản phẩm yêu thích và hoàn tất đơn hàng đầu tiên của bạn.
            </p>
          </section>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article
                key={order._id}
                className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">
                      Mã đơn:
                      <span className="ml-2 font-semibold text-slate-900">
                        #{String(order._id).slice(-8).toUpperCase()}
                      </span>
                    </p>
                    <p className="text-sm text-slate-500">
                      Ngày đặt:
                      <span className="ml-2 font-semibold text-slate-900">
                        {formatDate(order.createdAt)}
                      </span>
                    </p>
                    <p className="text-sm text-slate-500">
                      Thanh toán:
                      <span className="ml-2 font-semibold text-slate-900">
                        {formatPaymentMethod(order.paymentMethod)}
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-500">Tổng tiền</p>
                    <p className="mt-1 text-2xl font-black text-blue-700">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="mt-2">
                      <PaymentBadge paymentStatus={order.paymentStatus} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-3">
                    {order.items?.map((item, index) => {
                      const productId = getItemProductId(item);

                      return (
                        <Link
                          key={`${productId}-${index}`}
                          to={productId ? `/products/${productId}` : "#"}
                          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
                        >
                          <img
                            src={item.image || "https://via.placeholder.com/160x120?text=No+Image"}
                            alt={item.name}
                            className="h-16 w-16 rounded-xl object-cover"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-slate-900">{item.name}</p>
                            <p className="mt-1 text-sm text-slate-500">Số lượng: {item.quantity}</p>
                            <p className="mt-1 text-xs font-medium text-blue-700">
                              Xem chi tiết sản phẩm
                            </p>
                          </div>

                          <p className="text-sm font-bold text-slate-700">
                            {formatCurrency(item.price)}
                          </p>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                      Thông tin giao hàng
                    </h3>
                    <div className="mt-4 space-y-3">
                      <InfoRow label="Người nhận" value={getOrderFullName(order) || "Đang cập nhật"} />
                      <InfoRow
                        label="Số điện thoại"
                        value={getOrderPhoneNumber(order) || "Đang cập nhật"}
                      />
                      <InfoRow label="Địa chỉ giao hàng" value={formatOrderAddress(order)} />
                      <InfoRow
                        label="Ghi chú"
                        value={order.shippingInfo?.note || order.note || "Không có ghi chú"}
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
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
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.className}`}>{badge.label}</span>;
}

function PaymentBadge({ paymentStatus }) {
  const badgeMap = {
    unpaid: { label: "Chưa thanh toán", className: "bg-slate-200 text-slate-700" },
    pending: { label: "Chờ xác nhận thanh toán", className: "bg-amber-100 text-amber-700" },
    paid: { label: "Đã thanh toán", className: "bg-emerald-100 text-emerald-700" },
    failed: { label: "Thanh toán thất bại", className: "bg-rose-100 text-rose-700" }
  };

  const badge = badgeMap[paymentStatus] || badgeMap.unpaid;
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.className}`}>{badge.label}</span>;
}

function getOrderFullName(order) {
  return order.shippingInfo?.fullName || order.customerName || "";
}

function getOrderPhoneNumber(order) {
  return order.shippingInfo?.phoneNumber || order.phoneNumber || "";
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

function formatDate(value) {
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

function getItemProductId(item) {
  return item?.productId?._id || item?.productId || "";
}

function BoxIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-8 w-8"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9-4 9 4-9 4-9-4Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10l9 4 9-4V7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v10" />
    </svg>
  );
}

export default MyOrdersPage;
