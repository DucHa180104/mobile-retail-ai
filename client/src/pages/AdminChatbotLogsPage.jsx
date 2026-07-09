import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

function AdminChatbotLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [selectedLogId, setSelectedLogId] = useState("");
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

      const nextLogs = Array.isArray(data.logs) ? data.logs : [];
      setLogs(nextLogs);

      if (nextLogs.length > 0) {
        setSelectedLogId(nextLogs[0].id || nextLogs[0]._id || "");
      }
    } catch (fetchError) {
      setError(fetchError.message || "Không thể tải log chatbot");
    } finally {
      setLoading(false);
    }
  }

  const selectedLog = useMemo(
    () =>
      logs.find(
        (log) => getLogId(log) === selectedLogId
      ) || null,
    [logs, selectedLogId]
  );

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
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-2 sm:px-6 lg:px-8">
      {/* Title Block */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-slate-100 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Admin Portal / <span className="text-blue-600">Chatbot Logs</span>
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            Lịch sử tư vấn của AI Chatbot
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Xem nhật ký hội thoại giữa người dùng và robot tư vấn AI để cải thiện từ khóa và kịch bản chatbot.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Tổng tài khoản đã chat:
          </span>
          <span className="text-sm font-black text-slate-800">
            {filteredLogs.length}
          </span>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Sidebar: Conversation List */}
        <div className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden h-[760px]">
          <div className="border-b border-slate-100 p-4 bg-slate-50/50">
            <h2 className="text-base font-black text-slate-900">Hội thoại AI</h2>
            
            {/* Local Search box */}
            <div className="relative mt-3">
              <input
                type="text"
                placeholder="Tìm user hoặc nội dung..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
              </svg>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-48 border border-dashed border-slate-100 rounded-2xl">
                <p className="text-xs text-slate-400 font-medium">
                  {searchKeyword ? "Không tìm thấy user trùng khớp" : "Chưa có log chatbot nào"}
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const logId = getLogId(log);
                const isActive = logId === selectedLogId;

                return (
                  <button
                    key={logId}
                    type="button"
                    onClick={() => {
                      setSelectedLogId(logId);
                    }}
                    className={`w-full rounded-2xl border p-3.5 text-left transition duration-200 flex items-start gap-3.5 ${
                      isActive
                        ? "border-blue-500 bg-blue-50/50 shadow-sm border-l-4"
                        : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-sm ${
                      isActive 
                        ? "bg-blue-600 text-white" 
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {getUserInitials(log.user?.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-black text-slate-900">
                          {log.user?.name || "Khách vãng lai"}
                        </p>
                        <span className="bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 text-[8.5px] font-extrabold uppercase border border-blue-100 shrink-0">
                          AI Chat
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">
                        {log.user?.email || "Không có email"}
                      </p>
                      <p className="mt-2.5 truncate text-xs text-slate-600 leading-normal font-medium">
                        {log.lastUserMessage?.text || "Bắt đầu cuộc hội thoại với AI..."}
                      </p>
                      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100/50 pt-2 text-[9px] text-slate-400">
                        <span>⏰ {formatDateTime(log.updatedAt)}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Content Pane: Log details */}
        <div className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden h-[760px]">
          {/* Header */}
          <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/50 flex items-center justify-between">
            {selectedLog ? (
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xs font-black text-blue-700 shadow-sm">
                  {getUserInitials(selectedLog.user?.name)}
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">
                    {selectedLog.user?.name || "Khách hàng"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedLog.user?.email || "Không có thông tin email"}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-sm font-black text-slate-900">Chi tiết cuộc hội thoại</h2>
                <p className="text-xs text-slate-500">
                  Chọn một người dùng bên trái để bắt đầu theo dõi nhật ký chat.
                </p>
              </div>
            )}

            {selectedLog && (
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div>
                  <span className="font-semibold text-slate-700">Tổng tin: </span>
                  {selectedLog.totalMessages}
                </div>
              </div>
            )}
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-50/30">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                {error}
              </div>
            ) : !selectedLog ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-8 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12 text-slate-300 mb-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M12 3v1.5M15.75 3v1.5M5.25 5.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.75V7.5A2.25 2.25 0 0 1 5.25 5.25ZM9 10.5h.008v.008H9V10.5Zm0 2.25h.008v.008H9v-.008Zm0 2.25h.008v.008H9V15Zm3-4.5h.008v.008H12V10.5Zm0 2.25h.008v.008H12v-.008Zm0 2.25h.008v.008H12V15Zm3-4.5h.008v.008H15V10.5Zm0 2.25h.008v.008H15v-.008Zm0 2.25h.008v.008H15V15Z" />
                </svg>
                <p className="text-xs font-semibold">Chọn tài khoản xem log AI</p>
                <p className="mt-1 text-[11px]">Nội dung trò chuyện với robot tư vấn sẽ được hiển thị tại đây.</p>
              </div>
            ) : (selectedLog.messages || []).length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-8 text-slate-400">
                <p className="text-xs font-semibold">Hội thoại này không chứa tin nhắn nào</p>
              </div>
            ) : (
              (selectedLog.messages || []).map((message) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id || message._id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-2xl rounded-2xl px-4 py-3.5 shadow-sm text-sm ${
                        isUser
                          ? "rounded-tr-none bg-gradient-to-tr from-blue-600 to-indigo-650 text-white"
                          : "rounded-tl-none border border-slate-100 bg-white text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-6 pb-1 border-b border-white/10">
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider ${
                          isUser ? "text-blue-100" : "text-indigo-600"
                        }`}>
                          {isUser ? "Người dùng" : "Chatbot AI"}
                        </span>
                        <span className={`text-[9px] ${isUser ? "text-blue-200/80" : "text-slate-400"}`}>
                          {formatDateTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-line leading-relaxed text-[13.5px]">
                        {message.text}
                      </p>

                      {!isUser && Array.isArray(message.products) && message.products.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 w-full mb-1 uppercase tracking-wide">
                            🏷️ Gợi ý sản phẩm:
                          </span>
                          {message.products.map((product) => (
                            <span
                              key={product.id || product._id}
                              className="rounded-lg bg-blue-50 px-2 py-1 text-[10.5px] font-bold text-blue-700 border border-blue-100"
                            >
                              {product.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer (Read-only status alert for chat log) */}
          <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 text-center text-xs text-slate-400 font-medium">
            🔒 Đây là tệp ghi nhận lịch sử chat tự động của AI Chatbot. Lịch sử được cập nhật theo thời gian thực.
          </div>
        </div>
      </section>
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

function getLogId(log) {
  return log?.id || log?._id || "";
}

function getMessageId(message) {
  return message?.id || message?._id || `${message?.role || "msg"}-${message?.createdAt || Date.now()}`;
}

export default AdminChatbotLogsPage;
