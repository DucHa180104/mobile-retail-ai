import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl, resolveMediaUrl } from "../lib/api.js";

function AdminDashboardPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("30d"); // "7d", "30d", "1y"

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

  async function fetchAiInsights() {
    if (!token) return;
    try {
      setAiLoading(true);
      const response = await fetch(buildApiUrl("/api/chat/ai-insights"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAiInsights(data);
      }
    } catch (err) {
      console.error("AI Insights fetch error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  useEffect(() => {
    if (!loading && orders.length > 0) {
      fetchAiInsights();
    }
  }, [loading, orders.length, token]);

  // Derived Analytics Stats
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

  const successRate = useMemo(() => {
    if (orders.length === 0) return 100;
    const completed = orders.filter((o) => o.status === "confirmed").length;
    return Math.round((completed / orders.length) * 100);
  }, [orders]);

  const brandStats = useMemo(() => {
    const brandRevenue = {};
    let total = 0;
    orders.forEach((order) => {
      if (order.status !== "cancelled") {
        (order.items || []).forEach((item) => {
          const matched = products.find((p) => p._id === item.productId || p.name === item.name);
          const brandName = matched?.brand || "Khác";
          const subtotal = Number(item.price || 0) * Number(item.quantity || 1);
          brandRevenue[brandName] = (brandRevenue[brandName] || 0) + subtotal;
          total += subtotal;
        });
      }
    });

    if (total === 0) {
      return [
        { name: "Apple", pct: 60, val: 6000000 },
        { name: "Samsung", pct: 30, val: 3000000 },
        { name: "Xiaomi", pct: 10, val: 1000000 }
      ];
    }

    return Object.entries(brandRevenue)
      .map(([name, val]) => ({
        name,
        val,
        pct: Math.round((val / total) * 100)
      }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 3);
  }, [orders, products]);

  const totalSalesCount = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + (i.quantity || 1), 0), 0);
  }, [orders]);

  const uniqueCustomersCount = useMemo(() => {
    const names = new Set();
    orders.forEach((o) => {
      const name = o.shippingInfo?.fullName || o.customerName;
      if (name) names.add(name.trim());
    });
    return names.size || 0;
  }, [orders]);

  const donutSegments = useMemo(() => {
    let currentOffset = 0;
    const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"];
    return brandStats.map((brand, index) => {
      const pct = brand.pct;
      const strokeDasharray = `${(pct * 188.5) / 100} 188.5`;
      const strokeDashoffset = -currentOffset;
      currentOffset += (pct * 188.5) / 100;
      return {
        ...brand,
        strokeDasharray,
        strokeDashoffset,
        color: colors[index % colors.length]
      };
    });
  }, [brandStats]);

  // Selected range data array for SVG line chart
  const chartData = useMemo(() => {
    const now = new Date();
    const getStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (timeRange === "7d") {
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const start = getStartOfDay(d);
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

        const dayOrders = orders.filter((o) => {
          if (o.status === "cancelled" || !o.createdAt) return false;
          const od = new Date(o.createdAt);
          return od >= start && od < end;
        });

        const revenue = dayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        const phones = dayOrders.reduce((sum, o) => sum + (o.items || []).reduce((s, item) => s + Number(item.quantity || 1), 0), 0);

        data.push({
          label: d.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" }),
          revenue,
          phones
        });
      }
      return data;
    }

    if (timeRange === "30d") {
      const data = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const start = getStartOfDay(d);
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

        const dayOrders = orders.filter((o) => {
          if (o.status === "cancelled" || !o.createdAt) return false;
          const od = new Date(o.createdAt);
          return od >= start && od < end;
        });

        const revenue = dayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        const phones = dayOrders.reduce((sum, o) => sum + (o.items || []).reduce((s, item) => s + Number(item.quantity || 1), 0), 0);

        data.push({
          label: d.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" }),
          revenue,
          phones
        });
      }
      return data;
    }

    // Default "1y"
    const data = [];
    const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    const currentYear = now.getFullYear();

    for (let m = 0; m < 12; m++) {
      const monthOrders = orders.filter((o) => {
        if (o.status === "cancelled" || !o.createdAt) return false;
        const od = new Date(o.createdAt);
        return od.getFullYear() === currentYear && od.getMonth() === m;
      });

      const revenue = monthOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      const phones = monthOrders.reduce((sum, o) => sum + (o.items || []).reduce((s, item) => s + Number(item.quantity || 1), 0), 0);

      data.push({
        label: months[m],
        revenue,
        phones
      });
    }
    return data;
  }, [orders, timeRange]);

  const maxRevenue = useMemo(() => {
    const maxVal = Math.max(...chartData.map((d) => d.revenue), 1000000);
    return maxVal;
  }, [chartData]);

  const maxPhones = useMemo(() => {
    const maxVal = Math.max(...chartData.map((d) => d.phones), 5);
    return maxVal;
  }, [chartData]);

  const paddingLeft = 70;
  const paddingTop = 30;
  const chartWidth = 860;
  const chartHeight = 240;

  const pointsRevenue = useMemo(() => {
    return chartData.map((d, i) => {
      const x = paddingLeft + (i * chartWidth) / (chartData.length - 1);
      const revHeight = (d.revenue / maxRevenue) * chartHeight;
      const y = paddingTop + chartHeight - revHeight;
      return { x, y };
    });
  }, [chartData, maxRevenue]);

  const pathRevenue = useMemo(() => {
    if (pointsRevenue.length === 0) return "";
    const lineCoords = pointsRevenue.map(p => `${p.x} ${p.y}`).join(" L ");
    return `M ${paddingLeft} ${paddingTop + chartHeight} L ${lineCoords} L ${paddingLeft + chartWidth} ${paddingTop + chartHeight} Z`;
  }, [pointsRevenue]);

  const lineRevenue = useMemo(() => {
    if (pointsRevenue.length === 0) return "";
    return `M ${pointsRevenue.map(p => `${p.x} ${p.y}`).join(" L ")}`;
  }, [pointsRevenue]);

  const pointsPhones = useMemo(() => {
    return chartData.map((d, i) => {
      const x = paddingLeft + (i * chartWidth) / (chartData.length - 1);
      const phoneHeight = (d.phones / maxPhones) * chartHeight;
      const y = paddingTop + chartHeight - phoneHeight;
      return { x, y };
    });
  }, [chartData, maxPhones]);

  const pathPhones = useMemo(() => {
    if (pointsPhones.length === 0) return "";
    const lineCoords = pointsPhones.map(p => `${p.x} ${p.y}`).join(" L ");
    return `M ${paddingLeft} ${paddingTop + chartHeight} L ${lineCoords} L ${paddingLeft + chartWidth} ${paddingTop + chartHeight} Z`;
  }, [pointsPhones]);

  const linePhones = useMemo(() => {
    if (pointsPhones.length === 0) return "";
    return `M ${pointsPhones.map(p => `${p.x} ${p.y}`).join(" L ")}`;
  }, [pointsPhones]);

  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= 3; i++) {
      const y = paddingTop + (i * chartHeight) / 3;
      const revVal = maxRevenue - (i * maxRevenue) / 3;
      const phoneVal = maxPhones - (i * maxPhones) / 3;
      lines.push({
        y,
        revLabel: formatAxisCurrency(revVal),
        phoneLabel: `${Math.round(phoneVal)} máy`
      });
    }
    return lines;
  }, [maxRevenue, maxPhones]);

  const xAxisLabels = useMemo(() => {
    return chartData.map((d, i) => {
      const x = paddingLeft + (i * chartWidth) / (chartData.length - 1);
      const shouldShow =
        timeRange !== "30d" ||
        i === 0 ||
        i === chartData.length - 1 ||
        i % 6 === 0;
      return {
        label: d.label,
        x,
        shouldShow
      };
    });
  }, [chartData, timeRange]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl py-12 text-center space-y-3">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
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



  const revenueGoalPct = Math.min(Math.round((totalRevenue / 600000000) * 100), 100);
  const ordersGoalPct = Math.min(Math.round((orders.length / 50) * 100), 100);
  const inStockRatePct = products.length > 0 ? Math.round(((products.length - outOfStockCount) / products.length) * 100) : 100;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10 animate-fade-in">
      {/* Title & Welcome message */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Chào mừng trở lại! Dưới đây là tóm tắt tình hình kinh doanh của Mạnh Hương Mobile ngày hôm nay.
          </p>
        </div>
      </div>

      {/* Grid of 4 Top KPI Cards */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Revenue */}
        <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng doanh thu</span>
              <p className="text-2xl font-black text-slate-900 tracking-tight mt-1">{totalRevenue.toLocaleString("vi-VN")} đ</p>
              <span className="text-emerald-500 font-extrabold text-[10px] mt-1.5 block">▲ +12.5% vs tháng trước</span>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4.5 w-4.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
          </div>
          <div className="h-8 w-full mt-3">
            <svg className="h-full w-full text-emerald-400" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0,20 Q15,5 30,22 T60,8 T90,18 L100,5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </article>

        {/* Card 2: Active Customers */}
        <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khách mua hàng</span>
              <p className="text-2xl font-black text-slate-900 tracking-tight mt-1">{uniqueCustomersCount} khách</p>
              <span className="text-emerald-500 font-extrabold text-[10px] mt-1.5 block">▲ +8.2% vs tháng trước</span>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4.5 w-4.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
          </div>
          <div className="h-8 w-full mt-3">
            <svg className="h-full w-full text-teal-400" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0,25 Q20,10 40,20 T70,8 L100,12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </article>

        {/* Card 3: Total Orders */}
        <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng đơn hàng</span>
              <p className="text-2xl font-black text-slate-900 tracking-tight mt-1">{orders.length} đơn</p>
              <span className="text-rose-500 font-extrabold text-[10px] mt-1.5 block">▼ -3.1% vs tháng trước</span>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4.5 w-4.5">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </span>
          </div>
          <div className="h-8 w-full mt-3">
            <svg className="h-full w-full text-blue-450" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0,15 Q25,25 50,10 T80,18 L100,8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </article>

        {/* Card 4: Total Products */}
        <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sản phẩm đăng bán</span>
              <p className="text-2xl font-black text-slate-900 tracking-tight mt-1">{products.length} máy</p>
              <span className="text-emerald-500 font-extrabold text-[10px] mt-1.5 block">▲ +24.7% vs tháng trước</span>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4.5 w-4.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </span>
          </div>
          <div className="h-8 w-full mt-3">
            <svg className="h-full w-full text-amber-450" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0,28 Q30,15 60,25 T100,5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </article>
      </section>

      {/* Split Layout: 70% Left / 30% Right */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Big Area Wave Chart */}
        <section className="lg:col-span-2 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">Biến động chi tiết</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500">
                  <span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Doanh thu (đ)
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500">
                  <span className="h-2.5 w-2.5 rounded bg-blue-500" /> Số máy bán (máy)
                </span>
              </div>
            </div>
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setTimeRange("7d")}
                className={`rounded-lg px-4 py-1.5 text-xs font-black transition-all duration-200 ${
                  timeRange === "7d" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                7 Ngày
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("30d")}
                className={`rounded-lg px-4 py-1.5 text-xs font-black transition-all duration-200 ${
                  timeRange === "30d" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                30 Ngày
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("1y")}
                className={`rounded-lg px-4 py-1.5 text-xs font-black transition-all duration-200 ${
                  timeRange === "1y" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                1 Năm
              </button>
            </div>
          </div>

          <div className="relative w-full mt-6 h-[340px]">
            <svg className="h-full w-full" viewBox="0 0 1000 320">
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="gradPhones" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines and Left & Right Y axis labels */}
              {gridLines.map((line, idx) => (
                <g key={idx}>
                  {/* Grid line */}
                  <line
                    x1={paddingLeft}
                    y1={line.y}
                    x2={paddingLeft + chartWidth}
                    y2={line.y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray={idx === 3 ? "none" : "4 4"}
                  />
                  {/* Left Label (Revenue) */}
                  <text
                    x={paddingLeft - 8}
                    y={line.y + 3}
                    textAnchor="end"
                    className="text-[9px] font-black fill-slate-400"
                  >
                    {line.revLabel}
                  </text>
                  {/* Right Label (Phones count) */}
                  <text
                    x={paddingLeft + chartWidth + 8}
                    y={line.y + 3}
                    textAnchor="start"
                    className="text-[9px] font-black fill-slate-400"
                  >
                    {line.phoneLabel}
                  </text>
                </g>
              ))}

              {/* Area fills */}
              <path d={pathRevenue} fill="url(#gradRevenue)" className="transition-all duration-300" />
              <path d={pathPhones} fill="url(#gradPhones)" className="transition-all duration-300" />

              {/* Smooth curve lines */}
              <path
                d={lineRevenue}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
              <path
                d={linePhones}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />

              {/* X axis labels */}
              {xAxisLabels.map((lbl, idx) => {
                if (!lbl.shouldShow) return null;
                return (
                  <text
                    key={idx}
                    x={lbl.x}
                    y={paddingTop + chartHeight + 22}
                    textAnchor="middle"
                    className="text-[9px] font-black fill-slate-400"
                  >
                    {lbl.label}
                  </text>
                );
              })}
            </svg>
          </div>
        </section>

        {/* Right Column: Donut Brand Chart & Progress Goals */}
        <section className="space-y-6">
          {/* Brand Distribution Donut Chart */}
          <div className="flex flex-col items-center bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center w-full border-b border-slate-50 pb-3 mb-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Cơ cấu doanh số</h3>
                <p className="text-sm font-black text-slate-800 mt-0.5">Tỷ lệ theo hãng máy</p>
              </div>
            </div>

            <div className="relative flex items-center justify-center h-44 w-44">
              <svg viewBox="0 0 100 100" className="h-full w-full transform -rotate-90">
                {/* Background circle */}
                <circle cx="50" cy="50" r="30" fill="transparent" stroke="#f1f5f9" strokeWidth="9" />
                {/* Donut segments */}
                {donutSegments.map((seg, idx) => (
                  <circle
                    key={idx}
                    cx="50"
                    cy="50"
                    r="30"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="9"
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap={seg.pct > 3 ? "round" : "butt"}
                    className="transition-all duration-500"
                  />
                ))}
              </svg>
              {/* Center counter text */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-800">{totalSalesCount}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Đã bán</span>
              </div>
            </div>

            {/* Legend layout */}
            <div className="w-full grid grid-cols-2 gap-2 mt-5 text-[10px] font-bold">
              {donutSegments.map((seg, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-slate-650">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="truncate">{seg.name}</span>
                  <span className="ml-auto text-slate-400 font-extrabold">{seg.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Goal Tracker progress bars */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Chỉ tiêu tháng</h3>
              <p className="text-sm font-black text-slate-800 mt-0.5">Tiến độ hoàn thành mục tiêu</p>
            </div>

            <div className="space-y-4 text-[11px] font-bold">
              {/* Goal 1: Revenue progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Doanh thu đạt được</span>
                  <span className="text-blue-600">{revenueGoalPct}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${revenueGoalPct}%` }} />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>{totalRevenue.toLocaleString("vi-VN")} đ</span>
                  <span>Mục tiêu: 600M đ</span>
                </div>
              </div>

              {/* Goal 2: Orders count progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Đơn hàng đã chốt</span>
                  <span className="text-emerald-600">{ordersGoalPct}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-650 rounded-full transition-all duration-500" style={{ width: `${ordersGoalPct}%` }} />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>{orders.length} đơn</span>
                  <span>Mục tiêu: 50 đơn</span>
                </div>
              </div>

              {/* Goal 3: In-stock items rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Tỷ lệ hàng sẵn sàng</span>
                  <span className="text-purple-600">{inStockRatePct}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${inStockRatePct}%` }} />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Còn hàng: {products.length - outOfStockCount}/{products.length} máy</span>
                  <span>Hết hàng: {outOfStockCount}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* AI Assistant report space */}
      <section className="rounded-3xl border border-slate-100 bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-100/50 pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5 animate-pulse">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.096.813Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.071 4.929a10 10 0 0 0-14.142 0M12 3v3" />
              </svg>
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                Trợ Lý Phân Tích Gemini AI
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-black uppercase text-blue-700 tracking-wider">
                  Trí Tuệ Nhân Tạo
                </span>
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Khuyến nghị tự động tối ưu tồn kho và nhập hàng dựa trên dữ liệu thực tế.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchAiInsights}
            disabled={aiLoading || loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {aiLoading ? "Đang phân tích..." : "Yêu cầu phân tích lại"}
          </button>
        </div>

        <div className="mt-6">
          {aiLoading ? (
            <div className="space-y-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 animate-ping rounded-full bg-blue-600" />
                <p className="text-xs font-bold text-blue-600 animate-pulse">Gemini AI đang đọc dữ liệu đơn hàng và tồn kho để lập báo cáo...</p>
              </div>
              <div className="space-y-2.5">
                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ) : aiInsights?.importRecommendation || aiInsights?.inventoryWarning || aiInsights?.revenueAnalysis ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/15 p-4.5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-black text-blue-700">
                  <span>📦</span> Khuyến nghị Nhập hàng & Xu hướng (Re-stock Advice):
                </div>
                <p className="text-xs leading-relaxed text-slate-650 font-semibold">
                  {aiInsights.importRecommendation}
                </p>
              </div>

              <div className="rounded-2xl border border-rose-100 bg-rose-50/15 p-4.5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-black text-rose-700">
                  <span>⚠️</span> Cảnh báo Tồn kho & Giá cả (Clearance Advice):
                </div>
                <p className="text-xs leading-relaxed text-slate-655 font-semibold">
                  {aiInsights.inventoryWarning}
                </p>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-purple-50/15 p-4.5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-black text-purple-700">
                  <span>📈</span> Nhận định Doanh thu & Tối ưu hóa (Revenue Analysis):
                </div>
                <p className="text-xs leading-relaxed text-slate-660 font-semibold">
                  {aiInsights.revenueAnalysis}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 text-center text-xs font-semibold text-slate-400">
              Nhấn nút "Yêu cầu phân tích lại" ở trên để gọi Gemini AI tổng hợp dữ liệu và đưa ra khuyến nghị.
            </div>
          )}
        </div>
      </section>

      {/* Bottom Data Table */}
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 bg-slate-50/50">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Bảng theo dõi đơn hàng</h2>
            <p className="text-sm font-black text-slate-900 mt-0.5">Danh sách Đơn hàng mới nhận gần nhất</p>
          </div>
          <span className="rounded-full bg-blue-50 border border-blue-100 px-3.5 py-1 text-xs font-bold text-blue-750">
            {recentOrders.length} đơn hàng mới
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-150 text-left">
            <thead className="bg-slate-50/30 text-xs font-bold uppercase tracking-widest text-slate-450">
              <tr>
                <th className="px-6 py-4">Khách hàng / Mã đơn</th>
                <th className="px-6 py-4">Ảnh máy đặt</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Tiến độ thanh toán</th>
                <th className="px-6 py-4">Thời gian đặt</th>
                <th className="px-6 py-4">Độ ưu tiên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-650 font-medium">
              {recentOrders.map((order) => {
                const totalAmount = Number(order.totalAmount || 0);
                const starsCount = totalAmount > 25000000 ? 5 : totalAmount > 15000000 ? 4 : totalAmount > 5000000 ? 3 : 2;
                const isPaidPrepaid = order.paymentMethod === "bank_transfer" || order.paymentMethod === "online_mock";

                return (
                  <tr key={order._id} className="hover:bg-slate-50/30 transition">
                    <td className="px-6 py-4.5">
                      <div>
                        <p className="font-extrabold text-slate-900">{order.shippingInfo?.fullName || "Khách vãng lai"}</p>
                        <p className="text-[10px] text-blue-600 font-bold mt-0.5">#{String(order._id).slice(-6).toUpperCase()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center -space-x-2">
                        {(order.items || []).slice(0, 3).map((item, idx) => (
                          <img
                            key={idx}
                            src={resolveMediaUrl(item.image) || "https://via.placeholder.com/80?text=Phone"}
                            alt={item.name}
                            style={{ width: "40px", height: "40px" }}
                            className="rounded-full border-2 border-white object-cover shadow-sm bg-white shrink-0"
                          />
                        ))}
                        {(order.items || []).length > 3 && (
                          <span
                            style={{ width: "40px", height: "40px" }}
                            className="flex items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[9px] font-black text-slate-500 shadow-sm shrink-0"
                          >
                            +{(order.items || []).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold border ${getStatusClass(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>{isPaidPrepaid ? "Đã thanh toán" : "COD nhận hàng"}</span>
                          <span>{isPaidPrepaid ? "100%" : "0%"}</span>
                        </div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${isPaidPrepaid ? "bg-emerald-500" : "bg-slate-300"} rounded-full`} style={{ width: isPaidPrepaid ? "100%" : "0%" }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-slate-400 font-semibold">
                      {formatOrderDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="text-amber-400 font-bold tracking-tight">
                        {"★".repeat(starsCount)}
                        <span className="text-slate-200">{"★".repeat(5 - starsCount)}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}

              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-semibold">
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

function formatStatus(status) {
  if (status === "confirmed") return "Đã duyệt";
  if (status === "cancelled") return "Hủy bỏ";
  return "Chờ xác nhận";
}

function getStatusClass(status) {
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700 border-emerald-150";
  if (status === "cancelled") return "bg-rose-50 text-rose-700 border-rose-150";
  return "bg-amber-50 text-amber-700 border-amber-150";
}

function formatOrderDate(value) {
  if (!value) return "Chưa rõ";
  const date = new Date(value);
  return date.toLocaleDateString("vi-VN", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getAdminApiErrorMessage(status, fallbackMessage) {
  if (status === 401) return "Phiên đăng nhập đã hết hạn hoặc thiếu token admin.";
  if (status === 403) return "Bạn không có quyền admin để truy cập dữ liệu này.";
  return fallbackMessage;
}

function formatAxisCurrency(val) {
  if (val === 0) return "0đ";
  if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}B`;
  if (val >= 1000000) return `${(val / 1000000).toFixed(0)}Tr`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return `${val}đ`;
}

export default AdminDashboardPage;
