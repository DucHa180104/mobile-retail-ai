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
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-slate-400">
            admin / <span className="font-semibold text-blue-700">Hỗ trợ khách hàng</span>
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Hộp thư chat với khách hàng</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Admin có thể xem từng cuộc trò chuyện hỗ trợ, đọc lịch sử nhắn tin và phản hồi trực tiếp
            cho từng tài khoản đã đăng nhập.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Tổng hội thoại
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {Number(conversations.length).toLocaleString("vi-VN")}
          </p>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-black text-slate-900">Danh sách khách đang chat</h2>
            <p className="mt-1 text-sm text-slate-500">
              Chọn một hội thoại để xem nội dung và gửi phản hồi.
            </p>
          </div>

          <div className="max-h-[680px] overflow-y-auto p-3">
            {conversationsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                  >
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="mt-3 h-3 w-full rounded bg-slate-200" />
                    <div className="mt-2 h-3 w-20 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : conversationsError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {conversationsError}
              </div>
            ) : conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                Chưa có hội thoại hỗ trợ nào từ khách hàng.
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conversation) => {
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
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                        isActive
                          ? "border-blue-200 bg-blue-50 shadow-sm"
                          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-700">
                          {getUserInitials(conversation.user?.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-black text-slate-900">
                              {conversation.user?.name || "Khách hàng"}
                            </p>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                                conversation.status === "open"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {conversation.status === "open" ? "Đang mở" : "Đã đóng"}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {conversation.user?.email || "Không có email"}
                          </p>
                          <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                            {conversation.lastMessage || "Chưa có tin nhắn"}
                          </p>
                          <p className="mt-2 text-xs text-slate-400">
                            {formatDateTime(conversation.lastMessageAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            {selectedConversation ? (
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700">
                    {getUserInitials(selectedConversation.user?.name)}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      {selectedConversation.user?.name || "Khách hàng"}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {selectedConversation.user?.email || "Không có email"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                  <div>
                    <p className="font-semibold text-slate-700">Trạng thái hội thoại</p>
                    <p>{selectedConversation.status === "open" ? "Đang mở" : "Đã đóng"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Cập nhật gần nhất</p>
                    <p>{formatDateTime(selectedConversation.lastMessageAt)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-black text-slate-900">Chi tiết hội thoại</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Chọn một cuộc trò chuyện ở cột bên trái để bắt đầu hỗ trợ.
                </p>
              </div>
            )}
          </div>

          <div className="flex min-h-[620px] flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {messagesLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}>
                      <div className="w-full max-w-xl animate-pulse rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4">
                        <div className="h-3 w-20 rounded bg-slate-200" />
                        <div className="mt-3 h-3 w-full rounded bg-slate-200" />
                        <div className="mt-2 h-3 w-2/3 rounded bg-slate-200" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messagesError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {messagesError}
                </div>
              ) : !selectedConversation ? (
                <div className="flex h-full min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
                  Chọn một hội thoại ở cột bên trái để xem nội dung chat với khách hàng.
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
                  Hội thoại này chưa có tin nhắn nào.
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={getMessageId(message)}
                    className={`flex ${message.senderType === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`w-full max-w-2xl rounded-3xl border px-4 py-3 shadow-sm ${
                        message.senderType === "admin"
                          ? "border-blue-200 bg-blue-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-80">
                          {message.senderType === "admin" ? "Admin" : "Khách hàng"}
                        </p>
                        <p className="text-xs opacity-70">{formatDateTime(message.createdAt)}</p>
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              {successMessage ? (
                <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {successMessage}
                </div>
              ) : null}

              {replyError ? (
                <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {replyError}
                </div>
              ) : null}

              <form onSubmit={handleSendReply} className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Phản hồi cho khách hàng
                </label>
                <textarea
                  value={replyInput}
                  onChange={(event) => setReplyInput(event.target.value)}
                  placeholder={
                    selectedConversation
                      ? "Nhập nội dung hỗ trợ cho khách hàng..."
                      : "Hãy chọn hội thoại trước khi gửi phản hồi"
                  }
                  rows={4}
                  disabled={!selectedConversation || replySending}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-400">
                    Tin nhắn sẽ được lưu vào đúng hội thoại của tài khoản khách hàng đang chọn.
                  </p>
                  <button
                    type="submit"
                    disabled={!selectedConversation || !replyInput.trim() || replySending}
                    className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {replySending ? "Đang gửi..." : "Gửi phản hồi"}
                  </button>
                </div>
              </form>
            </div>
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
