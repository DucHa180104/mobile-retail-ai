import { NavLink, Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar.jsx";
import AdminTopbar from "../components/admin/AdminTopbar.jsx";

function AdminLayout() {
  const quickLinks = [
    { label: "Dashboard", to: "/admin/dashboard" },
    { label: "Chatbot Logs", to: "/admin/chatbot-logs" },
    { label: "Orders", to: "/admin/orders" },
    { label: "Products", to: "/admin/products" },
    { label: "Users", to: "/admin/users" }
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <div className="border-b border-slate-200/60 bg-white px-4 py-3.5 sm:px-6 lg:px-8">
            <nav className="flex flex-wrap gap-2.5">
              {quickLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-2 text-[10px] font-bold tracking-wider uppercase transition-all duration-200 focus:outline-none ${
                      isActive
                        ? "bg-white text-blue-600 border border-blue-200/60 shadow-sm ring-2 ring-blue-100/50"
                        : "bg-slate-50 text-slate-550 border border-slate-200/40 hover:bg-white hover:text-slate-800 hover:shadow-sm focus:ring-2 focus:ring-slate-200"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
