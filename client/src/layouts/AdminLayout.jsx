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
          <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
            <nav className="flex flex-wrap gap-2">
              {quickLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
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
