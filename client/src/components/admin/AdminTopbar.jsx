import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { buildApiUrl } from "../../lib/api.js";

function AdminTopbar() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    fetchNotifications();

    const intervalId = window.setInterval(() => {
      fetchNotifications({ silent: true });
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [token]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current?.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const adminInitial = useMemo(() => {
    return String(user?.name || "A").trim().slice(0, 1).toUpperCase();
  }, [user]);

  async function fetchNotifications(options = {}) {
    const { silent = false } = options;

    try {
      if (!silent) {
        setLoadingNotifications(true);
      }

      const response = await fetch(buildApiUrl("/api/admin/notifications?limit=8"), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải thông báo");
      }

      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number(data.unreadCount) || 0);
      setNotificationsError("");
    } catch (error) {
      setNotificationsError(error.message || "Không thể tải thông báo");
    } finally {
      if (!silent) {
        setLoadingNotifications(false);
      }
    }
  }

  async function handleNotificationClick(notification) {
    try {
      if (!notification.isRead) {
        const response = await fetch(
          buildApiUrl(`/api/admin/notifications/${notification._id}/read`),
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.ok) {
          setNotifications((current) =>
            current.map((item) =>
              item._id === notification._id
                ? { ...item, isRead: true, readAt: new Date().toISOString() }
                : item
            )
          );
          setUnreadCount((current) => Math.max(current - 1, 0));
        }
      }
    } catch {
      // Cho phép điều hướng ngay cả khi API đánh dấu đã đọc bị lỗi
    } finally {
      setDropdownOpen(false);
      navigate(notification.targetUrl || "/admin/dashboard");
    }
  }

  async function handleMarkAllAsRead() {
    try {
      const response = await fetch(buildApiUrl("/api/admin/notifications/read-all"), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Không thể đánh dấu tất cả là đã đọc");
      }

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      setNotificationsError(error.message || "Không thể đánh dấu tất cả là đã đọc");
    }
  }

  return (
    <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full max-w-xl">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm hệ thống..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </label>

        <div className="flex items-center gap-4 text-sm text-slate-500">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <BackIcon />
            <span>Về trang khách</span>
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((current) => !current)}
              className="relative inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <BellIcon />
              <span>Thông báo</span>
              {unreadCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>

            {dropdownOpen ? (
              <div className="absolute right-0 z-30 mt-3 w-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <p className="text-sm font-black text-slate-900">Thông báo quản trị</p>
                    <p className="text-xs font-medium text-slate-400">
                      {unreadCount > 0
                        ? `${unreadCount} thông báo chưa đọc`
                        : "Không có thông báo mới"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                    className="text-xs font-bold text-blue-600 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Đọc tất cả
                  </button>
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="space-y-3 p-4">
                      {[...Array(4)].map((_, index) => (
                        <div
                          key={index}
                          className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <div className="h-3 w-24 rounded bg-slate-200" />
                          <div className="mt-3 h-3 w-full rounded bg-slate-200" />
                          <div className="mt-2 h-3 w-20 rounded bg-slate-200" />
                        </div>
                      ))}
                    </div>
                  ) : notificationsError ? (
                    <div className="p-4">
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                        {notificationsError}
                      </div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs font-medium text-slate-400">
                      Chưa có thông báo nào cho quản trị.
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification._id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className={`block w-full border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 ${
                          notification.isRead ? "bg-white" : "bg-blue-50/40"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                              notification.type === "order_created"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-indigo-100 text-indigo-700"
                            }`}
                          >
                            {notification.type === "order_created" ? (
                              <OrderMiniIcon />
                            ) : (
                              <ChatMiniIcon />
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-bold text-slate-900">
                                {notification.title}
                              </p>
                              {!notification.isRead ? (
                                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">
                              {notification.message}
                            </p>
                            <p className="mt-2 text-[11px] font-semibold text-slate-400">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <button type="button" className="font-medium transition hover:text-slate-800">
            Trợ giúp
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700">
              {adminInitial}
            </span>
            <div>
              <p className="font-semibold text-slate-900">
                {user?.name || "Quản trị viên"}
              </p>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                {user?.role === "admin" ? "Quản trị hệ thống" : "Tài khoản nội bộ"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function formatRelativeTime(value) {
  if (!value) {
    return "Vừa xong";
  }

  const createdAt = new Date(value).getTime();
  const diffMs = Date.now() - createdAt;
  const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0);

  if (diffMinutes < 1) {
    return "Vừa xong";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

function BackIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="m21 21-4.35-4.35" />
      <circle cx="11" cy="11" r="6" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17H18a2 2 0 0 0 2-2v-1.586a1 1 0 0 0-.293-.707L18 11V8a6 6 0 1 0-12 0v3l-1.707 1.707A1 1 0 0 0 4 13.414V15a2 2 0 0 0 2 2h3.143" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a3 3 0 0 0 6 0" />
    </svg>
  );
}

function OrderMiniIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l1 6H5l1-6Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 9h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9Z" />
    </svg>
  );
}

function ChatMiniIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M5 19V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 2Z" />
    </svg>
  );
}

export default AdminTopbar;
