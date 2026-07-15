const badges = [
  {
    title: "Sản phẩm rõ nguồn gốc",
    description: "Thông tin tình trạng, dung lượng, pin và giá bán được trình bày rõ ràng.",
    icon: ShieldIcon
  },
  {
    title: "Giao hàng linh hoạt",
    description: "Hỗ trợ đặt hàng online, xác nhận thông tin và theo dõi trạng thái đơn hàng.",
    icon: TruckIcon
  },
  {
    title: "AI hỗ trợ tư vấn",
    description: "Chatbot gợi ý sản phẩm dựa trên nhu cầu, ngân sách và danh sách hàng đang có.",
    icon: SparkIcon
  }
];

function TrustBadges() {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {badges.map((badge) => {
        const Icon = badge.icon;

        return (
          <article
            key={badge.title}
            className="group rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 p-5 shadow-sm transition-all duration-500 ease-out hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50/40 text-indigo-600 ring-1 ring-indigo-100/40 shadow-sm transition-all duration-500 group-hover:scale-105 group-hover:bg-indigo-50">
                <Icon />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-950 transition-colors group-hover:text-indigo-950">{badge.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{badge.description}</p>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M12 3 5 6v6c0 4.3 2.9 7.8 7 9 4.1-1.2 7-4.7 7-9V6z" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M3 7h11v8H3zM14 10h3l4 3v2h-7z" />
      <circle cx="7.5" cy="18.5" r="1.5" />
      <circle cx="17.5" cy="18.5" r="1.5" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M12 3 14.2 8.8 20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" />
    </svg>
  );
}

export default TrustBadges;
