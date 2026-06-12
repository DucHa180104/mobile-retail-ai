import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

const statusTabs = [
  { label: "Tất cả", value: "all" },
  { label: "Chờ xác nhận", value: "pending" },
  { label: "Đã xác nhận", value: "confirmed" },
  { label: "Đã hủy", value: "cancelled" }
];

const statusOptions = [
  { label: "Chờ xác nhận", value: "pending" },
  { label: "Đã xác nhận", value: "confirmed" },
  { label: "Đã hủy", value: "cancelled" }
];

function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(buildApiUrl("/api/orders"), {
          headers: token
            ? {
                Authorization: `Bearer ${token}`
              }
            : {}
        });

        if (!response.ok) {
          throw new Error(
            getAdminApiErrorMessage(response.status, "Không thể tải danh sách đơn hàng")
          );
        }

        const data = await response.json();
        setOrders(data);
        setSelectedOrderId(data[0]?._id || "");
      } catch (fetchError) {
        setError(fetchError.message || "Không thể tải danh sách đơn hàng");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [token]);

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") {
      return orders;
    }

    return orders.filter((order) => order.status === activeTab);
  }, [activeTab, orders]);

  const selectedOrder =
    filteredOrders.find((order) => order._id === selectedOrderId) ||
    orders.find((order) => order._id === selectedOrderId) ||
    filteredOrders[0] ||
    null;

  useEffect(() => {
    if (!filteredOrders.length) {
      setSelectedOrderId("");
      return;
    }

    const stillExists = filteredOrders.some((order) => order._id === selectedOrderId);

    if (!stillExists) {
      setSelectedOrderId(filteredOrders[0]._id);
    }
  }, [filteredOrders, selectedOrderId]);

  async function handleStatusChange(orderId, nextStatus) {
    const previousOrders = orders;

    setUpdatingOrderId(orderId);
    setError("");
    setOrders((current) =>
      current.map((order) =>
        order._id === orderId ? { ...order, status: nextStatus } : order
      )
    );

    try {
      const response = await fetch(buildApiUrl(`/api/orders/${orderId}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          status: nextStatus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getAdminApiErrorMessage(
            response.status,
            data.message || "Không thể cập nhật trạng thái đơn hàng"
          )
        );
      }

      setOrders((current) =>
        current.map((order) => (order._id === orderId ? data : order))
      );
    } catch (updateError) {
      setOrders(previousOrders);
      setError(updateError.message || "Không thể cập nhật trạng thái đơn hàng");
    } finally {
      setUpdatingOrderId("");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-slate-600">Đang tải danh sách đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error && !orders.length) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-sm text-slate-400">
          admin / <span className="font-semibold text-blue-700">Quản lý đơn hàng</span>
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Quản lý đơn hàng</h1>
        <p className="mt-2 text-sm text-slate-500">
          Theo dõi và cập nhật trạng thái đơn hàng của cửa hàng Mạnh Hường.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <OrderStatusTabs activeTab={activeTab} onChange={setActiveTab} />

      <OrdersTable
        orders={filteredOrders}
        selectedOrderId={selectedOrderId}
        updatingOrderId={updatingOrderId}
        onSelectOrder={setSelectedOrderId}
        onStatusChange={handleStatusChange}
      />

      <OrderDetailPanel
        order={selectedOrder}
        updatingOrderId={updatingOrderId}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

function OrderStatusTabs({ activeTab, onChange }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.value
                  ? "bg-blue-700 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
          >
            Bộ lọc
          </button>
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
          >
            Xuất Excel
          </button>
        </div>
      </div>
    </section>
  );
}

function OrdersTable({
  orders,
  selectedOrderId,
  updatingOrderId,
  onSelectOrder,
  onStatusChange
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            <tr>
              <th className="px-5 py-4">Mã đơn</th>
              <th className="px-5 py-4">Khách hàng</th>
              <th className="px-5 py-4">Số điện thoại</th>
              <th className="px-5 py-4">Tổng tiền</th>
              <th className="px-5 py-4">Thanh toán</th>
              <th className="px-5 py-4">Trạng thái đơn</th>
              <th className="px-5 py-4">Ngày đặt</th>
              <th className="px-5 py-4">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order._id}
                className={`border-t border-slate-100 ${
                  selectedOrderId === order._id ? "bg-blue-50/50" : ""
                }`}
              >
                <td className="px-5 py-4 text-sm font-bold text-blue-700">
                  #{String(order._id).slice(-6).toUpperCase()}
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                  {getOrderFullName(order) || "Khách hàng"}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {getOrderPhoneNumber(order) || "Đang cập nhật"}
                </td>
                <td className="px-5 py-4 text-sm font-bold text-slate-900">
                  {formatCurrency(order.totalAmount)}
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500">
                      {formatPaymentMethod(order.paymentMethod)}
                    </p>
                    <PaymentBadge paymentStatus={order.paymentStatus} />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <select
                    value={order.status || "pending"}
                    onChange={(event) => onStatusChange(order._id, event.target.value)}
                    disabled={updatingOrderId === order._id}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => onSelectOrder(order._id)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                  >
                    Xem chi tiết
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="8" className="px-5 py-10 text-center text-sm text-slate-500">
                  Không có đơn hàng nào trong trạng thái này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OrderDetailPanel({ order, updatingOrderId, onStatusChange }) {
  if (!order) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-slate-500">Chọn một đơn hàng để xem chi tiết.</p>
      </section>
    );
  }

  const subtotal = Array.isArray(order.items)
    ? order.items.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
        0
      )
    : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            Chi tiết đơn hàng #{String(order._id).slice(-6).toUpperCase()}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Thông tin đơn hàng và danh sách sản phẩm đã đặt.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <select
            value={order.status || "pending"}
            onChange={(event) => onStatusChange(order._id, event.target.value)}
            disabled={updatingOrderId === order._id}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard title="Thông tin khách hàng">
              <InfoRow label="Khách hàng" value={getOrderFullName(order) || "Đang cập nhật"} />
              <InfoRow
                label="Số điện thoại"
                value={getOrderPhoneNumber(order) || "Đang cập nhật"}
              />
              <InfoRow label="Địa chỉ giao hàng" value={formatOrderAddress(order)} />
              <InfoRow
                label="Ghi chú giao hàng"
                value={order.shippingInfo?.note || order.note || "Không có ghi chú"}
              />
            </InfoCard>

            <InfoCard title="Thanh toán & ghi chú">
              <InfoRow label="Ngày đặt" value={formatDateTime(order.createdAt)} />
              <InfoRow label="Trạng thái đơn" value={mapStatus(order.status)} />
              <InfoRow
                label="Phương thức thanh toán"
                value={formatPaymentMethod(order.paymentMethod)}
              />
              <InfoRow
                label="Trạng thái thanh toán"
                value={formatPaymentStatus(order.paymentStatus)}
              />
              <InfoRow label="Mã giao dịch" value={order.transactionId || "Không có"} />
            </InfoCard>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
              Danh sách sản phẩm
            </h3>

            <div className="mt-4 space-y-3">
              {(order.items || []).map((item, index) => (
                <div
                  key={`${item.productId || item.name}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.name || "Sản phẩm"}</p>
                    <p className="mt-1 text-sm text-slate-500">Số lượng: {item.quantity || 0}</p>
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
              ))}
              {!order.items?.length && (
                <p className="text-sm text-slate-500">Không có sản phẩm trong đơn hàng.</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
            Tổng kết đơn hàng
          </h3>

          <div className="mt-4 space-y-3">
            <SummaryRow label="Tạm tính" value={formatCurrency(subtotal)} />
            <SummaryRow label="Phí vận chuyển" value="Miễn phí" />
            <SummaryRow label="Giảm giá" value="0đ" />
          </div>

          <div className="mt-5 rounded-2xl bg-white px-4 py-4">
            <p className="text-sm text-slate-500">Tổng tiền</p>
            <p className="mt-2 text-3xl font-black text-blue-700">
              {formatCurrency(order.totalAmount)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
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

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(status)}`}>
      {mapStatus(status)}
    </span>
  );
}

function PaymentBadge({ paymentStatus }) {
  const badgeMap = {
    unpaid: {
      label: "Chưa thanh toán",
      className: "bg-slate-200 text-slate-700"
    },
    pending: {
      label: "Chờ xác nhận thanh toán",
      className: "bg-amber-100 text-amber-700"
    },
    paid: {
      label: "Đã thanh toán",
      className: "bg-emerald-100 text-emerald-700"
    },
    failed: {
      label: "Thanh toán thất bại",
      className: "bg-rose-100 text-rose-700"
    }
  };

  const badge = badgeMap[paymentStatus] || badgeMap.unpaid;

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.className}`}>
      {badge.label}
    </span>
  );
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

function mapStatus(status) {
  if (status === "confirmed") {
    return "Đã xác nhận";
  }

  if (status === "cancelled") {
    return "Đã hủy";
  }

  return "Chờ xác nhận";
}

function getStatusClass(status) {
  if (status === "confirmed") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "cancelled") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-amber-100 text-amber-700";
}

function formatCurrency(value) {
  return `${(Number(value) || 0).toLocaleString("vi-VN")}đ`;
}

function formatDate(value) {
  if (!value) {
    return "Đang cập nhật";
  }

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatDateTime(value) {
  if (!value) {
    return "Đang cập nhật";
  }

  const date = new Date(value);

  return `${date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  })} - ${date.toLocaleDateString("vi-VN")}`;
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

function getAdminApiErrorMessage(status, fallbackMessage) {
  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn hoặc thiếu token admin";
  }

  if (status === 403) {
    return "Bạn không có quyền admin để thực hiện thao tác này";
  }

  return fallbackMessage;
}

export default AdminOrdersPage;
