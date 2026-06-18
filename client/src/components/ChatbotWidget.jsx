import { useMemo, useState } from "react";
import { buildApiUrl } from "../lib/api.js";

const initialMessages = [
  {
    id: "bot-welcome",
    role: "bot",
    text: "Xin chào, bạn có thể hỏi thử: iPhone cũ dưới 15 triệu có gì?"
  }
];

function ChatbotWidget({ floating = false }) {
  const [isOpen, setIsOpen] = useState(!floating);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const wrapperClassName = useMemo(() => {
    if (!floating) {
      return "rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm";
    }

    return "fixed bottom-5 right-5 z-50 w-[calc(100vw-2rem)] max-w-[380px]";
  }, [floating]);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedMessage = input.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmedMessage
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl("/api/chat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: trimmedMessage
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
          text: data.reply || "Chatbot chưa có phản hồi"
        }
      ]);
    } catch (submitError) {
      setError(submitError.message || "Chatbot đang lỗi");
    } finally {
      setLoading(false);
    }
  }

  if (!floating) {
    return (
      <section className={wrapperClassName}>
        <ChatPanel
          input={input}
          messages={messages}
          loading={loading}
          error={error}
          onInputChange={setInput}
          onSubmit={handleSubmit}
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
              <p className="text-xs text-blue-100">Mock bước 1</p>
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
              onInputChange={setInput}
              onSubmit={handleSubmit}
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
  onInputChange,
  onSubmit,
  compact = false
}) {
  return (
    <div className="space-y-4">
      {!compact && (
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
            Chatbot mock
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">AI Chatbot bước 1</h1>
          <p className="mt-2 text-sm text-slate-500">
            Bản thử nghiệm để kiểm tra luồng React gửi message lên backend và backend
            trả reply về lại frontend.
          </p>
        </div>
      )}

      <div
        className={`space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-3 ${
          compact ? "max-h-[260px]" : "max-h-[420px]"
        }`}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-2xl px-4 py-3 text-sm ${
              message.role === "user"
                ? "ml-auto max-w-[85%] bg-blue-600 text-white"
                : "max-w-[85%] bg-white text-slate-800 shadow-sm"
            }`}
          >
            {message.text}
          </div>
        ))}

        {loading && (
          <div className="max-w-[85%] rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            Chatbot đang trả lời...
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Nhập câu hỏi, ví dụ: hello"
          className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          Gửi
        </button>
      </form>
    </div>
  );
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

export default ChatbotWidget;
