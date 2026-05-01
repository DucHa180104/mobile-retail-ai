import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

const storageOptions = ["256GB", "512GB", "1TB"];
const colorOptions = [
  { name: "Titan tự nhiên", value: "#b7ada1" },
  { name: "Đen", value: "#1f2937" },
  { name: "Xanh", value: "#4f6d8a" },
  { name: "Trắng", value: "#e5e7eb" }
];

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedStorage, setSelectedStorage] = useState("256GB");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].name);

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

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product?._id]);

  useEffect(() => {
    if (product?.specs?.storage && storageOptions.includes(product.specs.storage)) {
      setSelectedStorage(product.specs.storage);
    }
  }, [product]);

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
  const galleryImages =
    product.images?.length > 0
      ? product.images
      : ["https://via.placeholder.com/700x560?text=Khong+co+anh"];
  const selectedImage = galleryImages[selectedImageIndex] || galleryImages[0];
  const oldPrice = product.oldPrice || null;

  const highlights = buildHighlights(product);

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
            <Link to="/phones" className="transition hover:text-blue-700">
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

        <div className="grid gap-8 xl:grid-cols-[1.18fr_0.82fr]">
          <section className="space-y-6">
            <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-50">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="h-[360px] w-full object-cover sm:h-[500px]"
                />
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`overflow-hidden rounded-2xl border bg-white transition ${
                      selectedImageIndex === index
                        ? "border-blue-500 shadow-sm"
                        : "border-slate-200 hover:border-blue-200"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-20 w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">Đặc điểm nổi bật</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {highlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">Mô tả chi tiết sản phẩm</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {product.description || "Thông tin mô tả chi tiết đang được cập nhật."}
              </p>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-black text-slate-900">Đánh giá từ khách hàng</h2>
                <span className="text-sm font-semibold text-blue-600">Xem tất cả</span>
              </div>

              <div className="mt-4 flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <StarIcon key={index} />
                ))}
                <span className="ml-2 text-sm font-semibold text-slate-700">5.0</span>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Nguyễn Văn A - 2 ngày trước
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Sản phẩm đúng mô tả, máy đẹp và hoạt động ổn định. Cửa hàng hỗ trợ
                  nhanh và giao hàng cẩn thận.
                </p>
              </div>
            </article>
          </section>

          <aside className="space-y-6">
            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7 xl:sticky xl:top-24">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700">
                  NEW
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Chính hãng
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black leading-tight text-slate-900">
                {product.name}
              </h1>

              <div className="mt-5 flex flex-wrap items-end gap-3">
                <p className="text-4xl font-black text-red-500">
                  {product.price?.toLocaleString("vi-VN")} đ
                </p>
                {oldPrice && (
                  <p className="pb-1 text-base text-slate-400 line-through">
                    {oldPrice.toLocaleString("vi-VN")} đ
                  </p>
                )}
              </div>

              <p className="mt-3 text-sm text-slate-500">
                Bảo hành 12 tháng tại MẠNH HƯƠNG
              </p>

              <div className="mt-6">
                <h2 className="text-sm font-bold text-slate-900">Dung lượng</h2>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {storageOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedStorage(option)}
                      className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                        selectedStorage === option
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-sm font-bold text-slate-900">Màu sắc</h2>
                <div className="mt-3 flex flex-wrap gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.name)}
                      className={`flex items-center gap-3 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                        selectedColor === color.name
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"
                      }`}
                    >
                      <span
                        className="h-5 w-5 rounded-full border border-slate-200"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full rounded-xl bg-blue-600 px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-700"
                >
                  Mua ngay
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full rounded-xl border border-blue-200 bg-blue-50 px-5 py-3.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  Thêm vào giỏ
                </button>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                  >
                    Thu cũ đổi mới
                  </button>

                  <button
                    type="button"
                    className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                  >
                    Tư vấn qua Zalo
                  </button>
                </div>
              </div>

              {message && (
                <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {message}
                </p>
              )}

              <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-5">
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-900">
                  Quyền lợi
                </h2>
                <div className="mt-4 space-y-3">
                  <BenefitRow text="Miễn phí vận chuyển nội thành cho đơn từ 500.000đ" />
                  <BenefitRow text="Bảo hành rõ ràng, hỗ trợ nhanh khi cần kiểm tra" />
                  <BenefitRow text="Hỗ trợ chuyển dữ liệu cơ bản khi nhận máy" />
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <SpecsIcon />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Thông số kỹ thuật</h2>
                  <p className="text-sm text-slate-500">Thông tin cơ bản của sản phẩm</p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <SpecRow label="Màn hình" value={specs.screen} />
                <SpecRow label="Chip" value={specs.chip} />
                <SpecRow label="RAM" value={specs.ram} />
                <SpecRow label="Bộ nhớ" value={specs.storage || selectedStorage} />
                <SpecRow label="Pin" value={specs.battery} />
                <SpecRow label="Camera" value={specs.camera} />
              </div>
            </article>
          </aside>
        </div>
      </div>
    </main>
  );
}

function buildHighlights(product) {
  const specs = product.specs || {};

  return [
    {
      title: "Hiệu năng nổi bật",
      description:
        specs.chip
          ? `Trang bị ${specs.chip}, đáp ứng tốt nhu cầu sử dụng hằng ngày và giải trí.`
          : "Hiệu năng của sản phẩm đang được cập nhật chi tiết."
    },
    {
      title: "Màn hình chất lượng",
      description:
        specs.screen
          ? `Màn hình ${specs.screen} cho trải nghiệm hiển thị rõ nét và màu sắc hài hòa.`
          : "Thông tin màn hình đang được cập nhật."
    },
    {
      title: "Pin và camera",
      description:
        specs.battery || specs.camera
          ? `${specs.battery || "Pin đang cập nhật"} - ${specs.camera || "Camera đang cập nhật"}.`
          : "Thông tin pin và camera đang được cập nhật."
    }
  ];
}

function BenefitRow({ text }) {
  return (
    <div className="flex items-start gap-3 text-sm text-slate-600">
      <span className="mt-0.5 text-blue-600">
        <CheckIcon />
      </span>
      <span>{text}</span>
    </div>
  );
}

function SpecRow({ label, value }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 border-b border-slate-200 px-4 py-3 last:border-b-0">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">
        {value || "Đang cập nhật"}
      </span>
    </div>
  );
}

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M12 2 9.2 8.6 2 9.3l5.4 4.7L5.8 21 12 17.3 18.2 21l-1.6-7 5.4-4.7-7.2-.7z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
    </svg>
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
