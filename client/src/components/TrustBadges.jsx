const badges = [
  {
    title: "Hang chinh hang",
    description: "Cam ket chat luong 100%",
    icon: ShieldIcon
  },
  {
    title: "Giao hang nhanh",
    description: "Mien phi noi thanh tu 500K",
    icon: TruckIcon
  },
  {
    title: "Bao hanh 12 thang",
    description: "Doi tra trong 30 ngay dau",
    icon: BadgeIcon
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
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon />
              </span>

              <div>
                <h3 className="font-bold text-slate-900">{badge.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
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

function BadgeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a5 5 0 0 0-5 5v3.5L5 14l2 7 5-3 5 3 2-7-2-2.5V8a5 5 0 0 0-5-5z" />
    </svg>
  );
}

export default TrustBadges;
