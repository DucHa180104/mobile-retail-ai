import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";
import zaloQrImage from "../zalo_qr_mockup.png";

const quickHighlights = [
  "Tư vấn theo nhu cầu thật: học tập, chơi game, chụp ảnh, pin lâu.",
  "Giải thích rõ tình trạng máy cũ, pin, ngoại hình và chính sách đổi trả.",
  "Hỗ trợ giữ máy hoặc hẹn xem máy trước khi ghé cửa hàng."
];

function ContactPage() {
  const { token, isAuthenticated } = useAuth();
  const [contactSettings, setContactSettings] = useState(null);
  const [supportInput, setSupportInput] = useState("");
  const [supportConversation, setSupportConversation] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [supportError, setSupportError] = useState("");
  const messageContainerRef = useRef(null);

  const supportStatusText = useMemo(() => {
    if (!isAuthenticated) {
      return "Cần đăng nhập để chat trực tiếp";
    }

    if (supportLoading) {
      return "Đang kết nối với tư vấn viên";
    }

    return supportConversation ? "Đã sẵn sàng hỗ trợ" : "Sẵn sàng mở hội thoại mới";
  }, [isAuthenticated, supportConversation, supportLoading]);

  const qrImageSource = useMemo(() => {
    const configuredUrl = String(contactSettings?.zaloQrImageUrl || "").trim();

    if (!configuredUrl) {
      return zaloQrImage;
    }

    return configuredUrl.startsWith("/uploads")
      ? buildApiUrl(configuredUrl)
      : configuredUrl;
  }, [contactSettings]);

  const contactChannels = useMemo(() => {
    const storePhone = String(contactSettings?.storePhone || "").trim();
    const supportEmail = String(contactSettings?.supportEmail || "").trim();
    const storeAddress = String(contactSettings?.storeAddress || "").trim();

    return [
      {
        title: "Gọi hotline",
        value: storePhone || "Đang cập nhật",
        note: "Tư vấn máy, báo giá nhanh và giữ mẫu trước khi đến cửa hàng.",
        href: storePhone ? `tel:${storePhone.replace(/\s+/g, "")}` : "#",
        icon: <PhoneIcon />
      },
      {
        title: "Email hỗ trợ",
        value: supportEmail || "Đang cập nhật",
        note: "Phù hợp khi cần gửi yêu cầu chi tiết hoặc xác nhận bằng văn bản.",
        href: supportEmail ? `mailto:${supportEmail}` : "#",
        icon: <MailIcon />
      },
      {
        title: "Đến cửa hàng",
        value: storeAddress || "Đang cập nhật",
        note: "Có thể xem máy trực tiếp, test ngoại hình và nhận tư vấn tại chỗ.",
        href: storeAddress ? `https://maps.google.com/?q=${encodeURIComponent(storeAddress)}` : "#",
        icon: <PinIcon />
      }
    ];
  }, [contactSettings]);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [supportMessages, supportLoading]);

  useEffect(() => {
    let isCancelled = false;

    async function fetchContactSettings() {
      try {
        const response = await fetch(buildApiUrl("/api/contact-settings"));
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Không thể tải cấu hình liên hệ");
        }

        if (!isCancelled) {
          setContactSettings(data);
        }
      } catch {
        if (!isCancelled) {
          setContactSettings(null);
        }
      }
    }

    fetchContactSettings();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
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
          throw new Error(data.message || "Không thể tải hội thoại");
        }

        if (isCancelled) {
          return;
        }

        setSupportConversation(data.conversation || null);
        setSupportMessages(Array.isArray(data.messages) ? data.messages : []);
      } catch (fetchError) {
        if (!isCancelled) {
          setSupportError(fetchError.message || "Không thể tải hội thoại");
        }
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
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
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

        if (response.ok) {
          setSupportConversation(data.conversation || null);
          setSupportMessages(Array.isArray(data.messages) ? data.messages : []);
        }
      } catch {
        // Bỏ qua lỗi polling để tránh làm gián đoạn giao diện.
      }
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, token]);

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
        throw new Error(data.message || "Không thể gửi tin nhắn");
      }

      setSupportInput("");
      setSupportConversation(data.conversation || supportConversation);
      setSupportMessages((current) => [...current, data.message]);
    } catch (submitError) {
      setSupportError(submitError.message || "Không thể gửi tin nhắn");
    } finally {
      setSupportSending(false);
    }
  }

  function handleSupportSubmit(event) {
    event.preventDefault();
    sendSupportMessage(supportInput);
  }

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-8 sm:px-5 lg:px-6">
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-6 shadow-sm sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Contact Desk
            </div>

            <div className="mt-4 space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Liên hệ nhanh để được tư vấn đúng máy, đúng nhu cầu.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Bên trái là thông tin liên hệ chính và QR, bên phải là khung chat trực tiếp với cửa hàng để khách nhìn vào là hiểu ngay nên liên hệ theo cách nào.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <HeroStat label="Phản hồi" value="5-10 phút" note="Trong giờ làm việc" />
              <HeroStat label="Kênh hỗ trợ" value="3 cách" note="Hotline, email, chat" />
              <HeroStat label="Tư vấn" value="Miễn phí" note="Trước khi mua" />
            </div>

            <div className="mt-6 space-y-3 rounded-[1.5rem] border border-slate-200 bg-white/85 p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Hỏi càng rõ, tư vấn càng nhanh
              </p>
              <ul className="space-y-2">
                {quickHighlights.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {contactChannels.map((channel) => (
              <a
                key={channel.title}
                href={channel.href}
                target={channel.href.startsWith("http") ? "_blank" : undefined}
                rel={channel.href.startsWith("http") ? "noreferrer" : undefined}
                className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  {channel.icon}
                </div>
                <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {channel.title}
                </p>
                <h2 className="mt-2 text-sm font-black text-slate-900">{channel.value}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{channel.note}</p>
              </a>
            ))}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <div className="grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
              <div className="mx-auto flex h-[180px] w-[180px] items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/10 bg-white p-3 shadow-lg shadow-black/20">
                <img
                  src={qrImageSource}
                  alt="Zalo QR Code"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">
                  Quét QR để nhắn Zalo
                </p>
                <h2 className="text-2xl font-black tracking-tight">
                  Kênh phù hợp nhất khi cần gửi ảnh máy cũ hoặc hỏi nhanh.
                </h2>
                <div className="space-y-3">
                  <QuickStep
                    index="01"
                    title="Mở Zalo trên điện thoại"
                    description="Dùng camera hoặc tính năng quét mã trong ứng dụng."
                  />
                  <QuickStep
                    index="02"
                    title="Nhắn nhu cầu cụ thể"
                    description="Ví dụ: iPhone dưới 15 triệu, pin tốt, ưu tiên chụp ảnh."
                  />
                  <QuickStep
                    index="03"
                    title="Nhận tư vấn nhanh"
                    description="Cửa hàng có thể giữ mẫu phù hợp để bạn ghé xem trực tiếp."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <ChatHeadIcon />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    Live support
                  </p>
                  <h2 className="text-xl font-black text-slate-950">Chat trực tiếp với cửa hàng</h2>
                </div>
              </div>

              <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 sm:block">
                {supportStatusText}
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6">
            {!isAuthenticated ? (
              <div className="flex min-h-[560px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-200 bg-[linear-gradient(180deg,_#f8fbff_0%,_#ffffff_100%)] px-6 text-center">
                <div className="flex h-18 w-18 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-sm">
                  <ChatHeadIcon />
                </div>
                <h3 className="mt-5 text-xl font-black text-slate-950">
                  Đăng nhập để bắt đầu hội thoại
                </h3>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
                  Sau khi đăng nhập, bạn có thể hỏi trực tiếp về từng mẫu máy, hỏi tình trạng pin, xin giữ máy hoặc nhận tư vấn trước khi ghé cửa hàng.
                </p>
                <Link
                  to="/login"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            ) : (
              <>
                <div
                  ref={messageContainerRef}
                  className="h-[460px] overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-4"
                >
                  {supportLoading ? (
                    <div className="space-y-4">
                      {[...Array(4)].map((_, index) => (
                        <div key={index} className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}>
                          <div className="w-full max-w-[78%] animate-pulse rounded-2xl bg-white px-4 py-4 shadow-sm">
                            <div className="h-3 w-16 rounded bg-slate-200" />
                            <div className="mt-3 h-3 w-full rounded bg-slate-200" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : supportMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                      <p className="text-sm font-black text-slate-900">
                        Chưa có tin nhắn nào
                      </p>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                        Hãy bắt đầu bằng một câu hỏi cụ thể, ví dụ: “Cửa hàng còn iPhone 13 pin tốt dưới 12 triệu không?”
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {supportMessages.map((message) => (
                        <SupportMessageBubble key={message._id} message={message} />
                      ))}
                    </div>
                  )}
                </div>

                {supportError ? (
                  <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {supportError}
                  </div>
                ) : null}

                <form onSubmit={handleSupportSubmit} className="space-y-3">
                  <label className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    Soạn tin cho tư vấn viên
                  </label>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={supportInput}
                      onChange={(event) => setSupportInput(event.target.value)}
                      placeholder="Nhập nội dung bạn cần hỏi..."
                      disabled={supportSending}
                      className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 disabled:bg-slate-50"
                    />
                    <button
                      type="submit"
                      disabled={supportSending || !supportInput.trim()}
                      className="shrink-0 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {supportSending ? "Đang gửi..." : "Gửi"}
                    </button>
                  </div>

                  <p className="text-xs leading-6 text-slate-400">
                    Mẹo: hỏi càng cụ thể thì cửa hàng càng tư vấn nhanh và sát nhu cầu hơn.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroStat({ label, value, note }) {
  return (
    <div className="rounded-[1.35rem] border border-white/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  );
}

function QuickStep({ index, title, description }) {
  return (
    <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-3 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xs font-black text-white">
        {index}
      </div>
      <div>
        <p className="text-sm font-black text-white">{title}</p>
        <p className="mt-1 text-xs leading-6 text-slate-300">{description}</p>
      </div>
    </div>
  );
}

function SupportMessageBubble({ message }) {
  const isUser = message.senderType === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${
          isUser
            ? "rounded-tr-none bg-gradient-to-tr from-blue-600 to-indigo-700 text-white"
            : "rounded-tl-none border border-slate-100 bg-white text-slate-800"
        }`}
      >
        <div className="mb-1 flex items-center gap-2">
          <span className={`text-[10px] font-black uppercase tracking-[0.14em] ${isUser ? "text-blue-100" : "text-slate-400"}`}>
            {isUser ? "Bạn" : "Admin"}
          </span>
        </div>
        <p className="whitespace-pre-line break-words">{message.content}</p>
      </div>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-1.514 2.018a14.947 14.947 0 0 1-6.815-6.815l2.018-1.514c.362-.272.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 7.5v9a2.25 2.25 0 0 1-2.25 2.25h-15A2.25 2.25 0 0 1 2.25 16.5v-9m19.5 0A2.25 2.25 0 0 0 19.5 5.25h-15A2.25 2.25 0 0 0 2.25 7.5m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0l-7.5-4.615A2.25 2.25 0 0 1 2.25 7.743V7.5" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function ChatHeadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-7 w-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 19.5 3 21V6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v9a2.25 2.25 0 0 1-2.25 2.25H9.311a2.25 2.25 0 0 0-.836.161L6.75 19.5Z" />
    </svg>
  );
}

export default ContactPage;
