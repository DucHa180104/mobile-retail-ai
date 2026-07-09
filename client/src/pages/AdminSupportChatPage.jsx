import { useEffect, useMemo, useState } from "react";
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
  
  // Local conversation search filter for admin UI
  const [searchQuery, setSearchQuery] = useState("");

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
    return conversations.filter((c) => {
      const name = String(c.user?.name || "").toLowerCase();
      const email = String(c.user?.email || "").toLowerCase();
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
      {/* Title block */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-slate-100 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Admin Portal / <span className="text-blue-600">Support Chat</span>
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            Hộp thư hỗ trợ khách hàng
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Phản hồi thắc mắc, tư vấn sản phẩm và giải quyết khiếu nại của khách hàng trong thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Hội thoại đang hoạt động:
          </span>
          <span className="text-sm font-black text-slate-800">
            {conversations.length}
          </span>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Sidebar: Conversation List */}
        <div className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden h-[760px]">
          <div className="border-b border-slate-100 p-4 bg-slate-50/50">
            <h2 className="text-base font-black text-slate-900">Khách hàng trực tuyến</h2>
            
            {/* Local Search box */}
            <div className="relative mt-3">
              <input
                type="text"
                placeholder="Tìm khách hàng theo tên, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            {conversationsLoading ? (
              <div className="space-y-2 p-1.5">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-200 shrink-0" />
                      <div className="space-y-1.5 flex-1">
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
              <div className="flex flex-col items-center justify-center p-8 text-center h-48 border border-dashed border-slate-100 rounded-2xl">
                <p className="text-xs text-slate-400 font-medium">
                  {searchQuery ? "Không tìm thấy khách hàng trùng khớp" : "Chưa có cuộc trò chuyện nào"}
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
                      {getUserInitials(conversation.user?.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-black text-slate-900">
                          {conversation.user?.name || "Khách hàng"}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wide shrink-0 ${
                            conversation.status === "open"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {conversation.status === "open" ? "Đang mở" : "Đã đóng"}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">
                        {conversation.user?.email}
                      </p>
                      <p className="mt-2.5 truncate text-xs text-slate-600 leading-normal font-medium">
                        {conversation.lastSenderType === "admin" ? "Bạn: " : ""}
                        {conversation.lastMessage || "Gửi tin nhắn chào mừng..."}
                      </p>
                      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100/50 pt-2 text-[9px] text-slate-400">
                        <span>⏰ {formatDateTime(conversation.lastMessageAt)}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Content Pane: Chat history and replies */}
        <div className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden h-[760px]">
          {/* Header */}
          <div className="border-b border-slate-100 px-6 py-4.5 bg-slate-50/50 flex items-center justify-between">
            {selectedConversation ? (
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xs font-black text-blue-700 shadow-sm">
                  {getUserInitials(selectedConversation.user?.name)}
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">
                    {selectedConversation.user?.name || "Khách hàng"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedConversation.user?.email || "Không có thông tin email"}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-sm font-black text-slate-900">Hội thoại chi tiết</h2>
                <p className="text-xs text-slate-500">
                  Chọn một cuộc trò chuyện từ danh bạ bên trái để bắt đầu chat.
                </p>
              </div>
            )}

            {selectedConversation && (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Trạng thái: {selectedConversation.status === "open" ? "Đang kết nối" : "Đã ngắt"}
                </span>
              </div>
            )}
          </div>

          {/* Messages list with spacious layout */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-50/30">
            {messagesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}>
                    <div className="w-2/3 animate-pulse rounded-2xl bg-white border border-slate-100 p-4">
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
              <div className="flex h-full flex-col items-center justify-center text-center p-8 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12 text-slate-300 mb-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                <p className="text-xs font-semibold">Vui lòng chọn khách hàng cần hỗ trợ</p>
                <p className="mt-1 text-[11px]">Tin nhắn và lịch sử trò chuyện sẽ được hiển thị tại đây.</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-8 text-slate-400">
                <p className="text-xs font-semibold">Chưa có nội dung trò chuyện</p>
                <p className="mt-1 text-[11px]">Nhập câu chào hỏi ở khung chat bên dưới để bắt đầu hội thoại.</p>
              </div>
            ) : (
              messages.map((message) => {
                const isAdmin = message.senderType === "admin";
                return (
                  <div
                    key={getMessageId(message)}
                    className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-2xl rounded-2xl px-4 py-3.5 shadow-sm text-sm ${
                        isAdmin
                          ? "rounded-tr-none bg-gradient-to-tr from-blue-600 to-indigo-650 text-white"
                          : "rounded-tl-none border border-slate-100 bg-white text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-6 pb-1 border-b border-white/10">
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider ${
                          isAdmin ? "text-blue-100" : "text-blue-600"
                        }`}>
                          {isAdmin ? "Bạn (Admin)" : "Khách hàng"}
                        </span>
                        <span className={`text-[9px] ${isAdmin ? "text-blue-200/80" : "text-slate-400"}`}>
                          {formatDateTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-line leading-relaxed text-[13.5px]">
                        {message.content}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Typing area */}
          <div className="border-t border-slate-100 p-5 bg-white">
            {successMessage && (
              <div className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700 font-medium">
                {successMessage}
              </div>
            )}

            {replyError && (
              <div className="mb-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-xs text-rose-700 font-medium">
                {replyError}
              </div>
            )}

            <form onSubmit={handleSendReply} className="space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Nội dung phản hồi
                </label>
                {selectedConversation && (
                  <span className="text-[10px] text-slate-400">
                    Phản hồi tài khoản: <span className="font-semibold text-slate-600">{selectedConversation.user?.name}</span>
                  </span>
                )}
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
                <span className="text-[10.5px] text-slate-400">
                  ⚠️ Tin nhắn của bạn sẽ hiển thị ngay lập tức trên widget chat của khách hàng.
                </span>
                <button
                  type="submit"
                  disabled={!selectedConversation || !replyInput.trim() || replySending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-blue-600/10 transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none shrink-0"
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
