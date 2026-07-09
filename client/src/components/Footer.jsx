import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buildApiUrl } from "../lib/api.js";

function Footer() {
  const [contactSettings, setContactSettings] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchContactSettings() {
      try {
        const response = await fetch(buildApiUrl("/api/contact-settings"));
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Không thể tải thông tin liên hệ");
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

  const footerContactInfo = useMemo(() => {
    return {
      storeAddress: String(contactSettings?.storeAddress || "").trim() || "Đang cập nhật",
      storePhone: String(contactSettings?.storePhone || "").trim() || "Đang cập nhật",
      supportEmail: String(contactSettings?.supportEmail || "").trim() || "Đang cập nhật"
    };
  }, [contactSettings]);

  return (
    <footer className="mt-16 border-t border-slate-900 bg-slate-950 text-slate-400">
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700" />

      <div className="mx-auto max-w-[1360px] px-4 py-16 sm:px-5 lg:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr]">
          <section>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-700 text-sm font-black text-white shadow-lg shadow-indigo-500/20">
                M
              </span>
              <div>
                <p className="text-base font-black tracking-widest text-white">MẠNH HƯƠNG</p>
                <p className="text-xs font-bold text-indigo-400">MOBILE RETAIL</p>
              </div>
            </div>

            <p className="mt-6 max-w-xs text-sm leading-relaxed text-slate-400">
              Hệ thống bán lẻ điện thoại cũ/mới uy tín. Cam kết chất lượng rõ ràng, bảo hành minh bạch và hỗ trợ khách hàng tận tâm.
            </p>

            <div className="mt-6 flex gap-3">
              <SocialIcon href="#" label="Facebook" hoverClass="hover:border-transparent hover:bg-[#1877f2] hover:text-white hover:shadow-lg hover:shadow-blue-500/25">
                <FacebookIcon />
              </SocialIcon>
              <SocialIcon href="#" label="Zalo" hoverClass="hover:border-transparent hover:bg-[#0068ff] hover:text-white hover:shadow-lg hover:shadow-sky-500/25">
                <ZaloIcon />
              </SocialIcon>
              <SocialIcon href="#" label="TikTok" hoverClass="hover:border-transparent hover:bg-white hover:text-black hover:shadow-lg hover:shadow-white/20">
                <TiktokIcon />
              </SocialIcon>
            </div>
          </section>

          <FooterColumn
            title="Danh mục"
            items={["iPhone", "Samsung", "Xiaomi", "Oppo", "Phụ kiện"]}
          />

          <FooterColumn
            title="Chính sách"
            items={[
              "Chính sách bảo hành",
              "Chính sách đổi trả",
              "Giao hàng và thanh toán",
              "Bảo mật thông tin"
            ]}
          />

          <section>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">
              Liên hệ
            </h3>

            <div className="mt-6 space-y-4 text-sm text-slate-400">
              <ContactRow title={footerContactInfo.storeAddress} icon={<PinIcon />} />
              <ContactRow title={footerContactInfo.storePhone} icon={<PhoneIcon />} />
              <ContactRow title={footerContactInfo.supportEmail} icon={<MailIcon />} />
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-4 py-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-300">Cửa hàng mở cửa: 8:00 - 21:00</span>
            </div>
          </section>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-900 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 MẠNH HƯƠNG MOBILE. Bảo lưu mọi quyền.</p>
          <p>Thiết kế tối ưu cho trải nghiệm mua sắm thiết bị công nghệ.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }) {
  return (
    <section>
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">{title}</h3>

      <ul className="mt-6 space-y-3.5 text-sm text-slate-400">
        {items.map((item) => (
          <li key={item}>
            <Link to="/" className="transition-colors duration-200 hover:text-white">
              {item}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ContactRow({ icon, title }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-indigo-400">{icon}</span>
      <span className="leading-relaxed">{title}</span>
    </div>
  );
}

function SocialIcon({ href, label, hoverClass, children }) {
  return (
    <a
      href={href}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 text-slate-400 transition-all duration-300 ${hoverClass}`}
    >
      {children}
    </a>
  );
}

function FacebookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03.3-1.5 1.5-1.5H17V2h-3c-3 0-5 1.78-5 4.8v2.7H7v4h2V22h5v-8.5z" />
    </svg>
  );
}

function ZaloIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
      <path d="M12 2C6.48 2 2 5.8 2 10.5c0 2.65 1.43 4.98 3.65 6.42L4.5 21l4.83-2.42c.86.26 1.76.42 2.67.42 5.52 0 10-3.8 10-8.5S17.52 2 12 2zm-1.2 11.5H8.5V13l1.8-2.5H8.6V9.5h2.1V10l-1.8 2.5h1.9v1zm4.7 0H12.2V9.5h1.2v3H15.5v1z" />
    </svg>
  );
}

function TiktokIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.74-3.94-1.78-.22-.22-.4-.47-.59-.72v7.37c-.03 2.44-1.27 4.96-3.57 5.93-2.3 1.01-5.11.75-7.06-.92-2.07-1.73-2.73-4.91-1.48-7.3 1.12-2.18 3.66-3.61 6.13-3.21v4.09c-1.14-.3-2.47.11-3.09 1.09-.72 1.12-.4 2.8.74 3.51 1.09.7 2.66.42 3.38-.7.22-.34.3-.74.3-1.15V0h4.03z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8l-1.3 1.3a16 16 0 0 0 6.4 6.4l1.3-1.3a2 2 0 0 1 1.8-.6l3 .5A2 2 0 0 1 22 16.9Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
    </svg>
  );
}

export default Footer;
