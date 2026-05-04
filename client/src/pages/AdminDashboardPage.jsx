const stats = [
  {
    title: "Tổng sản phẩm",
    value: "1,240",
    meta: "+12% so với tháng trước",
    tone: "text-emerald-600",
    icon: "smartphone"
  },
  {
    title: "Đơn hàng hôm nay",
    value: "15",
    meta: "+5 đơn mới",
    tone: "text-emerald-600",
    icon: "shopping_cart"
  },
  {
    title: "Doanh thu tạm tính",
    value: "450.000k",
    meta: "Chờ cập nhật cuối ngày",
    tone: "text-amber-600",
    icon: "payments"
  },
  {
    title: "Yêu cầu thu cũ",
    value: "8",
    meta: "3 yêu cầu cần xử lý",
    tone: "text-rose-600",
    icon: "swap_horizontal_circle"
  }
];

const weeklyBars = [
  { label: "Mon", value: 48 },
  { label: "Tue", value: 72 },
  { label: "Wed", value: 66 },
  { label: "Thu", value: 92, active: true },
  { label: "Fri", value: 78 },
  { label: "Sat", value: 52 },
  { label: "Sun", value: 74 }
];

const recentOrders = [
  {
    code: "#MH-2045",
    customer: "Nguyễn Văn A",
    product: "iPhone 15 Pro Max 256GB",
    total: "28.450.000đ",
    status: "Completed",
    date: "14:20 - 27/05"
  },
  {
    code: "#MH-2046",
    customer: "Trần Minh K",
    product: "Samsung Galaxy S24 Ultra",
    total: "24.990.000đ",
    status: "Pending",
    date: "10:35 - 27/05"
  },
  {
    code: "#MH-2047",
    customer: "Lê Thị H",
    product: "Xiaomi 14 12GB/256GB",
    total: "15.990.000đ",
    status: "Confirmed",
    date: "09:10 - 27/05"
  }
];

function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-sm text-slate-400">home / <span className="font-semibold text-blue-700">Dashboard Tổng Quan</span></p>
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
              <p className="mt-1 text-sm text-slate-500">Thống kê từ 20/05 - 27/05/2024</p>
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
          <h2 className="text-xl font-black text-slate-900">Chiến dịch Marketing</h2>
          <p className="mt-1 text-sm text-slate-500">Banner quảng bá tháng 6</p>

          <div className="mt-5 flex h-48 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            Banner
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-500">Lượt hiển thị</span>
              <span className="font-black text-slate-900">12,450</span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-slate-100">
              <div className="h-3 w-[72%] rounded-full bg-blue-800" />
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
                <tr key={order.code} className="border-t border-slate-100">
                  <td className="px-5 py-4 text-sm font-bold text-blue-700">{order.code}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-900">{order.customer}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{order.product}</td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-900">{order.total}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      order.status === "Completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : order.status === "Confirmed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
