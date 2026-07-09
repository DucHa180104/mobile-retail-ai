import { NavLink, Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar.jsx";
import AdminTopbar from "../components/admin/AdminTopbar.jsx";

function AdminLayout() {
  const quickLinks = [
    { label: "Tổng quan", to: "/admin/dashboard" },
    { label: "Nhật ký Chatbot", to: "/admin/chatbot-logs" },
    { label: "Chat hỗ trợ", to: "/admin/support-chat" },
    { label: "Cài đặt", to: "/admin/settings" },
    { label: "Đơn hàng", to: "/admin/orders" },
    { label: "Sản phẩm", to: "/admin/products" },
    { label: "Người dùng", to: "/admin/users" }
  ];

  return (
    <div className="h-screen overflow-hidden bg-slate-100">
      <div className="flex h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminTopbar />
          <div className="shrink-0 border-b border-slate-200/60 bg-white px-4 py-3.5 sm:px-6 lg:px-8">
            <nav className="flex flex-wrap gap-2.5">
              {quickLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-2 text-[10px] font-bold tracking-wider uppercase transition-all duration-200 focus:outline-none ${
                      isActive
                        ? "border border-blue-200/60 bg-white text-blue-600 shadow-sm ring-2 ring-blue-100/50"
                        : "border border-slate-200/40 bg-slate-50 text-slate-550 hover:bg-white hover:text-slate-800 hover:shadow-sm focus:ring-2 focus:ring-slate-200"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
