import { useEffect, useMemo, useState } from "react";

function AdminDashboardPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError("");

        const [productsResponse, ordersResponse] = await Promise.all([
          fetch("http://localhost:5000/api/products"),
          fetch("http://localhost:5000/api/orders")
        ]);

        if (!productsResponse.ok) {
          throw new Error("Không thể tải dữ liệu sản phẩm");
        }

        if (!ordersResponse.ok) {
          throw new Error("Không thể tải dữ liệu đơn hàng");
        }

        const [productsData, ordersData] = await Promise.all([
          productsResponse.json(),
          ordersResponse.json()
        ]);

        setProducts(productsData);
        setOrders(ordersData);
      } catch (fetchError) {
        setError(fetchError.message || "Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [orders]);

  const weeklyBars = useMemo(() => {
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(today.getDate() + mondayOffset);

    const buckets = dayLabels.map((label, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        label,
        dateKey: date.toISOString().slice(0, 10),
        revenue: 0
      };
    });

    orders.forEach((order) => {
      if (!order.createdAt) {
        return;
      }

      const orderDateKey = new Date(order.createdAt).toISOString().slice(0, 10);
      const bucket = buckets.find((item) => item.dateKey === orderDateKey);

      if (bucket) {
        bucket.revenue += Number(order.totalAmount) || 0;
      }
    });

    const maxRevenue = Math.max(...buckets.map((item) => item.revenue), 1);
    const activeLabel = dayLabels[currentDay === 0 ? 6 : currentDay - 1];

    return buckets.map((item) => ({
      label: item.label,
      value: item.revenue > 0 ? Math.max((item.revenue / maxRevenue) * 100, 18) : 18,
      active: item.label === activeLabel
    }));
  }, [orders]);

  const stats = [
    {
      title: "Tổng sản phẩm",
      value: products.length.toLocaleString("vi-VN"),
      meta: `${products.length} sản phẩm hiện có`,
      tone: "text-emerald-600",
      icon: "smartphone"
    },
    {
      title: "Tổng đơn hàng",
      value: orders.length.toLocaleString("vi-VN"),
      meta: `${recentOrders.length} đơn gần đây`,
      tone: "text-emerald-600",
      icon: "shopping_cart"
    },
    {
      title: "Doanh thu tạm tính",
      value: formatCompactVnd(totalRevenue),
      meta: "Tính từ toàn bộ đơn hàng",
      tone: "text-amber-600",
      icon: "payments"
    },
    {
      title: "Yêu cầu thu cũ",
      value: "0",
      meta: "Chưa kết nối dữ liệu thu cũ",
      tone: "text-slate-500",
      icon: "swap_horizontal_circle"
    }
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-slate-600">Đang tải dữ liệu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
          home / <span className="font-semibold text-blue-700">Dashboard Tổng Quan</span>
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Dashboard Tổng Quan</h1>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{stat.title}</p>
                <p className="mt-3 text-4xl font-black text-slate-900">{stat.value}</p>
              </div>
              <span className="text-sm font-semibold text-slate-300">{stat.icon}</span>
            </div>
            <p className={`mt-5 text-sm font-semibold ${stat.tone}`}>{stat.meta}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.6fr_0.75fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Biểu đồ doanh thu tuần</h2>
              <p className="mt-1 text-sm text-slate-500">Thống kê 7 ngày trong tuần hiện tại</p>
            </div>
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
            >
              7 ngày qua
            </button>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 px-5 py-6">
            <div className="flex h-64 items-end gap-4">
              {weeklyBars.map((bar) => (
                <div key={bar.label} className="flex flex-1 flex-col items-center gap-3">
                  <div
                    className={`w-full rounded-t-xl ${
                      bar.active ? "bg-blue-800" : "bg-slate-200"
                    }`}
                    style={{ height: `${bar.value}%` }}
                  />
                  <span className="text-xs font-bold uppercase text-slate-400">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Tóm tắt đơn hàng</h2>
          <p className="mt-1 text-sm text-slate-500">Dựa trên dữ liệu đơn hàng hiện tại</p>

          <div className="mt-5 flex h-48 flex-col justify-center rounded-2xl bg-slate-100 px-6 text-center">
            <p className="text-sm font-semibold text-slate-500">Đơn hàng gần đây</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{recentOrders.length}</p>
            <p className="mt-2 text-sm text-slate-500">Hiển thị 5 đơn mới nhất</p>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-500">Tỷ lệ hoàn thành</span>
              <span className="font-black text-slate-900">
                {getCompletionRate(orders)}%
              </span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full bg-blue-800"
                style={{ width: `${getCompletionRate(orders)}%` }}
              />
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-black text-slate-900">Đơn hàng gần đây</h2>
          <button type="button" className="text-sm font-semibold text-blue-700">
            Xem tất cả
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              <tr>
                <th className="px-5 py-4">Mã đơn</th>
                <th className="px-5 py-4">Khách hàng</th>
                <th className="px-5 py-4">Sản phẩm</th>
                <th className="px-5 py-4">Tổng tiền</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Ngày đặt</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order._id} className="border-t border-slate-100">
                  <td className="px-5 py-4 text-sm font-bold text-blue-700">
                    #{String(order._id).slice(-6).toUpperCase()}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                    {order.customerName || "Khách hàng"}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatOrderProducts(order.items)}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-900">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatOrderDate(order.createdAt)}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    Chưa có đơn hàng nào để hiển thị.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function formatCurrency(value) {
  return `${(Number(value) || 0).toLocaleString("vi-VN")}đ`;
}

function formatCompactVnd(value) {
  return `${(Number(value) || 0).toLocaleString("vi-VN")}đ`;
}

function formatOrderProducts(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return "Đang cập nhật";
  }

  if (items.length === 1) {
    return items[0].name || "Sản phẩm";
  }

  return `${items[0].name || "Sản phẩm"} +${items.length - 1}`;
}

function formatStatus(status) {
  if (status === "confirmed") {
    return "Confirmed";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  return "Pending";
}

function getStatusClass(status) {
  if (status === "confirmed") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "cancelled") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-amber-100 text-amber-700";
}

function formatOrderDate(value) {
  if (!value) {
    return "Đang cập nhật";
  }

  const date = new Date(value);

  return `${date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  })} - ${date.toLocaleDateString("vi-VN")}`;
}

function getCompletionRate(orders) {
  if (!orders.length) {
    return 0;
  }

  const completedOrders = orders.filter((order) => order.status === "confirmed").length;
  return Math.round((completedOrders / orders.length) * 100);
}

export default AdminDashboardPage;
