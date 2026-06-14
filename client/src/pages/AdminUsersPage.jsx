import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

const USERS_PER_PAGE = 8;

function AdminUsersPage() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleConfirmData, setRoleConfirmData] = useState(null);
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [token]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, roleFilter]);

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

  function askRoleChangeConfirmation(user, nextRole) {
    if (user.role === nextRole) {
      return;
    }

    setRoleConfirmData({
      userId: user.id,
      userName: user.name,
      currentRole: user.role,
      nextRole
    });
  }

  async function confirmRoleChange() {
    if (!roleConfirmData) {
      return;
    }

    try {
      setUpdatingUserId(roleConfirmData.userId);
      setError("");
      setMessage("");

      const response = await fetch(buildApiUrl(`/api/admin/users/${roleConfirmData.userId}/role`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          role: roleConfirmData.nextRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể cập nhật quyền");
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === roleConfirmData.userId ? data.user : user))
      );

      setSelectedUser((currentSelectedUser) =>
        currentSelectedUser?.id === roleConfirmData.userId ? data.user : currentSelectedUser
      );

      setStatusModalUser((currentStatusUser) =>
        currentStatusUser?.id === roleConfirmData.userId ? data.user : currentStatusUser
      );

      setMessage(`Đã cập nhật quyền thành ${formatRole(roleConfirmData.nextRole)}`);
      setRoleConfirmData(null);
    } catch (updateError) {
      setError(updateError.message || "Không thể cập nhật quyền");
    } finally {
      setUpdatingUserId("");
    }
  }

  function openBanModal(user) {
    setBanReason("");
    setStatusModalUser(user);
  }

  async function handleLockUser() {
    if (!statusModalUser) {
      return;
    }

    try {
      setUpdatingUserId(statusModalUser.id);
      setError("");
      setMessage("");

      const response = await fetch(buildApiUrl(`/api/admin/users/${statusModalUser.id}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          isActive: false,
          banReason
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể khóa tài khoản");
      }

      updateUserInState(data.user);
      setMessage("Khóa tài khoản thành công");
      setStatusModalUser(null);
      setBanReason("");
    } catch (statusError) {
      setError(statusError.message || "Không thể khóa tài khoản");
    } finally {
      setUpdatingUserId("");
    }
  }

  async function handleUnlockUser(user) {
    const confirmed = window.confirm(`Bạn có chắc muốn mở khóa tài khoản "${user.name}" không?`);

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingUserId(user.id);
      setError("");
      setMessage("");

      const response = await fetch(buildApiUrl(`/api/admin/users/${user.id}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          isActive: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể mở khóa tài khoản");
      }

      updateUserInState(data.user);
      setMessage("Mở khóa tài khoản thành công");
    } catch (statusError) {
      setError(statusError.message || "Không thể mở khóa tài khoản");
    } finally {
      setUpdatingUserId("");
    }
  }

  function updateUserInState(nextUser) {
    setUsers((currentUsers) =>
      currentUsers.map((user) => (user.id === nextUser.id ? nextUser : user))
    );

    setSelectedUser((currentSelectedUser) =>
      currentSelectedUser?.id === nextUser.id ? nextUser : currentSelectedUser
    );
  }

  const filteredUsers = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === "all" ? true : user.role === roleFilter;

      if (!matchesRole) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      const searchableText = [user.name, user.email, user.phoneNumber].join(" ").toLowerCase();
      return searchableText.includes(normalizedKeyword);
    });
  }, [users, searchKeyword, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, safeCurrentPage]);

  const stats = useMemo(() => {
    const adminCount = users.filter((user) => user.role === "admin").length;
    const userCount = users.filter((user) => user.role === "user").length;
    const lockedCount = users.filter((user) => user.isActive === false).length;

    return [
      {
        label: "Tổng tài khoản",
        value: users.length,
        tone: "bg-slate-900 text-white"
      },
      {
        label: "Quản trị viên",
        value: adminCount,
        tone: "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
      },
      {
        label: "Khách hàng",
        value: userCount,
        tone: "bg-slate-100 text-slate-900"
      },
      {
        label: "Tài khoản bị khóa",
        value: lockedCount,
        tone: "bg-rose-50 text-rose-700"
      }
    ];
  }, [users]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-slate-600">Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-slate-400">
              admin / <span className="font-semibold text-blue-700">Người dùng</span>
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">
              User Management Dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Quản lý danh sách tài khoản, tìm kiếm nhanh, cập nhật quyền và khóa hoặc mở khóa tài
              khoản trực tiếp từ giao diện.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Kết quả hiển thị
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {filteredUsers.length.toLocaleString("vi-VN")}
            </p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className={`rounded-[1.5rem] p-5 shadow-sm ${stat.tone}`}>
              <p className="text-sm font-semibold opacity-80">{stat.label}</p>
              <p className="mt-3 text-4xl font-black">{stat.value.toLocaleString("vi-VN")}</p>
            </article>
          ))}
        </section>

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

        <section className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Danh sách người dùng</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tìm kiếm theo họ tên, email, số điện thoại và lọc theo vai trò.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 md:flex-row lg:w-auto">
                <label className="relative block w-full md:min-w-[320px]">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                    <SearchIcon />
                  </span>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(event) => setSearchKeyword(event.target.value)}
                    placeholder="Tìm theo tên, email hoặc số điện thoại..."
                    className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>

                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="admin">Admin</option>
                  <option value="user">Khách hàng</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  <th className="px-5 py-4">Người dùng</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Số điện thoại</th>
                  <th className="px-5 py-4">Vai trò</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4">Ngày tạo</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => {
                  const isCurrentAdmin = currentUser?.id === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700">
                            {getUserInitials(user.name)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">
                              {user.phoneNumber || "Chưa cập nhật số điện thoại"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{user.email}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {user.phoneNumber || "Chưa có"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getRoleBadgeClass(
                            user.role
                          )}`}
                        >
                          {formatRole(user.role)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                            user.isActive
                          )}`}
                        >
                          {user.isActive ? "Hoạt động" : "Bị khóa"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                          >
                            Xem chi tiết
                          </button>

                          <select
                            value={user.role}
                            disabled={isCurrentAdmin || updatingUserId === user.id}
                            onChange={(event) => askRoleChangeConfirmation(user, event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>

                          {user.isActive ? (
                            <button
                              type="button"
                              disabled={isCurrentAdmin || updatingUserId === user.id}
                              onClick={() => openBanModal(user)}
                              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Khóa tài khoản
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isCurrentAdmin || updatingUserId === user.id}
                              onClick={() => handleUnlockUser(user)}
                              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Mở khóa
                            </button>
                          )}

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

                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center text-sm text-slate-500">
                      Không tìm thấy người dùng phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-500">
              Hiển thị{" "}
              <span className="font-semibold text-slate-900">{paginatedUsers.length}</span> /{" "}
              <span className="font-semibold text-slate-900">{filteredUsers.length}</span> người
              dùng
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={safeCurrentPage === 1}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition ${
                    page === safeCurrentPage
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                disabled={safeCurrentPage === totalPages}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </section>
      </div>

      {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}

      {roleConfirmData && (
        <ConfirmModal
          title="Xác nhận đổi quyền"
          description={`Bạn có chắc muốn đổi "${roleConfirmData.userName}" từ ${formatRole(
            roleConfirmData.currentRole
          )} sang ${formatRole(roleConfirmData.nextRole)} không?`}
          confirmText="Xác nhận đổi quyền"
          onCancel={() => setRoleConfirmData(null)}
          onConfirm={confirmRoleChange}
        />
      )}

      {statusModalUser && (
        <BanUserModal
          user={statusModalUser}
          banReason={banReason}
          onChangeBanReason={setBanReason}
          onClose={() => {
            setStatusModalUser(null);
            setBanReason("");
          }}
          onConfirm={handleLockUser}
          loading={updatingUserId === statusModalUser.id}
        />
      )}
    </>
  );
}

function UserDetailModal({ user, onClose }) {
  const hasShippingInfo = Object.values(user.shippingInfo || {}).some((value) =>
    String(value || "").trim()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="w-full max-w-2xl rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-lg font-black text-blue-700">
              {getUserInitials(user.name)}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
                Chi tiết người dùng
              </p>
              <h3 className="mt-1 text-2xl font-black text-slate-900">{user.name}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Đóng
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <DetailCard label="Họ tên" value={user.name} />
            <DetailCard label="Email" value={user.email} />
            <DetailCard label="Số điện thoại" value={user.phoneNumber || "Chưa cập nhật"} />
            <DetailCard label="Vai trò" value={formatRole(user.role)} badgeClass={getRoleBadgeClass(user.role)} />
            <DetailCard label="Trạng thái" value={user.isActive ? "Hoạt động" : "Bị khóa"} badgeClass={getStatusBadgeClass(user.isActive)} />
            <DetailCard label="Ngày tạo" value={formatDateTime(user.createdAt)} />
            {!user.isActive && (
              <DetailCard
                label="Lý do khóa"
                value={user.banReason || "Không có"}
              />
            )}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <h4 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
              Thông tin giao hàng
            </h4>

            {hasShippingInfo ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <DetailRow label="Người nhận" value={user.shippingInfo?.fullName || "Chưa cập nhật"} />
                <DetailRow label="Số điện thoại" value={user.shippingInfo?.phoneNumber || "Chưa cập nhật"} />
                <DetailRow label="Địa chỉ" value={user.shippingInfo?.address || "Chưa cập nhật"} />
                <DetailRow label="Thành phố" value={user.shippingInfo?.city || "Chưa cập nhật"} />
                <DetailRow label="Quận/Huyện" value={user.shippingInfo?.district || "Chưa cập nhật"} />
                <DetailRow label="Phường/Xã" value={user.shippingInfo?.ward || "Chưa cập nhật"} />
                <DetailRow label="Ghi chú" value={user.shippingInfo?.note || "Không có"} className="md:col-span-2" />
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Người dùng này chưa lưu thông tin giao hàng.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, description, confirmText, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="w-full max-w-md rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function BanUserModal({ user, banReason, onChangeBanReason, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="w-full max-w-lg rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-rose-500">
          Khóa tài khoản
        </p>
        <h3 className="mt-2 text-2xl font-black text-slate-900">{user.name}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Nhập lý do khóa tài khoản. Người dùng bị khóa sẽ không thể đăng nhập cho đến khi được mở
          khóa lại.
        </p>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Lý do khóa</label>
          <textarea
            value={banReason}
            onChange={(event) => onChangeBanReason(event.target.value)}
            rows="4"
            placeholder="Ví dụ: vi phạm quy định, spam, tài khoản giả mạo..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-rose-400 focus:bg-white"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
          >
            Xác nhận khóa
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ label, value, badgeClass = "" }) {
  const isBadge = Boolean(badgeClass);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      {isBadge ? (
        <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}>
          {value}
        </span>
      ) : (
        <p className="mt-3 text-sm font-semibold text-slate-900">{value}</p>
      )}
    </div>
  );
}

function DetailRow({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function formatRole(role) {
  return role === "admin" ? "Admin" : "Khách hàng";
}

function getRoleBadgeClass(role) {
  return role === "admin"
    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
    : "bg-slate-100 text-slate-700";
}

function getStatusBadgeClass(isActive) {
  return isActive
    ? "bg-emerald-100 text-emerald-700"
    : "bg-rose-100 text-rose-700";
}

function formatDate(value) {
  if (!value) {
    return "Đang cập nhật";
  }

  return new Date(value).toLocaleDateString("vi-VN");
}

function formatDateTime(value) {
  if (!value) {
    return "Đang cập nhật";
  }

  const date = new Date(value);
  return `${date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  })} ${date.toLocaleDateString("vi-VN")}`;
}

function getUserInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="m21 21-4.35-4.35" />
      <circle cx="11" cy="11" r="6" />
    </svg>
  );
}

export default AdminUsersPage;
