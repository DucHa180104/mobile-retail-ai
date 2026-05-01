import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${id}`);

        if (!response.ok) {
          throw new Error("Không thể tải thông tin sản phẩm");
        }

        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <p className="text-center text-gray-600">Đang tải sản phẩm...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <p className="text-center text-red-600">{error}</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <p className="text-center text-gray-600">Không tìm thấy sản phẩm.</p>
      </main>
    );
  }

  const specs = product.specs || {};

  function handleAddToCart() {
    addToCart(product);
    setMessage("Đã thêm vào giỏ hàng");
  }

  function handleBuyNow() {
    addToCart(product);
    navigate("/checkout");
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="transition hover:text-blue-700">
              Trang chủ
            </Link>
            <span>/</span>
            <Link to="/" className="transition hover:text-blue-700">
              Điện thoại
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-700">{product.name}</span>
          </div>

          <Link
            to="/cart"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            Xem giỏ hàng
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="overflow-hidden rounded-[1.5rem] bg-slate-100">
              <img
                src={product.images?.[0] || "https://via.placeholder.com/700x560?text=Khong+co+anh"}
                alt={product.name}
                className="h-[360px] w-full object-cover sm:h-[500px]"
              />
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                  Sản phẩm nổi bật
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Còn hàng
                </span>
              </div>

              <h1 className="mt-5 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
                {product.name}
              </h1>

              <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                  Giá bán
                </p>
                <p className="mt-2 text-3xl font-black text-blue-700 sm:text-4xl">
                  {product.price?.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <p className="mt-6 text-base leading-7 text-slate-600">
                {product.description || "Chưa có mô tả."}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Thêm vào giỏ
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                >
                  Mua ngay
                </button>
              </div>

              {message && (
                <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {message}
                </p>
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <SpecsIcon />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Thông số kỹ thuật
                  </h2>
                  <p className="text-sm text-slate-500">
                    Tổng hợp thông tin cơ bản của sản phẩm
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <SpecCard label="Màn hình" value={specs.screen} />
                <SpecCard label="Chip" value={specs.chip} />
                <SpecCard label="RAM" value={specs.ram} />
                <SpecCard label="Bộ nhớ" value={specs.storage} />
                <SpecCard label="Pin" value={specs.battery} />
                <SpecCard label="Camera" value={specs.camera} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SpecCard({ label, value }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-900">
        {value || "Đang cập nhật"}
      </p>
    </article>
  );
}

function SpecsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6M9 12h6M9 15h3" />
    </svg>
  );
}

export default ProductDetailPage;
