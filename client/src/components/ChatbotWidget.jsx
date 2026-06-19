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
    text: "Xin chào, bạn có thể hỏi thử: iPhone cũ dưới 15 triệu có gì?"
  }
];

const defaultSuggestedQuestions = [
  "iPhone nào dưới 15 triệu?",
  "Máy pin tốt cho sinh viên",
  "Máy đẹp ít trầy có gì?",
  "Máy chụp ảnh ổn nên chọn gì?"
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
      return "rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm";
    }

    return "fixed bottom-5 right-5 z-50 w-[calc(100vw-2rem)] max-w-[380px]";
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
    return Array.from(new Set(merged)).slice(0, 6);
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
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">Chatbot tư vấn</p>
              <p className="text-xs text-blue-100">
                {isAuthenticated ? "Đã lưu lịch sử theo tài khoản" : "AI hỗ trợ chọn máy"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold transition hover:bg-white/25"
            >
              Đóng
            </button>
          </div>

          <div className="p-4">
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
          className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition hover:bg-blue-700"
          aria-label="Mở chatbot"
        >
          <ChatIcon />
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
      {!compact ? (
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
            AI Chatbot
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Tư vấn chọn máy</h1>
          <p className="mt-2 text-sm text-slate-500">
            Chatbot sẽ gợi ý sản phẩm từ dữ liệu thật trong shop và hỗ trợ bạn lọc nhu cầu nhanh
            hơn.
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Gợi ý nhanh
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onSuggestedQuestion(question)}
              disabled={loading}
              className="rounded-full border border-blue-200 bg-white px-3 py-2 text-left text-xs font-medium text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={messageContainerRef}
        className={`space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-3 ${
          compact ? "max-h-[260px]" : "max-h-[420px]"
        }`}
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {loading ? <LoadingSkeleton /> : null}
      </div>

      {error ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${errorPresentation.wrapperClassName}`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">{errorPresentation.icon}</div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{errorPresentation.title}</p>
              <p className="mt-1">{error}</p>
              {lastFailedMessage ? (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={loading}
                  className={`mt-3 rounded-full px-3 py-1.5 text-xs font-semibold transition ${errorPresentation.buttonClassName}`}
                >
                  Thử lại
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Nhập câu hỏi, ví dụ: iPhone pin tốt dưới 15 triệu"
          disabled={loading}
          className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {loading ? "Đang gửi" : "Gửi"}
        </button>
      </form>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUserMessage = message.role === "user";

  return (
    <div className={isUserMessage ? "ml-auto max-w-[85%]" : "max-w-[85%]"}>
      <div
        className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
          isUserMessage ? "bg-blue-600 text-white" : "bg-white text-slate-800 shadow-sm"
        }`}
      >
        {isUserMessage ? (
          <p className="whitespace-pre-line break-words">{message.text}</p>
        ) : (
          <MarkdownMessage content={message.text} />
        )}
      </div>

      {!isUserMessage && Array.isArray(message.products) && message.products.length > 0 ? (
        <div className="mt-3 space-y-3">
          {message.products.map((product) => (
            <article
              key={`${message.id}-${product.id}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex gap-3 p-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] font-semibold text-slate-400">
                      Không có ảnh
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                      {product.conditionLabel || "Sản phẩm"}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        product.stock > 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {product.stockText || "Tạm hết hàng"}
                    </span>
                  </div>

                  <h4 className="mt-2 line-clamp-2 text-sm font-bold text-slate-900">
                    {product.name}
                  </h4>

                  <p className="mt-1 text-sm font-black text-red-500">
                    {product.priceText || "Đang cập nhật"}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    {product.storage ? <span>Dung lượng: {product.storage}</span> : null}
                    {product.batteryHealth ? <span>Pin: {product.batteryHealth}</span> : null}
                  </div>

                  <div className="mt-3">
                    <Link
                      to={product.path || `/products/${product.id}`}
                      className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
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
    <div className="chatbot-markdown break-words text-sm leading-6 text-slate-800">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h3 className="mb-2 text-base font-black" {...props} />,
          h2: ({ node, ...props }) => <h4 className="mb-2 text-sm font-black" {...props} />,
          h3: ({ node, ...props }) => <h5 className="mb-2 text-sm font-bold" {...props} />,
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
          ul: ({ node, ...props }) => <ul className="mb-2 list-disc pl-5 last:mb-0" {...props} />,
          ol: ({ node, ...props }) => (
            <ol className="mb-2 list-decimal pl-5 last:mb-0" {...props} />
          ),
          li: ({ node, ...props }) => <li className="mb-1 last:mb-0" {...props} />,
          strong: ({ node, ...props }) => (
            <strong className="font-black text-slate-900" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              className="font-semibold text-blue-700 underline underline-offset-2"
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
    <div className="max-w-[85%] rounded-2xl bg-white px-4 py-4 shadow-sm">
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-full animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-200" />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        AI đang đọc nhu cầu và chọn máy phù hợp...
      </p>
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

    return Array.isArray(parsedValue) ? parsedValue.slice(0, 6) : [];
  } catch {
    return [];
  }
}

function buildRecentQuestions(messageText, currentQuestions) {
  return [messageText, ...currentQuestions.filter((question) => question !== messageText)].slice(
    0,
    6
  );
}

function getErrorPresentation(error) {
  const normalizedError = String(error || "").toLowerCase();

  if (normalizedError.includes("quá tải")) {
    return {
      title: "AI đang quá tải",
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
      title: "Cấu hình AI cần kiểm tra",
      wrapperClassName: "border-rose-200 bg-rose-50 text-rose-700",
      buttonClassName: "bg-rose-100 text-rose-800 hover:bg-rose-200",
      icon: <ErrorIcon className="text-rose-500" />
    };
  }

  if (normalizedError.includes("kết nối")) {
    return {
      title: "Mất kết nối tới AI",
      wrapperClassName: "border-sky-200 bg-sky-50 text-sky-700",
      buttonClassName: "bg-sky-100 text-sky-800 hover:bg-sky-200",
      icon: <WifiOffIcon className="text-sky-500" />
    };
  }

  return {
    title: "Chatbot đang gặp trục trặc nhỏ",
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
      strokeWidth="2"
      className="h-6 w-6"
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
      strokeWidth="2"
      className={`h-5 w-5 ${className}`}
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
      strokeWidth="2"
      className={`h-5 w-5 ${className}`}
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
      strokeWidth="2"
      className={`h-5 w-5 ${className}`}
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
      strokeWidth="2"
      className={`h-5 w-5 ${className}`}
    >
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8h.01" />
    </svg>
  );
}

export default ChatbotWidget;
