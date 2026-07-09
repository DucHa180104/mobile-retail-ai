import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

function AdminSupportChatPage() {
  const { token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [replyInput, setReplyInput] = useState("");
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replySending, setReplySending] = useState(false);
  const [conversationsError, setConversationsError] = useState("");
  const [messagesError, setMessagesError] = useState("");
  const [replyError, setReplyError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const messageEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, [token]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      fetchConversations({ silent: true });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [token]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    fetchConversationMessages(selectedConversationId);
  }, [selectedConversationId, token]);

  useEffect(() => {
    if (!token || !selectedConversationId) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      fetchConversationMessages(selectedConversationId, { silent: true });
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedConversationId, token]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => getConversationId(conversation) === selectedConversationId
      ) || null,
    [conversations, selectedConversationId]
  );

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }

    const q = searchQuery.toLowerCase().trim();
    return conversations.filter((conversation) => {
      const name = String(conversation.user?.name || "").toLowerCase();
      const email = String(conversation.user?.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [conversations, searchQuery]);

  async function fetchConversations(options = {}) {
    const { silent = false } = options;

    try {
      if (!silent) {
        setConversationsLoading(true);
      }
      setConversationsError("");

      const response = await fetch(buildApiUrl("/api/support-chat/admin/conversations"), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải danh sách hội thoại hỗ trợ");
      }

      const nextConversations = Array.isArray(data)
        ? data
        : Array.isArray(data.conversations)
          ? data.conversations
          : [];

      setConversations(nextConversations);

      if (nextConversations.length === 0) {
        setSelectedConversationId("");
        return;
      }

      setSelectedConversationId((currentValue) => {
        const stillExists = nextConversations.some(
          (conversation) => getConversationId(conversation) === currentValue
        );

        return stillExists ? currentValue : getConversationId(nextConversations[0]);
      });
    } catch (fetchError) {
      setConversationsError(fetchError.message || "Không thể tải danh sách hội thoại hỗ trợ");
    } finally {
      if (!silent) {
        setConversationsLoading(false);
      }
    }
  }

  async function fetchConversationMessages(conversationId, options = {}) {
    const { silent = false } = options;

    try {
      if (!silent) {
        setMessagesLoading(true);
      }
      setMessagesError("");

      const response = await fetch(
        buildApiUrl(`/api/support-chat/admin/conversations/${conversationId}/messages`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải nội dung hội thoại");
      }

      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (fetchError) {
      setMessagesError(fetchError.message || "Không thể tải nội dung hội thoại");
    } finally {
      if (!silent) {
        setMessagesLoading(false);
      }
    }
  }

  async function handleSendReply(event) {
    event.preventDefault();

    const trimmedReply = replyInput.trim();

    if (!trimmedReply || !selectedConversationId) {
      return;
    }

    try {
      setReplySending(true);
      setReplyError("");
      setSuccessMessage("");

      const response = await fetch(
        buildApiUrl(`/api/support-chat/admin/conversations/${selectedConversationId}/messages`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            content: trimmedReply
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể gửi phản hồi cho khách hàng");
      }

      setMessages((currentMessages) => [...currentMessages, data.message]);
      setReplyInput("");
      setSuccessMessage("Đã gửi phản hồi cho khách hàng");

      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          getConversationId(conversation) === selectedConversationId
            ? {
                ...conversation,
                lastMessage: data.message.content,
                lastMessageAt: data.message.createdAt,
                lastSenderType: data.message.senderType
              }
            : conversation
        )
      );
    } catch (sendError) {
      setReplyError(sendError.message || "Không thể gửi phản hồi cho khách hàng");
    } finally {
      setReplySending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-2 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Cổng quản trị / <span className="text-indigo-600">Chat hỗ trợ</span>
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            Hộp thư hỗ trợ khách hàng
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Phản hồi thắc mắc, tư vấn sản phẩm và giải quyết khiếu nại của khách hàng theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Đang hoạt động:
          </span>
          <span className="text-sm font-black text-slate-800">{conversations.length}</span>
        </div>
      </div>

      <section className="grid items-stretch gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="flex h-[760px] flex-col overflow-hidden rounded-3xl border border-slate-150 bg-white shadow-md">
          <div className="border-b border-slate-100 bg-slate-50/50 p-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Khách hàng trực tuyến
            </h2>

            <div className="relative mt-3">
              <input
                type="text"
                placeholder="Tìm khách hàng theo tên, email..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 shadow-sm"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
              </svg>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50/20 p-3">
            {conversationsLoading ? (
              <div className="space-y-3 p-1">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-24 rounded bg-slate-200" />
                        <div className="h-3 w-16 rounded bg-slate-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversationsError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                {conversationsError}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="m-2 flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <p className="text-xs font-bold text-slate-400">
                  {searchQuery ? "Không tìm thấy khách hàng" : "Chưa có cuộc trò chuyện"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const conversationId = getConversationId(conversation);
                const isActive = conversationId === selectedConversationId;

                return (
                  <button
                    key={conversationId}
                    type="button"
                    onClick={() => {
                      setSelectedConversationId(conversationId);
                      setSuccessMessage("");
                      setReplyError("");
                    }}
                    className={`relative flex w-full items-start gap-3.5 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-350 ${
                      isActive
                        ? "border-indigo-650 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-650/15"
                        : "border-slate-100 bg-white shadow-sm hover:border-slate-200 hover:bg-slate-50/60"
                    }`}
                  >
                    {isActive ? (
                      <span className="absolute bottom-0 left-0 top-0 w-1 rounded-r-lg bg-indigo-650" />
                    ) : null}

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-black shadow-sm transition-transform duration-300 ${
                        isActive
                          ? "scale-105 bg-gradient-to-tr from-indigo-600 to-blue-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {getUserInitials(conversation.user?.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-black text-slate-900">
                          {conversation.user?.name || "Khách hàng"}
                        </p>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider ${
                            conversation.status === "open"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-500"
                          }`}
                        >
                          {conversation.status === "open" ? "Đang mở" : "Đã đóng"}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">
                        {conversation.user?.email}
                      </p>
                      <p className="mt-2.5 truncate text-xs font-medium leading-relaxed text-slate-650">
                        {conversation.lastSenderType === "admin" ? (
                          <span className="font-bold text-indigo-600">Bạn: </span>
                        ) : null}
                        {conversation.lastMessage || "Gửi tin nhắn chào mừng..."}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100/60 pt-2 text-[9px] font-semibold text-slate-400">
                        <span>⏰ {formatDateTime(conversation.lastMessageAt)}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex h-[760px] flex-col overflow-hidden rounded-3xl border border-slate-150 bg-white shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
            {selectedConversation ? (
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-100 bg-gradient-to-tr from-indigo-100 to-blue-50 text-xs font-black text-indigo-700 shadow-sm">
                  {getUserInitials(selectedConversation.user?.name)}
                </div>
                <div>
                  <h2 className="text-sm font-black leading-tight text-slate-900">
                    {selectedConversation.user?.name || "Khách hàng"}
                  </h2>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">
                    {selectedConversation.user?.email || "Không có thông tin email"}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-sm font-black text-slate-900">Hội thoại chi tiết</h2>
                <p className="text-xs font-semibold text-slate-450">
                  Chọn một cuộc trò chuyện từ danh bạ bên trái để bắt đầu chat.
                </p>
              </div>
            )}

            {selectedConversation ? (
              <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800">
                  {selectedConversation.status === "open" ? "Đang kết nối" : "Đã ngắt"}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/30 px-6 py-6">
            {messagesLoading ? (
              <div className="space-y-5">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}>
                    <div className="w-2/3 animate-pulse rounded-2xl border border-slate-100 bg-white p-4">
                      <div className="h-3 w-16 rounded bg-slate-200" />
                      <div className="mt-3 h-3 w-full rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messagesError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                {messagesError}
              </div>
            ) : !selectedConversation ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3.5 h-12 w-12 text-slate-350">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                <p className="text-xs font-black text-slate-550">Vui lòng chọn khách hàng cần hỗ trợ</p>
                <p className="mt-1 text-[11px] font-medium text-slate-450">
                  Tin nhắn và lịch sử trò chuyện sẽ hiển thị tại đây.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
                <p className="text-xs font-black text-slate-550">Chưa có nội dung trò chuyện</p>
                <p className="mt-1 text-[11px] font-medium text-slate-450">
                  Nhập câu phản hồi ở khung chat bên dưới để bắt đầu hội thoại.
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const isAdmin = message.senderType === "admin";

                return (
                  <div
                    key={getMessageId(message)}
                    className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                  >
                    <div className="flex max-w-[70%] flex-col">
                      <span
                        className={`mb-1 px-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 ${
                          isAdmin ? "text-right" : "text-left"
                        }`}
                      >
                        {isAdmin ? "Bạn" : "Khách hàng"} •{" "}
                        <span className="text-[9px] font-medium lowercase">{formatDateTime(message.createdAt)}</span>
                      </span>

                      <div
                        className={`break-words whitespace-pre-line rounded-2xl border px-4 py-3.5 text-[13.5px] text-sm leading-relaxed shadow-sm ${
                          isAdmin
                            ? "rounded-tr-none border-transparent bg-gradient-to-tr from-indigo-600 via-indigo-650 to-blue-600 text-white"
                            : "rounded-tl-none border-slate-100 bg-white text-slate-800"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messageEndRef} />
          </div>

          <div className="space-y-4 border-t border-slate-100 bg-white p-5">
            {successMessage ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            {replyError ? (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
                {replyError}
              </div>
            ) : null}

            <form onSubmit={handleSendReply} className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Nội dung phản hồi
                </label>
                {selectedConversation ? (
                  <span className="text-[10.5px] font-semibold text-slate-400">
                    Đang trả lời:{" "}
                    <span className="font-extrabold text-indigo-600">{selectedConversation.user?.name}</span>
                  </span>
                ) : null}
              </div>

              <textarea
                value={replyInput}
                onChange={(event) => setReplyInput(event.target.value)}
                placeholder={
                  selectedConversation
                    ? "Nhập câu trả lời, hướng dẫn hoặc tư vấn giá cho khách hàng..."
                    : "Chọn một cuộc trò chuyện để bắt đầu soạn phản hồi..."
                }
                rows={3}
                disabled={!selectedConversation || replySending}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-xs text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[10.5px] font-medium text-slate-400">
                  Tin nhắn của bạn sẽ hiển thị ngay lập tức trên widget chat của khách hàng.
                </span>
                <button
                  type="submit"
                  disabled={!selectedConversation || !replyInput.trim() || replySending}
                  className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-xs font-black text-white shadow-md shadow-indigo-600/15 transition-all duration-350 hover:scale-[1.02] hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  {replySending ? (
                    <span>Đang gửi...</span>
                  ) : (
                    <>
                      <span>Gửi phản hồi</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925c.09.312.34.555.652.648l6.705 2.012a.25.25 0 010 .475L4.345 13.33a.75.75 0 00-.652.648l-1.414 4.925a.75.75 0 00.902.932l14.931-7.258a.75.75 0 000-1.354L3.105 2.289Z" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
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
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  return `${date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  })} ${date.toLocaleDateString("vi-VN")}`;
}

function getConversationId(conversation) {
  return conversation?.id || conversation?._id || "";
}

function getMessageId(message) {
  return message?.id || message?._id || `${message?.senderType || "message"}-${message?.createdAt || Date.now()}`;
}

export default AdminSupportChatPage;
