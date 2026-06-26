import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

function AdminDashboardPage() {
  const { token } = useAuth();
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
          fetch(buildApiUrl("/api/products?page=1&limit=1000")),
          fetch(buildApiUrl("/api/orders"), {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
        ]);

        if (!productsResponse.ok) {
          throw new Error("Không thể tải dữ liệu sản phẩm.");
        }

        if (!ordersResponse.ok) {
          throw new Error(
            getAdminApiErrorMessage(
              ordersResponse.status,
              "Không thể tải dữ liệu đơn hàng."
            )
          );
        }

        const [productsData, ordersData] = await Promise.all([
          productsResponse.json(),
          ordersResponse.json()
        ]);

        const productList = Array.isArray(productsData)
          ? productsData
          : productsData.products || [];

        setProducts(productList);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (fetchError) {
        setError(fetchError.message || "Không thể tải dữ liệu dashboard.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [token]);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0),
    [orders]
  );

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [orders]);

  const outOfStockCount = useMemo(
    () => products.filter((product) => (Number(product.stock) || 0) === 0).length,
    [products]
  );

  const lowStockCount = useMemo(
    () =>
      products.filter((product) => {
        const stock = Number(product.stock) || 0;
        return stock > 0 && stock <= 5;
      }).length,
      [products]
  );

  const lowStockProducts = useMemo(() => {
    return [...products]
      .filter((product) => (Number(product.stock) || 0) <= 5)
      .sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0))
      .slice(0, 5);
  }, [products]);

  const weeklyBars = useMemo(() => {
    const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
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
      active: item.label === activeLabel,
      revenueText: formatCurrency(item.revenue)
    }));
  }, [orders]);

  const stats = [
    {
      title: "Tổng sản phẩm",
      value: products.length.toLocaleString("vi-VN"),
      meta: "Đang lưu trữ trên hệ thống",
      icon: "📦",
      colorClass: "bg-indigo-50 border-indigo-100 text-indigo-700"
    },
    {
      title: "Hết hàng",
      value: outOfStockCount.toLocaleString("vi-VN"),
      meta: "Cần nhập máy gấp",
      icon: "⚠️",
      colorClass: "bg-rose-50 border-rose-100 text-rose-700"
    },
    {
      title: "Sắp hết",
      value: lowStockCount.toLocaleString("vi-VN"),
      meta: "Tồn kho nhỏ hơn hoặc bằng 5",
      icon: "⏳",
      colorClass: "bg-amber-50 border-amber-100 text-amber-700"
    },
    {
      title: "Doanh thu tạm tính",
      value: formatCurrency(totalRevenue),
      meta: "Cộng dồn từ đơn hàng",
      icon: "💰",
      colorClass: "bg-emerald-50 border-emerald-100 text-emerald-700"
    }
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl py-12 text-center space-y-3">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm font-semibold text-slate-500">Đang tải dữ liệu dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl py-12">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <p className="font-bold text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      
      {/* Title block */}
      <div>
        <p className="text-xs font-semibold text-indigo-650 uppercase tracking-wider">
          Trang quản trị / <span className="font-black text-indigo-750">Tổng quan</span>
        </p>
        <h1 className="mt-1.5 text-3xl font-black text-slate-900 tracking-tight">Dashboard quản lý</h1>
        <p className="text-sm text-slate-500">
          Thống kê kết quả kinh doanh tạm tính, theo dõi lượng tồn kho và thông tin đơn hàng mới.
        </p>
      </div>

      {/* Stats Cards Row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.title}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.title}</p>
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold ${stat.colorClass}`}>
                {stat.icon}
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
            <p className="text-[11px] font-semibold text-slate-400 pt-1 border-t border-slate-50">{stat.meta}</p>
          </article>
        ))}
      </section>

      {/* Graphs & Warning Panels */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        
        {/* Weekly Revenue Graph */}
        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-slate-55 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">Doanh thu theo tuần</h2>
              <p className="text-xs text-slate-400">Ước tính doanh thu các ngày trong tuần hiện tại</p>
            </div>
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-600">
              Tuần này
            </span>
          </div>

          <div className="rounded-2xl bg-slate-50/70 border border-slate-100 p-6">
            <div className="flex h-64 items-end gap-3.5 sm:gap-5">
              {weeklyBars.map((bar) => (
                <div key={bar.label} className="group flex flex-1 flex-col items-center gap-2 relative">
                  
                  {/* Tooltip on hover */}
                  <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-900 text-white font-extrabold text-[9px] px-2 py-1 rounded shadow pointer-events-none z-10 whitespace-nowrap">
                    {bar.revenueText}
                  </span>
                  
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      bar.active 
                        ? "bg-gradient-to-t from-indigo-650 to-indigo-500 shadow-sm" 
                        : "bg-slate-250 group-hover:bg-slate-300"
                    }`}
                    style={{ height: `${bar.value}%` }}
                  />
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-700">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* Low Stock Watch */}
        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-55 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">Cảnh báo tồn kho</h2>
            <p className="text-xs text-slate-400">5 mẫu máy sắp hết hàng hoặc đã hết</p>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-400 font-semibold border border-dashed border-slate-200">
              ✨ Mọi thứ đều dồi dào! Tồn kho ổn định.
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 bg-slate-50/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800">
                      {product.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                      Hãng: {normalizeBrand(product.brand)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-700">
                      Tồn: {Number(product.stock) || 0}
                    </span>
                    <StockStatusBadge stock={product.stock} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      {/* Recent Orders List Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4.5 bg-slate-50/50">
          <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">Đơn hàng mới nhận</h2>
          <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
            {recentOrders.length} đơn hàng mới nhất
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50/30 text-xs font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Mã đơn</th>
                <th className="px-5 py-3.5">Khách hàng</th>
                <th className="px-5 py-3.5">Chi tiết máy</th>
                <th className="px-5 py-3.5">Tổng tiền</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {recentOrders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3.5 font-bold text-indigo-600">
                    #{String(order._id).slice(-6).toUpperCase()}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">
                    {order.customerName || "Khách mua lẻ"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-normal">
                    {formatOrderProducts(order.items)}
                  </td>
                  <td className="px-5 py-3.5 font-extrabold text-slate-800">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold border ${getStatusClass(order.status)}`}
                    >
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">
                    {formatOrderDate(order.createdAt)}
                  </td>
                </tr>
              ))}

              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-400 font-semibold">
                    Chưa có đơn hàng nào phát sinh trên hệ thống.
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

function StockStatusBadge({ stock }) {
  const stockNumber = Number(stock) || 0;
  const { label, className } = getStockStatusMeta(stockNumber);

  return (
    <span className={`rounded-md border px-2 py-0.5 text-[9px] font-extrabold uppercase ${className}`}>
      {label}
    </span>
  );
}

function getStockStatusMeta(stock) {
  if (stock === 0) {
    return {
      label: "Hết hàng",
      className: "bg-rose-50 text-rose-700 border-rose-150"
    };
  }

  if (stock > 0 && stock <= 5) {
    return {
      label: "Sắp hết",
      className: "bg-amber-50 text-amber-700 border-amber-150"
    };
  }

  return {
    label: "Còn hàng",
    className: "bg-emerald-50 text-emerald-700 border-emerald-150"
  };
}

function normalizeBrand(brand) {
  if (!brand) {
    return "Khác";
  }
  return brand;
}

function formatCurrency(value) {
  return `${(Number(value) || 0).toLocaleString("vi-VN")}đ`;
}

function formatOrderProducts(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return "Không rõ sản phẩm";
  }

  if (items.length === 1) {
    return items[0].name || "Sản phẩm";
  }

  return `${items[0].name || "Sản phẩm"} (+${items.length - 1})`;
}

function formatStatus(status) {
  if (status === "confirmed") {
    return "Đã duyệt";
  }

  if (status === "cancelled") {
    return "Hủy bỏ";
  }

  return "Chờ xác nhận";
}

function getStatusClass(status) {
  if (status === "confirmed") {
    return "bg-emerald-50 text-emerald-700 border-emerald-150";
  }

  if (status === "cancelled") {
    return "bg-rose-50 text-rose-700 border-rose-150";
  }

  return "bg-amber-50 text-amber-700 border-amber-150";
}

function formatOrderDate(value) {
  if (!value) {
    return "Chưa rõ";
  }

  const date = new Date(value);

  return `${date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  })} ${date.toLocaleDateString("vi-VN")}`;
}

function getAdminApiErrorMessage(status, fallbackMessage) {
  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn hoặc thiếu token admin.";
  }

  if (status === 403) {
    return "Bạn không có quyền admin để truy cập dữ liệu này.";
  }

  return fallbackMessage;
}

export default AdminDashboardPage;
