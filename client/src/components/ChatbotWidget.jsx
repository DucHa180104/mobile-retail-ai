import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

const CHATBOT_MESSAGES_STORAGE_KEY = "mobile-retail-ai-chatbot-messages";
const CHATBOT_RECENT_QUESTIONS_STORAGE_KEY = "mobile-retail-ai-chatbot-recent-questions";

const initialMessages = [
  {
    id: "bot-welcome",
    role: "bot",
    text: "Xin chào! Mình là trợ lý AI Mạnh Hường Mobile. Bạn có thể hỏi mình các câu như:\n\n- **iPhone 13 Pro Max cũ giá bao nhiêu?**\n- **Điện thoại chơi game mượt dưới 12 triệu?**\n- **Chính sách bảo hành máy cũ ra sao?**\n\nMình có thể tìm trực tiếp trong kho máy của cửa hàng để báo giá và gợi ý đúng nhu cầu cho bạn."
  }
];

const defaultSuggestedQuestions = [
  "iPhone nào dưới 15 triệu?",
  "Máy pin trâu chơi game tốt",
  "Tìm Samsung Galaxy cũ rẻ",
  "Chính sách bảo hành máy cũ"
];

function ChatbotWidget({ floating = false }) {
  const { token, isAuthenticated } = useAuth();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(!floating);
  const [activeTab, setActiveTab] = useState("ai");

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => readStoredMessages());
  const [recentQuestions, setRecentQuestions] = useState(() => readStoredRecentQuestions());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastFailedMessage, setLastFailedMessage] = useState("");

  const [supportInput, setSupportInput] = useState("");
  const [supportConversation, setSupportConversation] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [supportError, setSupportError] = useState("");

  const wrapperClassName = useMemo(() => {
    if (!floating) {
      return "rounded-3xl border border-slate-100 bg-white p-6 shadow-sm";
    }

    return "fixed bottom-6 right-6 z-50 w-[calc(100vw-2rem)] max-w-[390px]";
  }, [floating]);

  const currentProductId = useMemo(() => {
    const matchedPath = location.pathname.match(/^\/products\/([^/]+)$/);
    return matchedPath ? matchedPath[1] : "";
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthenticated && token) {
      return;
    }

    window.localStorage.setItem(CHATBOT_MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  }, [messages, isAuthenticated, token]);

  useEffect(() => {
    window.localStorage.setItem(
      CHATBOT_RECENT_QUESTIONS_STORAGE_KEY,
      JSON.stringify(recentQuestions)
    );
  }, [recentQuestions]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setMessages(readStoredMessages());
      return;
    }

    let isCancelled = false;

    async function fetchChatHistory() {
      try {
        const response = await fetch(buildApiUrl("/api/chat/history"), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Không thể tải lịch sử chat");
        }

        if (isCancelled) {
          return;
        }

        const nextMessages = normalizeStoredMessages(data.messages);
        setMessages(nextMessages.length > 0 ? nextMessages : initialMessages);
      } catch (fetchError) {
        if (isCancelled) {
          return;
        }

        setError(fetchError.message || "Không thể tải lịch sử chat");
        setMessages(initialMessages);
      }
    }

    fetchChatHistory();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (activeTab !== "support") {
      return;
    }

    if (!isAuthenticated || !token) {
      setSupportConversation(null);
      setSupportMessages([]);
      setSupportLoading(false);
      return;
    }

    let isCancelled = false;

    async function fetchSupportConversation() {
      try {
        setSupportLoading(true);
        setSupportError("");

        const response = await fetch(buildApiUrl("/api/support-chat/me"), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Không thể tải hội thoại với admin");
        }

        if (isCancelled) {
          return;
        }

        setSupportConversation(data.conversation || null);
        setSupportMessages(Array.isArray(data.messages) ? data.messages : []);
      } catch (fetchError) {
        if (isCancelled) {
          return;
        }

        setSupportError(fetchError.message || "Không thể tải hội thoại với admin");
      } finally {
        if (!isCancelled) {
          setSupportLoading(false);
        }
      }
    }

    fetchSupportConversation();

    return () => {
      isCancelled = true;
    };
  }, [activeTab, isAuthenticated, token]);

  useEffect(() => {
    if (activeTab !== "support" || !isAuthenticated || !token) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch(buildApiUrl("/api/support-chat/me"), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Không thể tải hội thoại với admin");
        }

        setSupportConversation(data.conversation || null);
        setSupportMessages(Array.isArray(data.messages) ? data.messages : []);
      } catch (fetchError) {
        setSupportError(fetchError.message || "Không thể tải hội thoại với admin");
      }
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeTab, isAuthenticated, token]);

  async function sendMessage(messageText) {
    const trimmedMessage = String(messageText || "").trim();

    if (!trimmedMessage || loading) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmedMessage
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setRecentQuestions((current) => buildRecentQuestions(trimmedMessage, current));
    setLastFailedMessage(trimmedMessage);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const historyPayload = nextMessages
        .filter((item) => item.role === "user" || item.role === "bot")
        .map((item) => ({
          role: item.role,
          text: item.text
        }))
        .slice(-8);

      const headers = {
        "Content-Type": "application/json"
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(buildApiUrl("/api/chat"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: trimmedMessage,
          history: historyPayload,
          currentProductId,
          currentPath: location.pathname
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể gửi câu hỏi tới chatbot");
      }

      setMessages((current) => [
        ...current,
        {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: data.reply || "Chatbot chưa có phản hồi",
          products: Array.isArray(data.suggestedProducts) ? data.suggestedProducts : []
        }
      ]);
    } catch (submitError) {
      setError(submitError.message || "Chatbot đang gặp lỗi");
    } finally {
      setLoading(false);
    }
  }

  async function sendSupportMessage(messageText) {
    const trimmedMessage = String(messageText || "").trim();

    if (!trimmedMessage || supportSending || !token) {
      return;
    }

    setSupportError("");
    setSupportSending(true);

    try {
      const response = await fetch(buildApiUrl("/api/support-chat/me/messages"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: trimmedMessage
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể gửi tin nhắn tới admin");
      }

      setSupportInput("");
      setSupportConversation(data.conversation || supportConversation);
      setSupportMessages((current) => [...current, data.message]);
    } catch (submitError) {
      setSupportError(submitError.message || "Không thể gửi tin nhắn tới admin");
    } finally {
      setSupportSending(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await sendMessage(input);
  }

  async function handleSuggestedQuestion(question) {
    await sendMessage(question);
  }

  async function handleRetry() {
    await sendMessage(lastFailedMessage);
  }

  async function handleSupportSubmit(event) {
    event.preventDefault();
    await sendSupportMessage(supportInput);
  }

  const suggestedQuestions = useMemo(() => {
    const merged = [...recentQuestions, ...defaultSuggestedQuestions];
    return Array.from(new Set(merged)).slice(0, 5);
  }, [recentQuestions]);

  const panelContent = (
    <div className="space-y-4">
      <ChatTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "ai" ? (
        <ChatPanel
          input={input}
          messages={messages}
          loading={loading}
          error={error}
          lastFailedMessage={lastFailedMessage}
          suggestedQuestions={suggestedQuestions}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          onRetry={handleRetry}
          onSuggestedQuestion={handleSuggestedQuestion}
          compact={floating}
        />
      ) : (
        <SupportChatPanel
          isAuthenticated={isAuthenticated}
          loading={supportLoading}
          sending={supportSending}
          error={supportError}
          conversation={supportConversation}
          messages={supportMessages}
          input={supportInput}
          onInputChange={setSupportInput}
          onSubmit={handleSupportSubmit}
          compact={floating}
        />
      )}
    </div>
  );

  if (!floating) {
    return <section className={wrapperClassName}>{panelContent}</section>;
  }

  return (
    <div className={wrapperClassName}>
      {isOpen ? (
        <div className="animate-fade-in overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl shadow-slate-900/10">
          <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/20">
                <ChatIcon />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              </div>
              <div>
                <h3 className="text-sm font-black leading-none">Mạnh Hường Support</h3>
                <p className="mt-1.5 text-[10px] font-medium text-slate-300">
                  {activeTab === "ai"
                    ? isAuthenticated
                      ? "Lịch sử chat AI đã đồng bộ"
                      : "Hỗ trợ chọn máy cũ 24/7"
                    : "Trao đổi trực tiếp với admin"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
              aria-label="Đóng hộp chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-slate-50/30 p-4">{panelContent}</div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative ml-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-800 bg-gradient-to-tr from-slate-900 to-indigo-950 text-white shadow-xl shadow-indigo-950/20 transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Mở hộp chat"
        >
          <ChatIcon />
          <span className="pointer-events-none absolute -left-16 top-3 rounded-md border border-slate-100 bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-700 opacity-0 shadow-sm backdrop-blur transition-opacity duration-200 group-hover:opacity-100">
            Chat hỗ trợ
          </span>
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </span>
        </button>
      )}
    </div>
  );
}

function ChatTabs({ activeTab, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm">
      <button
        type="button"
        onClick={() => onChange("ai")}
        className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
          activeTab === "ai"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        Chat với AI
      </button>
      <button
        type="button"
        onClick={() => onChange("support")}
        className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
          activeTab === "support"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        Chat với admin
      </button>
    </div>
  );
}

function ChatPanel({
  input,
  messages,
  loading,
  error,
  lastFailedMessage,
  suggestedQuestions,
  onInputChange,
  onSubmit,
  onRetry,
  onSuggestedQuestion,
  compact = false
}) {
  const messageContainerRef = useRef(null);

  useEffect(() => {
    if (!messageContainerRef.current) {
      return;
    }
    messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
  }, [messages, loading, error]);

  const errorPresentation = getErrorPresentation(error);

  return (
    <div className="space-y-4">
      {!compact ? (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600">
            Trợ lý thông minh
          </span>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Tư vấn chọn máy</h1>
          <p className="text-sm text-slate-500">
            Hỏi đáp thông minh về dòng máy, pin, ngoại hình và so sánh các mẫu điện thoại phù hợp với nhu cầu.
          </p>
        </div>
      ) : null}

      <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Gợi ý câu hỏi nhanh
        </p>
        <div className="flex flex-wrap gap-1.5">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onSuggestedQuestion(question)}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={messageContainerRef}
        className={`space-y-4 overflow-y-auto rounded-2xl border border-slate-100/50 bg-slate-100/50 p-4 ${
          compact ? "max-h-[290px]" : "max-h-[460px]"
        }`}
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {loading ? <LoadingSkeleton /> : null}
      </div>

      {error ? (
        <div className={`rounded-xl border px-4 py-3 text-xs ${errorPresentation.wrapperClassName}`}>
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 shrink-0">{errorPresentation.icon}</div>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{errorPresentation.title}</p>
              <p className="mt-1 leading-relaxed">{error}</p>
              {lastFailedMessage ? (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={loading}
                  className={`mt-2 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${errorPresentation.buttonClassName}`}
                >
                  Gửi lại
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Bạn muốn hỏi gì về điện thoại hôm nay..."
          disabled={loading}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 disabled:cursor-not-allowed disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-indigo-600 px-4.5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/10 transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <SpinnerIcon /> : <SendIcon />}
        </button>
      </form>
    </div>
  );
}

function SupportChatPanel({
  isAuthenticated,
  loading,
  sending,
  error,
  conversation,
  messages,
  input,
  onInputChange,
  onSubmit,
  compact = false
}) {
  const messageContainerRef = useRef(null);

  useEffect(() => {
    if (!messageContainerRef.current) {
      return;
    }
    messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
  }, [messages, loading, error]);

  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          <p className="font-bold">Bạn cần đăng nhập để chat với admin.</p>
          <p className="mt-1">Sau khi đăng nhập, bạn có thể gửi câu hỏi và xem lại lịch sử hỗ trợ.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!compact ? (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-700">
            Hỗ trợ trực tiếp
          </span>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Chat với admin</h1>
          <p className="text-sm text-slate-500">
            Gửi câu hỏi về đơn hàng, tình trạng máy, bảo hành hoặc xin tư vấn trực tiếp từ cửa hàng.
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
        <p className="font-bold text-slate-700">
          {conversation ? "Hội thoại hỗ trợ đã sẵn sàng" : "Đang tạo hội thoại hỗ trợ"}
        </p>
        <p className="mt-1">
          Admin sẽ thấy tin nhắn của bạn trong trang quản trị và có thể trả lời trực tiếp tại đây.
        </p>
      </div>

      <div
        ref={messageContainerRef}
        className={`space-y-3 overflow-y-auto rounded-2xl border border-slate-100/50 bg-slate-100/50 p-4 ${
          compact ? "max-h-[290px]" : "max-h-[460px]"
        }`}
      >
        {loading ? <LoadingSkeleton /> : null}

        {!loading && messages.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500">
            Chưa có tin nhắn nào. Bạn có thể mở đầu cuộc trò chuyện với admin ngay bây giờ.
          </div>
        ) : null}

        {messages.map((message) => (
          <SupportMessageBubble key={message._id} message={message} />
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <p className="font-bold">Không thể tải hoặc gửi tin nhắn hỗ trợ</p>
          <p className="mt-1 leading-relaxed">{error}</p>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Nhập nội dung cần admin hỗ trợ..."
          disabled={sending}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-xl bg-slate-900 px-4.5 py-3 text-sm font-bold text-white shadow-md shadow-slate-900/10 transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? <SpinnerIcon /> : <SendIcon />}
        </button>
      </form>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUserMessage = message.role === "user";

  return (
    <div className={isUserMessage ? "ml-auto max-w-[85%]" : "max-w-[90%]"}>
      <div
        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUserMessage
            ? "rounded-tr-none bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white"
            : "rounded-tl-none border border-slate-100 bg-white text-slate-800"
        }`}
      >
        {isUserMessage ? (
          <p className="whitespace-pre-line break-words">{message.text}</p>
        ) : (
          <MarkdownMessage content={message.text} />
        )}
      </div>

      {!isUserMessage && Array.isArray(message.products) && message.products.length > 0 ? (
        <div className="mt-3.5 space-y-2.5">
          {message.products.map((product) => (
            <article
              key={`${message.id}-${product.id}`}
              className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:border-slate-200 hover:shadow-md"
            >
              <div className="flex gap-3.5 p-3.5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">Không ảnh</span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-indigo-700">
                        {product.conditionLabel || "Zin 99%"}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                          product.stock > 0
                            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                            : "border-rose-100 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {product.stockText || "Sẵn hàng"}
                      </span>
                    </div>

                    <h4 className="line-clamp-2 text-xs font-bold leading-tight text-slate-900">
                      {product.name}
                    </h4>

                    <p className="text-xs font-black text-indigo-600">
                      {product.priceText || "Đang cập nhật"}
                    </p>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5">
                    <div className="flex gap-2 text-[10px] font-semibold text-slate-400">
                      {product.storage ? <span>💾 {product.storage}</span> : null}
                      {product.batteryHealth ? <span>🔋 {product.batteryHealth}%</span> : null}
                    </div>

                    <Link
                      to={product.path || `/products/${product.id}`}
                      className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SupportMessageBubble({ message }) {
  const isUserMessage = message.senderType === "user";
  const createdAtText = formatTime(message.createdAt);

  return (
    <div className={isUserMessage ? "ml-auto max-w-[85%]" : "max-w-[85%]"}>
      <div
        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUserMessage
            ? "rounded-tr-none bg-gradient-to-tr from-slate-800 to-slate-900 text-white"
            : "rounded-tl-none border border-slate-100 bg-white text-slate-800"
        }`}
      >
        <div className="mb-1 flex items-center gap-2">
          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isUserMessage ? "text-slate-200" : "text-indigo-600"}`}>
            {isUserMessage ? "Bạn" : "Admin"}
          </span>
          <span className={`text-[10px] ${isUserMessage ? "text-slate-300" : "text-slate-400"}`}>
            {createdAtText}
          </span>
        </div>
        <p className="whitespace-pre-line break-words">{message.content}</p>
      </div>
    </div>
  );
}

function MarkdownMessage({ content }) {
  return (
    <div className="chatbot-markdown break-words text-sm leading-relaxed text-slate-805">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h3 className="mb-2 text-base font-extrabold text-slate-900" {...props} />,
          h2: ({ node, ...props }) => <h4 className="mb-2 text-sm font-extrabold text-slate-900" {...props} />,
          h3: ({ node, ...props }) => <h5 className="mb-2 text-sm font-bold text-slate-800" {...props} />,
          p: ({ node, ...props }) => <p className="mb-2.5 last:mb-0" {...props} />,
          ul: ({ node, ...props }) => <ul className="mb-2.5 list-disc space-y-1 pl-5 last:mb-0" {...props} />,
          ol: ({ node, ...props }) => (
            <ol className="mb-2.5 list-decimal space-y-1 pl-5 last:mb-0" {...props} />
          ),
          li: ({ node, ...props }) => <li className="mb-0.5 last:mb-0" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-extrabold text-indigo-950" {...props} />,
          em: ({ node, ...props }) => <em className="font-semibold text-slate-500" {...props} />,
          a: ({ node, ...props }) => (
            <a
              className="font-bold text-indigo-600 underline underline-offset-2 hover:text-indigo-850"
              target="_blank"
              rel="noreferrer"
              {...props}
            />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-[85%] animate-pulse rounded-2xl rounded-tl-none border border-slate-100 bg-white px-4 py-3.5 shadow-sm">
      <div className="flex items-center gap-1.5 py-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" />
      </div>
    </div>
  );
}

function readStoredMessages() {
  try {
    const rawValue = window.localStorage.getItem(CHATBOT_MESSAGES_STORAGE_KEY);
    if (!rawValue) {
      return initialMessages;
    }
    return normalizeStoredMessages(JSON.parse(rawValue));
  } catch {
    return initialMessages;
  }
}

function normalizeStoredMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return initialMessages;
  }

  return messages.map((message) => ({
    ...message,
    products: Array.isArray(message.products) ? message.products : []
  }));
}

function readStoredRecentQuestions() {
  try {
    const rawValue = window.localStorage.getItem(CHATBOT_RECENT_QUESTIONS_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function buildRecentQuestions(messageText, currentQuestions) {
  return [messageText, ...currentQuestions.filter((question) => question !== messageText)].slice(
    0,
    5
  );
}

function getErrorPresentation(error) {
  const normalizedError = String(error || "").toLowerCase();

  if (normalizedError.includes("quá tải")) {
    return {
      title: "AI đang bận xử lý",
      wrapperClassName: "border-amber-200 bg-amber-50 text-amber-700",
      buttonClassName: "bg-amber-100 text-amber-800 hover:bg-amber-200",
      icon: <WarningIcon className="text-amber-500" />
    };
  }

  if (
    normalizedError.includes("không hợp lệ") ||
    normalizedError.includes("cấu hình") ||
    normalizedError.includes("api key")
  ) {
    return {
      title: "Cấu hình AI lỗi",
      wrapperClassName: "border-rose-200 bg-rose-50 text-rose-700",
      buttonClassName: "bg-rose-100 text-rose-800 hover:bg-rose-200",
      icon: <ErrorIcon className="text-rose-500" />
    };
  }

  if (normalizedError.includes("kết nối")) {
    return {
      title: "Lỗi kết nối máy chủ",
      wrapperClassName: "border-sky-200 bg-sky-50 text-sky-700",
      buttonClassName: "bg-sky-100 text-sky-800 hover:bg-sky-200",
      icon: <WifiOffIcon className="text-sky-500" />
    };
  }

  return {
    title: "Trục trặc kỹ thuật nhỏ",
    wrapperClassName: "border-slate-200 bg-slate-50 text-slate-700",
    buttonClassName: "bg-slate-200 text-slate-800 hover:bg-slate-300",
    icon: <InfoIcon className="text-slate-500" />
  };
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  try {
    return new Date(value).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

function ChatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10h10M7 14h6" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z"
      />
    </svg>
  );
}

function WarningIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={`h-4.5 w-4.5 ${className}`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m10.29 3.86-8 14A1 1 0 0 0 3.14 19h17.72a1 1 0 0 0 .87-1.5l-8-14a1 1 0 0 0-1.74 0Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 17h.01" />
    </svg>
  );
}

function ErrorIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={`h-4.5 w-4.5 ${className}`}
    >
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16h.01" />
    </svg>
  );
}

function WifiOffIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={`h-4.5 w-4.5 ${className}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m2 8.82 2.36 2.36" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 4.5a16 16 0 0 1 11 4.32" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13a10.94 10.94 0 0 1 5.17-2.69" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 13a10.94 10.94 0 0 0-2.2-1.52" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 16.5a6 6 0 0 1 7 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m2 2 20 20" />
    </svg>
  );
}

function InfoIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={`h-4.5 w-4.5 ${className}`}
    >
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8h.01" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-4.5 w-4.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="h-4.5 w-4.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
      />
    </svg>
  );
}

export default ChatbotWidget;
