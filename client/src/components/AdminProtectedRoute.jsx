import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function AdminProtectedRoute({ children }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
            Truy cập bị từ chối
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-900">
            Bạn không có quyền truy cập trang này
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Vui lòng đăng nhập bằng tài khoản admin để tiếp tục.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

export default AdminProtectedRoute;
