import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl, resolveMediaUrl } from "../lib/api.js";

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

    const handleFocus = () => {
      fetchOrderDetailSilent();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [id, isAuthenticated, token]);

  async function fetchOrderDetailSilent() {
    try {
      const response = await fetch(buildApiUrl(`/api/orders/${id}`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setOrder(data);
      }
    } catch (error) {
      console.error("Silent refetch error:", error);
    }
  }

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
      <main className="min-h-screen bg-slate-50/50 pb-16 pt-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm font-semibold text-slate-500">Đang tải thông tin đơn hàng...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50/50 pb-16 pt-6 flex items-center justify-center">
        <div className="mx-auto max-w-md rounded-2xl bg-red-50 border border-red-100 p-8 text-center space-y-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-650 text-xl font-bold">⚠️</span>
          <p className="font-bold text-red-800">{error}</p>
          <Link
            to="/my-orders"
            className="inline-block rounded-xl bg-slate-900 hover:bg-slate-850 px-5 py-2.5 text-xs font-bold text-white transition"
          >
            Quay lại danh sách
          </Link>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-slate-50/50 pb-16 pt-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold text-slate-500">Không tìm thấy đơn hàng tương ứng.</p>
          <Link
            to="/my-orders"
            className="inline-block rounded-xl bg-slate-900 hover:bg-slate-850 px-5 py-2.5 text-xs font-bold text-white transition"
          >
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/50 pb-16 pt-6 animate-fade-in">
      <div className="mx-auto max-w-[1120px] px-4 space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              📦 Chi tiết đơn hàng
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Đơn hàng #{String(order._id).slice(-8).toUpperCase()}
            </h1>
            <p className="text-sm text-slate-500">
              Kiểm tra thông tin giao nhận, trạng thái vận chuyển và thanh toán.
            </p>
          </div>

          <Link
            to="/my-orders"
            className="inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
          >
            ← Đơn hàng của tôi
          </Link>
        </div>

        {/* Status Highlights */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mã giao dịch chi tiết</p>
              <p className="text-sm font-extrabold text-slate-800">{order._id}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-450 font-bold">Trạng thái:</span>
              <StatusBadge status={order.status} />
              <PaymentBadge paymentStatus={order.paymentStatus} />
            </div>
          </div>
        </section>

        {/* Advanced Interactive Timeline */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-base font-extrabold text-slate-950 uppercase tracking-wider border-b border-slate-100 pb-3">
            Hành trình đơn hàng
          </h2>
          
          <div className="grid gap-6 md:grid-cols-3 relative">
            {/* Step 1: Đã đặt đơn */}
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow shadow-emerald-200 ring-4 ring-emerald-50">
                ✓
              </span>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-850">Đã đặt hàng thành công</p>
                <p className="text-xs text-slate-400">Hệ thống đã nhận thông tin gửi đơn từ quý khách.</p>
                <p className="text-[10px] font-semibold text-slate-500">{formatDateTime(order.createdAt)}</p>
              </div>
            </div>

            {/* Step 2: Đang xác nhận */}
            <div className="flex items-start gap-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold shadow ${
                order.status === "confirmed"
                  ? "bg-emerald-500 text-white ring-4 ring-emerald-50"
                  : order.status === "cancelled"
                  ? "bg-red-500 text-white ring-4 ring-red-50"
                  : "bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse"
              }`}>
                {order.status === "confirmed" ? "✓" : order.status === "cancelled" ? "✕" : "2"}
              </span>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-850">
                  {order.status === "confirmed"
                    ? "Đã xác nhận đơn"
                    : order.status === "cancelled"
                    ? "Đơn hàng đã hủy"
                    : "Đang kiểm tra & xác nhận"}
                </p>
                <p className="text-xs text-slate-400">
                  {order.status === "confirmed"
                    ? "Shop đã chuẩn bị hàng sẵn sàng để bàn giao cho bưu tá."
                    : order.status === "cancelled"
                    ? "Đơn hàng đã bị hủy bỏ trên hệ thống bán lẻ."
                    : "Bộ phận duyệt đơn đang kiểm tra kho hàng và liên hệ xác minh."}
                </p>
              </div>
            </div>

            {/* Step 3: Hoàn tất */}
            <div className="flex items-start gap-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold shadow ${
                order.status === "confirmed" && order.paymentStatus === "paid"
                  ? "bg-emerald-500 text-white ring-4 ring-emerald-50"
                  : "bg-slate-100 text-slate-400"
              }`}>
                {order.status === "confirmed" && order.paymentStatus === "paid" ? "✓" : "3"}
              </span>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">Hoàn tất & Giao hàng</p>
                <p className="text-xs text-slate-400">
                  Đơn hàng hoàn tất thanh toán và chuyển phát đến tận tay quý khách hàng.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed breakdown list */}
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          
          {/* Product Items Table/Cards */}
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              Danh sách sản phẩm mua
            </h2>
            <div className="space-y-3">
              {(order.items || []).map((item, index) => {
                const productId = item?.productId?._id || item?.productId || "";

                return (
                  <div
                    key={`${productId}-${index}`}
                    className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 transition hover:bg-slate-50"
                  >
                    <img
                      src={
                        resolveMediaUrl(item.image) ||
                        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=160&q=80"
                      }
                      alt={item.name}
                      className="h-16 w-16 rounded-xl object-cover bg-white border border-slate-150"
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-sm text-slate-800">{item.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Số lượng: {item.quantity}</p>
                      {productId ? (
                        <Link
                          to={`/products/${productId}`}
                          className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded"
                        >
                          👁 Xem máy chi tiết
                        </Link>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        {formatCurrency(item.price)}
                      </p>
                      <p className="mt-0.5 font-extrabold text-sm text-slate-800">
                        {formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 0))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Customer / Payment Side Info */}
          <section className="space-y-6">
            <InfoCard title="Thông tin người nhận">
              <InfoRow label="Người nhận hàng" value={getOrderFullName(order)} />
              <InfoRow label="Số điện thoại liên lạc" value={getOrderPhoneNumber(order)} />
              <InfoRow label="Địa chỉ nhà cụ thể" value={formatOrderAddress(order)} />
              <InfoRow label="Ghi chú người mua" value={order.shippingInfo?.note || order.note || "Không có ghi chú"} />
            </InfoCard>

            <InfoCard title="Thông tin giao dịch">
              <InfoRow label="Hình thức thanh toán" value={formatPaymentMethod(order.paymentMethod)} />
              <InfoRow label="Duyệt thanh toán" value={formatPaymentStatus(order.paymentStatus)} />
              <InfoRow label="Mã giao dịch ngân hàng" value={order.transactionId || "Không có (COD)"} />
            </InfoCard>

            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Tổng số tiền cần trả</span>
                <span className="text-[10px] text-slate-400 font-semibold">(Đã bao gồm VAT & các khoản phụ phí)</span>
              </div>
              <p className="text-2xl font-black text-indigo-600 tracking-tight">
                {formatCurrency(order.totalAmount)}
              </p>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

// Side Info Helper Wrapper
function InfoCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
      <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-450 border-b border-slate-100 pb-2.5">
        {title}
      </h2>
      <div className="space-y-3.5">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-xs font-bold text-slate-700 leading-relaxed">{value || "Chưa cập nhật"}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const badgeMap = {
    pending: { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-700 border-amber-250" },
    confirmed: { label: "Đã xác nhận", className: "bg-emerald-50 text-emerald-700 border-emerald-250" },
    cancelled: { label: "Đã hủy", className: "bg-rose-50 text-rose-700 border-rose-250" }
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
    unpaid: { label: "Chưa thanh toán", className: "bg-slate-50 text-slate-600 border-slate-200" },
    pending: { label: "Chờ xác nhận thanh toán", className: "bg-amber-50 text-amber-700 border-amber-200" },
    paid: { label: "Đã thanh toán", className: "bg-emerald-50 text-emerald-700 border-emerald-250" },
    failed: { label: "Thanh toán lỗi", className: "bg-rose-50 text-rose-700 border-rose-200" }
  };

  const badge = badgeMap[paymentStatus] || badgeMap.unpaid;

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${badge.className}`}>
      {badge.label}
    </span>
  );
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

// Formatting helpers
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
    return "Thanh toán Online";
  }
  return "Giao hàng thu tiền (COD)";
}

function formatPaymentStatus(paymentStatus) {
  if (paymentStatus === "paid") {
    return "Đã thanh toán thành công";
  }
  if (paymentStatus === "pending") {
    return "Chờ nhân viên check giao dịch";
  }
  if (paymentStatus === "failed") {
    return "Giao dịch thanh toán bị lỗi";
  }
  return "Chưa thực hiện thanh toán";
}

export default OrderDetailPage;
