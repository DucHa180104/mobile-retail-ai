import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

function AdminUsersPage() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [token]);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(buildApiUrl("/api/admin/users"), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải danh sách người dùng");
      }

      setUsers(data.users || []);
    } catch (fetchError) {
      setError(fetchError.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, nextRole) {
    try {
      setUpdatingUserId(userId);
      setError("");
      setMessage("");

      const response = await fetch(buildApiUrl(`/api/admin/users/${userId}/role`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          role: nextRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể cập nhật quyền");
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === userId ? data.user : user))
      );
      setMessage(`Đã cập nhật quyền thành ${formatRole(nextRole)}`);
    } catch (updateError) {
      setError(updateError.message || "Không thể cập nhật quyền");
    } finally {
      setUpdatingUserId("");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-slate-600">Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-sm text-slate-400">
          admin / <span className="font-semibold text-blue-700">Người dùng</span>
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Quản lý người dùng</h1>
        <p className="mt-2 text-sm text-slate-500">
          Xem danh sách tài khoản và đổi quyền user/admin trực tiếp từ giao diện.
        </p>
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-black text-slate-900">Danh sách người dùng</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              <tr>
                <th className="px-5 py-4">Tên</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Quyền</th>
                <th className="px-5 py-4">Ngày tạo</th>
                <th className="px-5 py-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isCurrentAdmin = currentUser?.id === user.id;

                return (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{user.name}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${getRoleBadgeClass(user.role)}`}>
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={user.role}
                          disabled={isCurrentAdmin || updatingUserId === user.id}
                          onChange={(event) => handleRoleChange(user.id, event.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>

                        {isCurrentAdmin && (
                          <span className="text-xs font-semibold text-amber-600">
                            Tài khoản hiện tại
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-sm text-slate-500">
                    Chưa có người dùng nào để hiển thị.
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

function formatRole(role) {
  return role === "admin" ? "Admin" : "User";
}

function getRoleBadgeClass(role) {
  return role === "admin"
    ? "bg-blue-100 text-blue-700"
    : "bg-slate-100 text-slate-700";
}

function formatDate(value) {
  if (!value) {
    return "Đang cập nhật";
  }

  return new Date(value).toLocaleDateString("vi-VN");
}

export default AdminUsersPage;
