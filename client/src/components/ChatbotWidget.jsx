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
    text: "Xin chào! Mình là trợ lý AI Mạnh Hương Mobile. Bạn có thể hỏi mình các câu hỏi như: \n\n* *iPhone 13 Pro Max cũ giá bao nhiêu?*\n* *Điện thoại chơi game mượt dưới 12 triệu?*\n* *Chính sách bảo hành máy cũ ra sao?*\n\nMình có thể tìm kiếm trực tiếp trong kho máy của cửa hàng để báo giá chính xác cho bạn đấy! 👇"
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
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => readStoredMessages());
  const [recentQuestions, setRecentQuestions] = useState(() => readStoredRecentQuestions());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastFailedMessage, setLastFailedMessage] = useState("");

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

  const suggestedQuestions = useMemo(() => {
    const merged = [...recentQuestions, ...defaultSuggestedQuestions];
    return Array.from(new Set(merged)).slice(0, 5);
  }, [recentQuestions]);

  if (!floating) {
    return (
      <section className={wrapperClassName}>
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
        />
      </section>
    );
  }

  return (
    <div className={wrapperClassName}>
      {isOpen ? (
        <div className="animate-fade-in overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl shadow-slate-900/10">
          
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-400/30">
                <ChatIcon />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              </div>
              <div>
                <h3 className="text-sm font-black leading-none">Mạnh Hương AI</h3>
                <p className="text-[10px] text-slate-300 mt-1.5 font-medium">
                  {isAuthenticated ? "Lịch sử chat đã đồng bộ" : "Hỗ trợ chọn máy cũ 24/7"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
              aria-label="Đóng chatbot"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body panel */}
          <div className="p-4 bg-slate-50/30">
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
              compact
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-slate-900 to-indigo-950 text-white shadow-xl shadow-indigo-950/20 transition-all duration-300 hover:scale-105 active:scale-95 border border-slate-800"
          aria-label="Mở chatbot"
        >
          <ChatIcon />
          
          {/* Label alert */}
          <span className="absolute -left-16 top-3 bg-white/90 backdrop-blur border border-slate-100 text-[10px] font-bold text-slate-700 px-2 py-0.5 rounded-md shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Hỏi AI ⚡
          </span>

          {/* Online green indicator */}
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </span>
        </button>
      )}
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
      {!compact && (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
            🤖 Trợ lý thông minh
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tư vấn chọn máy</h1>
          <p className="text-sm text-slate-500">
            Hỏi đáp thông minh về dòng máy, dung lượng pin, ngoại hình trầy xước và so sánh các dòng máy cũ.
          </p>
        </div>
      )}

      {/* Suggested Questions Grid */}
      <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          💡 Gợi ý câu hỏi nhanh
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

      {/* Messages Box */}
      <div
        ref={messageContainerRef}
        className={`space-y-4.5 overflow-y-auto rounded-2xl bg-slate-100/50 p-4 border border-slate-100/50 ${
          compact ? "max-h-[290px]" : "max-h-[460px]"
        }`}
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {loading && <LoadingSkeleton />}
      </div>

      {/* Error message */}
      {error && (
        <div className={`rounded-xl border px-4 py-3 text-xs ${errorPresentation.wrapperClassName}`}>
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 shrink-0">{errorPresentation.icon}</div>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{errorPresentation.title}</p>
              <p className="mt-1 leading-relaxed">{error}</p>
              {lastFailedMessage && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={loading}
                  className={`mt-2 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${errorPresentation.buttonClassName}`}
                >
                  Gửi lại
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Form */}
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Bạn muốn hỏi gì về điện thoại cũ hôm nay..."
          disabled={loading}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 disabled:cursor-not-allowed disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4.5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/10 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <svg className="h-4.5 w-4.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4.5 w-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUserMessage = message.role === "user";

  return (
    <div className={isUserMessage ? "ml-auto max-w-[85%] animate-slide-in-right" : "max-w-[90%] animate-fade-in"}>
      <div
        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUserMessage
            ? "rounded-tr-none bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white"
            : "rounded-tl-none bg-white text-slate-800 border border-slate-100"
        }`}
      >
        {isUserMessage ? (
          <p className="whitespace-pre-line break-words">{message.text}</p>
        ) : (
          <MarkdownMessage content={message.text} />
        )}
      </div>

      {/* Suggested Products List inside Bot messages */}
      {!isUserMessage && Array.isArray(message.products) && message.products.length > 0 ? (
        <div className="mt-3.5 space-y-2.5">
          {message.products.map((product) => (
            <article
              key={`${message.id}-${product.id}`}
              className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md hover:border-slate-200"
            >
              <div className="flex gap-3.5 p-3.5">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">Không ảnh</span>
                  )}
                </div>

                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[9px] font-extrabold text-indigo-700 border border-indigo-100 uppercase">
                        {product.conditionLabel || "Zin 99%"}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[9px] font-extrabold border uppercase ${
                          product.stock > 0
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}
                      >
                        {product.stockText || "Sẵn hàng"}
                      </span>
                    </div>

                    <h4 className="line-clamp-2 text-xs font-bold text-slate-900 leading-tight">
                      {product.name}
                    </h4>

                    <p className="text-xs font-black text-indigo-600">
                      {product.priceText || "Đang cập nhật"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2.5 mt-1.5 border-t border-slate-100">
                    <div className="flex gap-2 text-[10px] text-slate-400 font-semibold">
                      {product.storage ? <span>💾 {product.storage}</span> : null}
                      {product.batteryHealth ? <span>🔋 {product.batteryHealth}%</span> : null}
                    </div>
                    
                    <Link
                      to={product.path || `/products/${product.id}`}
                      className="inline-flex items-center rounded-lg bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 text-[10px] font-bold text-indigo-700 transition"
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

function MarkdownMessage({ content }) {
  return (
    <div className="chatbot-markdown break-words text-sm leading-relaxed text-slate-805">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h3 className="mb-2 text-base font-extrabold text-slate-900" {...props} />,
          h2: ({ node, ...props }) => <h4 className="mb-2 text-sm font-extrabold text-slate-900" {...props} />,
          h3: ({ node, ...props }) => <h5 className="mb-2 text-sm font-bold text-slate-800" {...props} />,
          p: ({ node, ...props }) => <p className="mb-2.5 last:mb-0" {...props} />,
          ul: ({ node, ...props }) => <ul className="mb-2.5 list-disc pl-5 last:mb-0 space-y-1" {...props} />,
          ol: ({ node, ...props }) => (
            <ol className="mb-2.5 list-decimal pl-5 last:mb-0 space-y-1" {...props} />
          ),
          li: ({ node, ...props }) => <li className="mb-0.5 last:mb-0" {...props} />,
          strong: ({ node, ...props }) => (
            <strong className="font-extrabold text-indigo-950" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="text-slate-500 font-semibold" {...props} />
          ),
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
    <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-white px-4 py-3.5 border border-slate-100 shadow-sm animate-pulse">
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
      wrapperClassName: "border-rose-250 bg-rose-50 text-rose-700",
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

export default ChatbotWidget;
