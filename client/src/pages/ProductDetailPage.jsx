import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { buildApiUrl } from "../lib/api.js";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(buildApiUrl(`/api/products/${id}`));

        if (!response.ok) {
          throw new Error("Không thể tải thông tin sản phẩm");
        }

        const data = await response.json();
        setProduct(data);
      } catch (fetchError) {
        setError(fetchError.message || "Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product?._id]);

  const galleryImages = useMemo(() => {
    if (!product?.images?.length) {
      return ["https://via.placeholder.com/700x560?text=Khong+co+anh"];
    }

    return product.images;
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
  const usedDetails = product.usedDetails || {};
  const selectedImage = galleryImages[selectedImageIndex] || galleryImages[0];
  const conditionLabel = getConditionLabel(product.condition);
  const conditionClassName = getConditionClassName(product.condition);
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
              <h2 className="text-xl font-black text-slate-900">Tình trạng thực tế của máy</h2>
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
              <h2 className="text-xl font-black text-slate-900">Lưu ý trước khi mua</h2>
              <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-600">
                  Đây là điện thoại cũ nên tình trạng máy, pin và ngoại hình sẽ khác nhau theo
                  từng máy thực tế.
                </p>
                <p className="text-sm leading-6 text-slate-600">
                  Cửa hàng khuyến khích khách kiểm tra kỹ ảnh thật, tình trạng màn hình, pin,
                  Face ID/Touch ID và phụ kiện trước khi chốt đơn.
                </p>
              </div>
            </article>
          </section>

          <aside className="space-y-6">
            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7 xl:sticky xl:top-24">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${conditionClassName}`}>
                  {conditionLabel}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Máy cũ
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black leading-tight text-slate-900">
                {product.name}
              </h1>

              <div className="mt-5 flex flex-wrap items-end gap-3">
                <p className="text-4xl font-black text-red-500">
                  {product.price?.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <p className="mt-3 text-sm text-slate-500">
                Thông tin bên dưới được hiển thị theo đúng tình trạng máy đang có tại MẠNH HƯƠNG.
              </p>

              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-900">
                  Thông tin máy đang có
                </h2>
                <div className="mt-4 grid gap-3">
                  <DetailRow label="Tình trạng máy" value={conditionLabel} />
                  <DetailRow label="Màu sắc" value={usedDetails.color} />
                  <DetailRow label="Dung lượng" value={specs.storage} />
                  <DetailRow label="Pin còn" value={usedDetails.batteryHealth || specs.battery} />
                  <DetailRow label="Tình trạng màn hình" value={usedDetails.screenStatus} />
                  <DetailRow label="Ngoại hình" value={usedDetails.bodyStatus} />
                  <DetailRow label="Face ID / Touch ID" value={usedDetails.faceIdStatus} />
                  <DetailRow label="Lịch sử sửa chữa" value={usedDetails.repairHistory} />
                  <DetailRow label="Phụ kiện đi kèm" value={usedDetails.accessories} />
                  <DetailRow label="Bảo hành" value={usedDetails.warranty} />
                  <DetailRow
                    label="Tồn kho"
                    value={
                      Number(product.stock) > 0
                        ? `${product.stock} máy sẵn có`
                        : "Tạm hết hàng"
                    }
                  />
                  <DetailRow label="Ghi chú thêm" value={usedDetails.note} />
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
                  <p className="text-sm text-slate-500">Thông tin cấu hình cơ bản của máy</p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <SpecRow label="Màn hình" value={specs.screen} />
                <SpecRow label="Chip" value={specs.chip} />
                <SpecRow label="RAM" value={specs.ram} />
                <SpecRow label="Bộ nhớ" value={specs.storage} />
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
  const usedDetails = product.usedDetails || {};
  const conditionLabel = getConditionLabel(product.condition);

  return [
    {
      title: "Tình trạng tổng thể",
      description:
        usedDetails.bodyStatus ||
        `Máy thuộc nhóm ${conditionLabel.toLowerCase()}, thông tin được ghi theo đúng máy đang bán.`
    },
    {
      title: "Pin và sử dụng hằng ngày",
      description:
        usedDetails.batteryHealth || specs.battery
          ? `Pin còn ${usedDetails.batteryHealth || "đang cập nhật"}, ${specs.battery || "thông tin pin đang cập nhật"}.`
          : "Thông tin pin đang được cập nhật."
    },
    {
      title: "Màn hình và bảo mật",
      description:
        usedDetails.screenStatus || usedDetails.faceIdStatus
          ? `${usedDetails.screenStatus || "Màn hình đang cập nhật"} - ${usedDetails.faceIdStatus || "Face ID / Touch ID đang cập nhật"}.`
          : "Thông tin màn hình và bảo mật đang được cập nhật."
    },
    {
      title: "Bảo hành và phụ kiện",
      description:
        usedDetails.warranty || usedDetails.accessories
          ? `${usedDetails.warranty || "Bảo hành đang cập nhật"} - ${usedDetails.accessories || "Phụ kiện đang cập nhật"}.`
          : "Thông tin bảo hành và phụ kiện đang được cập nhật."
    }
  ];
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-white px-4 py-3">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-900">
        {value || "Đang cập nhật"}
      </span>
    </div>
  );
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

function getConditionLabel(condition) {
  if (condition === "used_99") {
    return "Cũ 99%";
  }

  if (condition === "used_good") {
    return "Cũ đẹp";
  }

  if (condition === "used_fair") {
    return "Cũ dùng tốt";
  }

  return "Máy mới";
}

function getConditionClassName(condition) {
  if (condition === "used_99") {
    return "bg-amber-100 text-amber-700";
  }

  if (condition === "used_good") {
    return "bg-blue-100 text-blue-700";
  }

  if (condition === "used_fair") {
    return "bg-slate-200 text-slate-700";
  }

  return "bg-emerald-100 text-emerald-700";
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
