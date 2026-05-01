import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.1fr]">
          <section>
            <div className="flex items-center gap-2 text-lg font-extrabold text-blue-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm text-white">
                M
              </span>
              <span>Manh Huong</span>
            </div>

            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">
              Manh Huong la diem den cho nguoi yeu cong nghe voi dien thoai
              chinh hang, gia tot va dich vu ho tro tan tam moi ngay.
            </p>

            <div className="mt-5 flex gap-3">
              <SocialIcon label="F" />
              <SocialIcon label="Z" />
              <SocialIcon label="T" />
              <SocialIcon label="Y" />
            </div>
          </section>

          <FooterColumn
            title="Danh muc"
            items={[
              "iPhone",
              "Samsung",
              "Xiaomi",
              "Oppo",
              "Phu kien"
            ]}
          />

          <FooterColumn
            title="Chinh sach"
            items={[
              "Chinh sach bao hanh",
              "Chinh sach doi tra",
              "Giao hang & Thanh toan",
              "Bao mat thong tin"
            ]}
          />

          <section>
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-900">
              Lien he
            </h3>

            <div className="mt-5 space-y-4 text-sm text-slate-500">
              <ContactRow
                title="123 Duong Le Dai Hanh, TP. Ho Chi Minh"
                icon={<PinIcon />}
              />
              <ContactRow title="0909 123 456" icon={<PhoneIcon />} />
              <ContactRow
                title="contact@manhhuongmobile.vn"
                icon={<MailIcon />}
              />
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>(c) 2026 Manh Huong Mobile. All rights reserved.</p>
          <p>Trusted and UX/UI Designed</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }) {
  return (
    <section>
      <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-900">
        {title}
      </h3>

      <ul className="mt-5 space-y-3 text-sm text-slate-500">
        {items.map((item) => (
          <li key={item}>
            <Link to="/" className="transition hover:text-blue-700">
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
      <span className="mt-0.5 text-blue-600">{icon}</span>
      <span>{title}</span>
    </div>
  );
}

function SocialIcon({ label }) {
  return (
    <Link
      to="/"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-bold text-slate-500 transition hover:border-blue-200 hover:text-blue-700"
    >
      {label}
    </Link>
  );
}

function PinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8l-1.3 1.3a16 16 0 0 0 6.4 6.4l1.3-1.3a2 2 0 0 1 1.8-.6l3 .5A2 2 0 0 1 22 16.9Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
    </svg>
  );
}

export default Footer;
