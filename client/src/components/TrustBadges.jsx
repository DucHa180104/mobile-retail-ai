const badges = [
  {
    title: "Hàng chính hãng",
    description: "Cam kết sản phẩm rõ nguồn gốc, bảo đảm chất lượng.",
    icon: ShieldIcon
  },
  {
    title: "Giao hàng nhanh",
    description: "Hỗ trợ giao nhanh nội thành và toàn quốc đúng hẹn.",
    icon: TruckIcon
  },
  {
    title: "Uy tín đảm bảo",
    description: "Tư vấn rõ ràng, hỗ trợ tận tâm trước và sau mua hàng.",
    icon: MedalIcon
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
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon />
              </span>

              <div>
                <h3 className="font-bold text-slate-900">{badge.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {badge.description}
                </p>
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 5 6v6c0 4.3 2.9 7.8 7 9 4.1-1.2 7-4.7 7-9V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v8H3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h3l4 3v2h-7z" />
      <circle cx="7.5" cy="18.5" r="1.5" />
      <circle cx="17.5" cy="18.5" r="1.5" />
    </svg>
  );
}

function MedalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <circle cx="12" cy="8" r="5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 13.5-1 7 4.5-2 4.5 2-1-7" />
    </svg>
  );
}

export default TrustBadges;
