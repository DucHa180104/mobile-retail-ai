import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

function AdminSupportChatPage() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [activeFilter, setActiveFilter] = useState("all");
  const targetConversationId = searchParams.get("conversation") || "";

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

  const filteredFilterConversations = useMemo(() => {
    if (activeFilter === "all") return filteredConversations;
    if (activeFilter === "blocked") return [];
    if (activeFilter === "spam") return [];
    if (activeFilter === "mentions") {
      return filteredConversations.filter(c => c.status === "open");
    }
    return filteredConversations;
  }, [filteredConversations, activeFilter]);

  useEffect(() => {
    if (!targetConversationId || conversations.length === 0) {
      return;
    }

    const targetExists = conversations.some(
      (conversation) => getConversationId(conversation) === targetConversationId
    );

    if (targetExists) {
      setSelectedConversationId(targetConversationId);
    }
  }, [targetConversationId, conversations]);

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
        if (targetConversationId) {
          const targetExists = nextConversations.some(
            (conversation) => getConversationId(conversation) === targetConversationId
          );

          if (targetExists) {
            return targetConversationId;
          }
        }

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
    <div className="mx-auto max-w-7xl h-[720px] bg-white border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden flex animate-fade-in mt-1 font-sans">
      {/* Left Sidebar: Inbox & Search & Threads List */}
      <aside className="w-[320px] border-r border-slate-100 flex flex-col h-full bg-white shrink-0">
        {/* Inbox Header */}
        <div className="p-4 border-b border-slate-100/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Inbox</h1>
            <span className="text-[10px] font-bold text-slate-400 hover:text-slate-650 cursor-pointer flex items-center gap-0.5 select-none">
              Newest
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </span>
          </div>
          <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </button>
        </div>

        {/* Search Inbox */}
        <div className="px-4 py-2 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50/50 rounded-xl border border-slate-200/50 py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5"
            />
            <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
            </svg>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="px-4 py-1.5 border-b border-slate-100/80 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0 select-none">
          {["all", "mentions", "spam", "blocked"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition capitalize shrink-0 ${
                activeFilter === tab
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-450 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab === "all" ? "All" : tab === "mentions" ? "Mentions" : tab}
            </button>
          ))}
        </div>

        {/* Scrollable Threads List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100/50">
          {conversationsLoading ? (
            <div className="space-y-1 p-2">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse rounded-2xl border border-slate-50 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-20 rounded bg-slate-100" />
                      <div className="h-2.5 w-32 rounded bg-slate-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : conversationsError ? (
            <div className="p-4 text-center text-xs text-rose-500 font-semibold">{conversationsError}</div>
          ) : filteredFilterConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-semibold">
              {searchQuery ? "No matching conversations" : "No support requests"}
            </div>
          ) : (
            filteredFilterConversations.map((conversation) => {
              const cId = getConversationId(conversation);
              const isActive = cId === selectedConversationId;
              const online = conversation.status === "open";
              const initials = getUserInitials(conversation.user?.name);
              const isUnread = conversation.unreadCount > 0 && !isActive;

              return (
                <button
                  key={cId}
                  type="button"
                  onClick={() => {
                    setSelectedConversationId(cId);
                    setSearchParams({ conversation: cId });
                    setSuccessMessage("");
                    setReplyError("");
                    setConversations((prev) =>
                      prev.map((c) => (getConversationId(c) === cId ? { ...c, unreadCount: 0 } : c))
                    );
                  }}
                  className={`w-full p-4 flex gap-3 text-left transition hover:bg-slate-50/50 relative ${
                    isActive ? "bg-slate-50/70" : ""
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-blue-600" />
                  )}
                  {/* Avatar with status indicator */}
                  <div className="relative shrink-0 select-none">
                    <div className={`h-10 w-10 rounded-full text-[11px] font-black flex items-center justify-center border shadow-sm uppercase ${
                      isActive ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white border-transparent" : "bg-slate-100 text-slate-600 border-slate-200/50"
                    }`}>
                      {initials}
                    </div>
                    {online && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-1">
                      <h4 className={`text-[12.5px] truncate ${isUnread ? "font-black text-slate-950" : "font-extrabold text-slate-800"}`}>
                        {conversation.user?.name || "Khách hàng"}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 block animate-pulse" />
                        )}
                        <span className="text-[10px] font-bold text-slate-400">
                          {formatShortTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                    </div>
                    <p className={`text-[11.5px] truncate mt-0.5 ${isUnread ? "text-slate-900 font-extrabold" : "text-slate-450 font-medium"}`}>
                      {conversation.lastSenderType === "admin" && (
                        <span className="text-blue-600 font-extrabold mr-0.5">Bạn:</span>
                      )}
                      {conversation.lastMessage || "Gửi tin nhắn chào mừng..."}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Right Column: Chat window view */}
      <main className="flex-1 flex flex-col bg-slate-50/20 h-full relative">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          {selectedConversation ? (
            <div className="flex items-center gap-3">
              <div className="relative select-none">
                <div className="h-10 w-10 rounded-full bg-slate-100 text-[11px] font-black text-slate-650 flex items-center justify-center border border-slate-200/50 uppercase shadow-sm">
                  {getUserInitials(selectedConversation.user?.name)}
                </div>
                {selectedConversation.status === "open" && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-tight">
                  {selectedConversation.user?.name || "Khách hàng"}
                </h3>
                <span className="text-[10px] font-bold text-blue-600 block mt-0.5">
                  {selectedConversation.status === "open" ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-black text-slate-900">Chi tiết cuộc trò chuyện</h3>
            </div>
          )}

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <button type="button" className="p-2 hover:bg-slate-50 rounded-lg hover:text-slate-800 transition">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a9.049 9.049 0 0 1-5.185-2.813 9.049 9.049 0 0 1-2.813-5.185l-.105-.39a.75.75 0 0 1 .536-.922L8.25 7.5a.75.75 0 0 1 .8.342l1.62 2.7a.75.75 0 0 1-.22.996l-1.025.768a12.02 12.02 0 0 0 5.4 5.4l.768-1.025a.75.75 0 0 1 .996-.22l2.7 1.62a.75.75 0 0 1 .342.8l-.272 1.09a.75.75 0 0 1-.922.536l-.39-.105Z" />
              </svg>
            </button>
            <button type="button" className="p-2 hover:bg-slate-50 rounded-lg hover:text-slate-800 transition">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 0 0 3.182 0l4.318-4.318a2.25 2.25 0 0 0 0-3.182L11.16 3.659A2.25 2.25 0 0 0 9.568 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
            </button>
            <button type="button" className="p-2 hover:bg-slate-50 rounded-lg hover:text-slate-800 transition">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5M3.75 5.25h16.5M3.75 12h16.5m-16.5 6.75h16.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messagesLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <div className="w-2/3 animate-pulse rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="h-3 w-16 bg-slate-100 rounded" />
                    <div className="mt-3 h-3 w-full bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : messagesError ? (
            <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/50 text-xs font-semibold text-rose-600 text-center">
              {messagesError}
            </div>
          ) : !selectedConversation ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-450 select-none">
              <svg className="mb-4 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025 10.321 10.321 0 0 1-2.164-2.077C1.654 15.26 1 13.707 1 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
              <p className="text-xs font-black text-slate-800">Chọn cuộc trò chuyện</p>
              <p className="mt-1 text-[11px] font-medium text-slate-450">Hãy chọn một khách hàng từ hộp thư để bắt đầu hỗ trợ.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-450 select-none">
              <p className="text-xs font-black text-slate-800">Chưa có tin nhắn nào</p>
              <p className="mt-1 text-[11px] font-medium text-slate-450">Bắt đầu nhập nội dung trò chuyện ở ô phía dưới.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Daily Separator: Today */}
              <div className="flex items-center justify-center my-4 select-none">
                <div className="h-[1px] bg-slate-100 flex-1" />
                <span className="mx-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Today</span>
                <div className="h-[1px] bg-slate-100 flex-1" />
              </div>

              {messages.map((message) => {
                const isAdmin = message.senderType === "admin";
                const initials = getUserInitials(isAdmin ? "Bạn" : selectedConversation.user?.name);

                return (
                  <div key={getMessageId(message)} className={`flex gap-3.5 ${isAdmin ? "justify-end" : "justify-start"}`}>
                    {/* Customer Avatar on the left */}
                    {!isAdmin && (
                      <div className="h-9 w-9 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 border border-slate-200/40 shrink-0 flex items-center justify-center uppercase select-none">
                        {initials}
                      </div>
                    )}

                    <div className="flex flex-col max-w-[75%] space-y-1">
                      <span className={`text-[10px] font-black text-slate-400 px-1 ${
                        isAdmin ? "text-right" : "text-left"
                      }`}>
                        {isAdmin ? "James" : selectedConversation.user?.name || "Costa"}
                      </span>

                      {isAdmin ? (
                        <div className="bg-[#e0f2fe]/40 border border-blue-100 text-slate-800 px-4 py-3 shadow-sm text-[13px] font-semibold rounded-2xl rounded-tr-none break-words whitespace-pre-line leading-relaxed">
                          {message.content}
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-100 text-slate-800 px-4 py-3 shadow-sm text-[13px] font-semibold rounded-2xl rounded-tl-none break-words whitespace-pre-line leading-relaxed text-left">
                          {renderMessageContent(message.content)}
                        </div>
                      )}

                      <span className={`text-[9px] font-bold text-slate-400 px-1.5 ${
                        isAdmin ? "text-right" : "text-left"
                      }`}>
                        {formatDateTime(message.createdAt).split(" ")[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Input Bar Section */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col gap-2 shrink-0">
          {successMessage && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
              {successMessage}
            </div>
          )}

          {replyError && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700">
              {replyError}
            </div>
          )}

          <form onSubmit={handleSendReply} className="flex flex-col gap-2.5">
            <div className="relative bg-slate-50/30 border border-slate-200/60 rounded-2xl focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/5 transition">
              <textarea
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder={
                  selectedConversation
                    ? `Message ${selectedConversation.user?.name || "Costa"}`
                    : "Chọn cuộc trò chuyện..."
                }
                rows={2}
                disabled={!selectedConversation || replySending}
                className="w-full bg-transparent border-none outline-none resize-none px-4 py-3 text-xs text-slate-800 placeholder-slate-400 font-semibold disabled:cursor-not-allowed"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply(e);
                  }
                }}
              />
              
              {/* Toolbar */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50/10 border-t border-slate-100/50 rounded-b-2xl">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <button type="button" className="p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739a3.125 3.125 0 1 1-6.25 0 3.125 3.125 0 0 1 6.25 0ZM12 18.75A6.75 6.75 0 0 1 5.25 12V6.75A2.25 2.25 0 0 1 7.5 4.5h6a2.25 2.25 0 0 1 2.25 2.25V12A6.75 6.75 0 0 1 12 18.75Z" />
                    </svg>
                  </button>
                  <button type="button" className="p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button type="button" className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 0 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                    </svg>
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedConversation || !replyInput.trim() || replySending}
                    className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition shadow-md shadow-blue-500/10 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function formatShortTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "1M";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.round(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
}

function renderMessageContent(content) {
  if (!content) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex);

  if (!urls) {
    return <p className="text-[13px] leading-relaxed text-slate-800 font-semibold">{content}</p>;
  }

  const parts = content.split(urlRegex);
  return (
    <div className="space-y-3.5">
      <p className="text-[13px] leading-relaxed text-slate-800 font-semibold">
        {parts.map((part, i) => {
          if (urlRegex.test(part) || part.startsWith("http://") || part.startsWith("https://")) {
            return (
              <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all font-bold">
                {part}
              </a>
            );
          }
          return part;
        })}
      </p>

      {urls.slice(0, 1).map((url, i) => {
        const isPreline = url.includes("preline.co");
        return (
          <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4.5 space-y-2 mt-2 max-w-sm hover:bg-slate-50 transition text-left">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
              {isPreline ? "Preline" : "Liên kết chia sẻ"}
            </span>
            <h4 className="text-xs font-black text-slate-900 leading-tight">
              {isPreline ? "Preline UI, crafted with Tailwind CSS" : "Xem thông tin liên kết"}
            </h4>
            <p className="text-[10.5px] leading-normal text-slate-500 font-medium">
              {isPreline
                ? "Preline UI is an open-source set of prebuilt UI components based on the utility-first Tailwind CSS framework."
                : "Truy cập liên kết này để xem nội dung chi tiết do khách hàng chia sẻ."}
            </p>
            {isPreline && (
              <div className="h-28 w-full rounded bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-[10px] font-black uppercase tracking-wider shadow-sm mt-3.5 border border-slate-100">
                Preline UI Layout Preview
              </div>
            )}
          </div>
        );
      })}
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
