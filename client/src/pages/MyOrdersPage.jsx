import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl, resolveMediaUrl } from "../lib/api.js";

const orderTabs = [
  { label: "Tất cả đơn", value: "all" },
  { label: "Chờ xác nhận", value: "pending" },
  { label: "Đã xác nhận", value: "confirmed" },
  { label: "Đã hủy", value: "cancelled" }
];

function MyOrdersPage() {
  const { token, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    fetchMyOrders(activeTab);
  }, [activeTab, isAuthenticated, token]);

  async function fetchMyOrders(status) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (status && status !== "all") {
        params.set("status", status);
      }

      const queryString = params.toString();
      const url = queryString
        ? buildApiUrl(`/api/orders/my-orders?${queryString}`)
        : buildApiUrl("/api/orders/my-orders");

      const response = await fetch(url, {
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
    <main className="min-h-screen bg-slate-50/50 pb-16 pt-6 animate-fade-in">
      <div className="mx-auto max-w-[1120px] px-4 space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              👤 Khách hàng
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Đơn hàng của tôi</h1>
            <p className="text-sm text-slate-500">
              Quản lý, tra cứu tình trạng đơn hàng và lịch sử mua hàng của bạn.
            </p>
          </div>

          <Link
            to="/phones"
            className="inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
          >
            🛒 Tiếp tục mua sắm
          </Link>
        </div>

        {/* Tab Selection */}
        <section className="rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
          <div className="flex flex-wrap gap-1">
            {orderTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                  activeTab === tab.value
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-650 hover:bg-slate-55 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Orders list */}
        {loading ? (
          <section className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm space-y-4">
            <div className="relative w-10 h-10 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-sm font-semibold text-slate-500">Đang tải danh sách đơn hàng...</p>
          </section>
        ) : error ? (
          <section className="rounded-2xl border border-red-100 bg-red-50 p-12 text-center shadow-sm">
            <p className="font-bold text-red-800">{error}</p>
          </section>
        ) : orders.length === 0 ? (
          <section className="rounded-2xl border border-slate-150 bg-white px-6 py-16 text-center shadow-sm space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <BoxIcon />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Chưa có đơn hàng nào</h2>
              <p className="mx-auto max-w-sm text-sm text-slate-500">
                Không tìm thấy đơn hàng nào khớp với trạng thái đã chọn. Hãy tham khảo các mẫu điện thoại mới cập bến nhé!
              </p>
            </div>
            <Link
              to="/phones"
              className="inline-block rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/10 transition"
            >
              Xem danh sách điện thoại
            </Link>
          </section>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article
                key={order._id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md hover:border-slate-200"
              >
                {/* Order Top Bar Info */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 px-5 py-4 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">MÃ ĐƠN HÀNG</span>
                      <span className="font-extrabold text-slate-900">
                        #{String(order._id).slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">NGÀY ĐẶT</span>
                      <span className="font-bold text-slate-800">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">THANH TOÁN</span>
                      <span className="font-bold text-slate-800">
                        {formatPaymentMethod(order.paymentMethod)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.status} />
                    <PaymentBadge paymentStatus={order.paymentStatus} />
                  </div>
                </div>

                {/* Items and Summary Area */}
                <div className="p-5 space-y-4">
                  {/* Order Items */}
                  <div className="space-y-2.5">
                    {(order.items || []).slice(0, 2).map((item, index) => {
                      const productId = getItemProductId(item);

                      return (
                        <div
                          key={`${productId}-${index}`}
                          className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/30 p-3"
                        >
                          <img
                            src={
                              resolveMediaUrl(item.image) ||
                              "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=160&q=80"
                            }
                            alt={item.name}
                            className="h-14 w-14 rounded-lg object-cover bg-white border border-slate-100"
                          />

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-bold text-sm text-slate-800">{item.name}</h3>
                            <p className="mt-0.5 text-xs text-slate-400">Số lượng: {item.quantity}</p>
                          </div>

                          <p className="text-sm font-extrabold text-slate-900">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                      );
                    })}

                    {(order.items || []).length > 2 ? (
                      <p className="text-xs text-slate-400 font-semibold pl-1">
                        ➕ Và {(order.items || []).length - 2} sản phẩm khác trong đơn hàng
                      </p>
                    ) : null}
                  </div>

                  {/* Order Footer Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="text-xs">
                      <span className="text-slate-450 block mb-0.5">ĐỊA CHỈ GIAO HÀNG</span>
                      <span className="font-semibold text-slate-700">
                        {formatOrderAddress(order)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">TỔNG THANH TOÁN</span>
                        <span className="text-xl font-black text-indigo-600">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>

                      <Link
                        to={`/my-orders/${order._id}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 px-4 py-2.5 text-xs font-bold text-indigo-700 transition"
                      >
                        Chi tiết đơn →
                      </Link>
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

// Helper components
function StatusBadge({ status }) {
  const badgeMap = {
    pending: { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-700 border-amber-200" },
    confirmed: { label: "Đã xác nhận", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    cancelled: { label: "Đã hủy", className: "bg-rose-50 text-rose-700 border-rose-200" }
  };

  const badge = badgeMap[status] || badgeMap.pending;

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${badge.className}`}>
      {badge.label}
    </span>
  );
}

function PaymentBadge({ paymentStatus }) {
  const badgeMap = {
    unpaid: { label: "Chưa trả tiền", className: "bg-slate-50 text-slate-600 border-slate-200" },
    pending: { label: "Chờ duyệt tiền", className: "bg-amber-50 text-amber-700 border-amber-200" },
    paid: { label: "Đã thanh toán", className: "bg-emerald-50 text-emerald-700 border-emerald-250" },
    failed: { label: "Lỗi GD", className: "bg-rose-50 text-rose-700 border-rose-200" }
  };

  const badge = badgeMap[paymentStatus] || badgeMap.unpaid;

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${badge.className}`}>
      {badge.label}
    </span>
  );
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
    return "Chuyển khoản";
  }
  if (paymentMethod === "online_mock") {
    return "Thanh toán Online";
  }
  return "COD (Nhận hàng trả tiền)";
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
      className="h-7 w-7"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9-4 9 4-9 4-9-4Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10l9 4 9-4V7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v10" />
    </svg>
  );
}

export default MyOrdersPage;
