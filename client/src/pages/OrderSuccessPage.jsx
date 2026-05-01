import { Link } from "react-router-dom";

function OrderSuccessPage() {
  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
        <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-14">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-inner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-14 w-14"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <span className="mt-8 inline-flex rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          Order Completed
        </span>

        <h1 className="mt-6 text-3xl font-black text-slate-900 sm:text-4xl">
          Dat hang thanh cong
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-500">
          Cam on ban da mua hang. Cua hang se lien he xac nhan don trong thoi
          gian som nhat.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            to="/"
            className="rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-700"
          >
            Tiep tuc mua hang
          </Link>

          <Link
            to="/cart"
            className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            Xem gio hang
          </Link>
        </div>

        <div className="mt-10 rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-500">
          Don hang da duoc ghi nhan trong he thong. Ban co the tiep tuc mua sam
          hoac quay lai gio hang de kiem tra.
        </div>
        </section>
      </div>
    </main>
  );
}

export default OrderSuccessPage;
