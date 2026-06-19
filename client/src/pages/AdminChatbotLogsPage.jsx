import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

function AdminChatbotLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [token]);

  async function fetchLogs() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(buildApiUrl("/api/admin/chat-logs"), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải log chatbot");
      }

      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (fetchError) {
      setError(fetchError.message || "Không thể tải log chatbot");
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return logs;
    }

    return logs.filter((log) => {
      const userText = [log.user?.name, log.user?.email].join(" ").toLowerCase();
      const messageText = (log.messages || [])
        .map((message) => message.text)
        .join(" ")
        .toLowerCase();

      return userText.includes(normalizedKeyword) || messageText.includes(normalizedKeyword);
    });
  }, [logs, searchKeyword]);

  if (loading) {
    return (
      <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <p className="text-slate-600">Đang tải log chatbot...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-slate-400">
            admin / <span className="font-semibold text-blue-700">Chatbot log</span>
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Lịch sử chatbot theo user</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Trang này giúp admin xem các câu hỏi người dùng đã gửi cho chatbot, câu trả lời AI đã
            trả về và các sản phẩm chatbot đã gợi ý.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Tổng user có log
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {filteredLogs.length.toLocaleString("vi-VN")}
          </p>
        </div>
      </div>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Tìm kiếm log</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tìm theo tên user, email hoặc nội dung hội thoại.
            </p>
          </div>

          <input
            type="text"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="Tìm theo user hoặc nội dung chat..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white lg:max-w-md"
          />
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {filteredLogs.length === 0 ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-sm text-slate-500">Chưa có log chatbot nào để hiển thị.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredLogs.map((log) => (
            <article
              key={log.id}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700">
                    {getUserInitials(log.user?.name)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {log.user?.name || "Người dùng đã xóa"}
                    </h3>
                    <p className="text-sm text-slate-500">{log.user?.email || "Không có email"}</p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-slate-500 sm:grid-cols-2 lg:text-right">
                  <div>
                    <p className="font-semibold text-slate-700">Tổng tin nhắn</p>
                    <p>{Number(log.totalMessages || 0).toLocaleString("vi-VN")}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Cập nhật gần nhất</p>
                    <p>{formatDateTime(log.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {log.lastUserMessage?.text ? (
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Câu hỏi gần nhất
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{log.lastUserMessage.text}</p>
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                {(log.messages || []).map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "ml-auto max-w-3xl bg-blue-600 text-white"
                        : "max-w-3xl bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-80">
                        {message.role === "user" ? "Người dùng" : "Chatbot"}
                      </p>
                      <p className="text-xs opacity-70">{formatDateTime(message.createdAt)}</p>
                    </div>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6">{message.text}</p>

                    {message.role === "bot" && Array.isArray(message.products) && message.products.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.products.map((product) => (
                          <span
                            key={`${message.id}-${product.id}`}
                            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700"
                          >
                            {product.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
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

export default AdminChatbotLogsPage;
