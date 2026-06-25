import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      {/* Top accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500" />

      <div className="mx-auto max-w-[1360px] px-4 py-12 sm:px-5 lg:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr]">
          {/* Brand */}
          <section>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-black text-white shadow-md shadow-blue-200">
                M
              </span>
              <div>
                <p className="text-base font-black tracking-tight text-slate-900">MẠNH HƯỜNG</p>
                <p className="text-xs text-slate-400">Điện thoại chính hãng</p>
              </div>
            </div>

            <p className="mt-5 max-w-xs text-sm leading-7 text-slate-500">
              Chuyên cung cấp điện thoại, phụ kiện và giải pháp mua sắm công nghệ
              đáng tin cậy với dịch vụ hỗ trợ tận tâm mỗi ngày.
            </p>

            <div className="mt-5 flex gap-3">
              <SocialIcon href="#" label="Facebook">
                <FacebookIcon />
              </SocialIcon>
              <SocialIcon href="#" label="Zalo">
                <ZaloIcon />
              </SocialIcon>
              <SocialIcon href="#" label="TikTok">
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
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-900">
              Liên hệ
            </h3>

            <div className="mt-5 space-y-4 text-sm text-slate-500">
              <ContactRow title="123 Lê Đại Hành, Quận 11, TP.HCM" icon={<PinIcon />} />
              <ContactRow title="0909 123 456" icon={<PhoneIcon />} />
              <ContactRow title="contact@manhhuongmobile.vn" icon={<MailIcon />} />
            </div>

            {/* Trust badge */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">Mở cửa hàng ngày 8:00 – 21:00</span>
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 MẠNH HƯỜNG. Bảo lưu mọi quyền.</p>
          <p>Thiết kế tối ưu cho trải nghiệm mua sắm trực tuyến.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }) {
  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-900">{title}</h3>

      <ul className="mt-5 space-y-3 text-sm text-slate-500">
        {items.map((item) => (
          <li key={item}>
            <Link to="/" className="transition-colors duration-150 hover:text-blue-700">
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
      <span className="mt-0.5 shrink-0 text-blue-600">{icon}</span>
      <span>{title}</span>
    </div>
  );
}

function SocialIcon({ href, label, children }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
    >
      {children}
    </a>
  );
}

function FacebookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function ZaloIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function TiktokIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.81a8.17 8.17 0 0 0 4.77 1.53V6.9a4.85 4.85 0 0 1-1-.21z" />
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
