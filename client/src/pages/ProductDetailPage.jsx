import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReviewForm from "../components/ReviewForm.jsx";
import ReviewList from "../components/ReviewList.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { buildApiUrl } from "../lib/api.js";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState("");
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState("");
  const [purchaseCheckLoading, setPurchaseCheckLoading] = useState(false);
  const [eligibleOrderId, setEligibleOrderId] = useState("");
  const [editingReview, setEditingReview] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(buildApiUrl(`/api/products/${id}`));
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Không thể tải thông tin sản phẩm");
        }

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
    fetchReviews();
  }, [id]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product?._id]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setEligibleOrderId("");
      setPurchaseCheckLoading(false);
      return;
    }

    checkEligibleOrder();
  }, [id, isAuthenticated, token]);

  useEffect(() => {
    async function fetchWishlist() {
      if (!isAuthenticated || !token) {
        setWishlist([]);
        return;
      }

      try {
        const response = await fetch(buildApiUrl("/api/wishlist"), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Không thể tải danh sách yêu thích");
        }

        const data = await response.json();
        setWishlist(data.wishlist || []);
      } catch {
        setWishlist([]);
      }
    }

    fetchWishlist();
  }, [isAuthenticated, token]);

  const galleryImages = useMemo(() => {
    if (!product?.images?.length) {
      return ["https://via.placeholder.com/700x560?text=Khong+co+anh"];
    }

    return product.images;
  }, [product]);

  const currentUserId = user?._id || user?.id || "";

  const currentUserReview = useMemo(() => {
    if (!currentUserId) {
      return null;
    }

    return reviews.find((review) => String(review.user?._id) === String(currentUserId)) || null;
  }, [currentUserId, reviews]);

  const hasUserReviewed = Boolean(currentUserReview);

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return 0;
    }

    const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return totalRating / reviews.length;
  }, [reviews]);

  const wishlistIds = useMemo(
    () => new Set(wishlist.map((wishlistProduct) => String(wishlistProduct._id))),
    [wishlist]
  );

  async function fetchReviews() {
    try {
      setReviewsLoading(true);
      setReviewsError("");

      const response = await fetch(buildApiUrl(`/api/reviews/product/${id}`));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải đánh giá sản phẩm");
      }

      setReviews(data);
    } catch (fetchError) {
      setReviewsError(fetchError.message || "Không thể tải đánh giá sản phẩm");
    } finally {
      setReviewsLoading(false);
    }
  }

  async function checkEligibleOrder() {
    try {
      setPurchaseCheckLoading(true);

      const response = await fetch(buildApiUrl("/api/orders/my-orders"), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể kiểm tra lịch sử mua hàng");
      }

      const matchedOrder = data.find((order) => {
        if (order.status !== "confirmed") {
          return false;
        }

        return order.items?.some(
          (item) => String(item.productId?._id || item.productId) === String(id)
        );
      });

      setEligibleOrderId(matchedOrder?._id || "");
    } catch {
      setEligibleOrderId("");
    } finally {
      setPurchaseCheckLoading(false);
    }
  }

  function handleAddToCart() {
    addToCart(product);
    setMessage("Đã thêm vào giỏ hàng");
  }

  function handleBuyNow() {
    addToCart(product);
    navigate("/checkout");
  }

  async function handleToggleWishlist() {
    if (!isAuthenticated || !token) {
      window.alert("Vui lòng đăng nhập để dùng danh sách yêu thích");
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/api/wishlist/toggle"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product._id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể cập nhật danh sách yêu thích");
      }

      setWishlist(data.wishlist || []);
    } catch (toggleError) {
      window.alert(toggleError.message || "Không thể cập nhật danh sách yêu thích");
    }
  }

  async function handleSubmitReview({ rating, comment, images }) {
    if (!token) {
      setReviewSubmitError("Bạn cần đăng nhập để đánh giá sản phẩm này");
      return false;
    }

    if (!editingReview && !eligibleOrderId) {
      setReviewSubmitError("Bạn chưa mua sản phẩm này");
      return false;
    }

    try {
      setReviewSubmitLoading(true);
      setReviewSubmitError("");
      setReviewSuccessMessage("");

      const response = await fetch(
        editingReview
          ? buildApiUrl(`/api/reviews/${editingReview._id}`)
          : buildApiUrl("/api/reviews"),
        {
          method: editingReview ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...(editingReview
              ? {}
              : {
                  productId: id,
                  orderId: eligibleOrderId
                }),
            rating,
            comment,
            images
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.message === "You can only review products from your confirmed orders") {
          throw new Error("Bạn chưa mua sản phẩm này");
        }

        if (data.message === "You have already reviewed this product") {
          throw new Error("Bạn đã đánh giá sản phẩm này");
        }

        if (data.message === "You can only edit your own review") {
          throw new Error("Bạn chỉ có thể sửa đánh giá của chính mình");
        }

        throw new Error(data.message || "Không thể gửi đánh giá");
      }

      setReviewSuccessMessage(
        editingReview ? "Cập nhật đánh giá thành công" : "Gửi đánh giá thành công"
      );
      setEditingReview(null);
      await fetchReviews();
      return true;
    } catch (submitError) {
      setReviewSubmitError(submitError.message || "Không thể gửi đánh giá");
      return false;
    } finally {
      setReviewSubmitLoading(false);
    }
  }

  function handleStartEditReview(review) {
    setEditingReview(review);
    setReviewSubmitError("");
    setReviewSuccessMessage("");
  }

  function handleCancelEditReview() {
    setEditingReview(null);
    setReviewSubmitError("");
  }

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
  const isUsedProduct = product.condition !== "new";
  const conditionLabel = getConditionLabel(product.condition);
  const conditionClassName = getConditionClassName(product.condition);
  const highlights = isUsedProduct ? buildUsedHighlights(product) : buildNewHighlights(product);
  const machineDetailRows = buildMachineDetailRows(product, isUsedProduct);
  const purchaseNotes = buildPurchaseNotes(isUsedProduct);
  const isWishlisted = wishlistIds.has(String(product._id));

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 sm:text-sm">
            <Link to="/" className="transition hover:text-indigo-650">
              Trang chủ
            </Link>
            <span className="text-slate-300">/</span>
            <Link to="/phones" className="transition hover:text-indigo-650">
              Điện thoại
            </Link>
            <span className="text-slate-300">/</span>
            <span className="max-w-[200px] truncate text-slate-600">{product.name}</span>
          </div>

          <Link
            to="/cart"
            className="rounded-full border border-slate-100 bg-white px-4.5 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-indigo-150 hover:text-indigo-600 sm:text-sm"
          >
            Xem giỏ hàng
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-6">
            <article className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.5rem] border border-slate-50 bg-slate-50/50">
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className={`absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all duration-300 active:scale-90 ${
                    isWishlisted ? "text-red-500 shadow-red-100" : "text-slate-400 hover:text-red-500"
                  }`}
                  aria-label={`${isWishlisted ? "Bỏ yêu thích" : "Thêm yêu thích"} ${product.name}`}
                >
                  <HeartIcon isFilled={isWishlisted} />
                </button>
                <img
                  key={selectedImageIndex}
                  src={selectedImage}
                  alt={product.name}
                  className="h-full w-full cursor-zoom-in object-contain transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-16 w-16 overflow-hidden rounded-xl border-2 bg-white p-1 transition-all duration-300 hover:scale-105 ${
                      selectedImageIndex === index
                        ? "border-indigo-600 ring-4 ring-indigo-50"
                        : "border-slate-100 hover:border-indigo-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  </button>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-800">
                {isUsedProduct ? "Tình trạng thực tế của máy" : "Điểm nổi bật của sản phẩm"}
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {highlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all duration-300 hover:border-indigo-100 hover:bg-white"
                  >
                    <h3 className="text-sm font-bold text-slate-800 sm:text-base">{item.title}</h3>
                    <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-800">
                {isUsedProduct ? "Mô tả chi tiết sản phẩm" : "Giới thiệu sản phẩm"}
              </h2>
              <div className="prose prose-slate mt-4 max-w-none text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
                {product.description || "Thông tin mô tả chi tiết đang được cập nhật."}
              </div>
            </article>

            <article className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-lg font-black text-slate-800">Đánh giá từ khách hàng</h2>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    Chỉ người dùng đã mua hàng và hoàn thành đơn hàng mới được đánh giá.
                  </p>
                </div>

                <div className="min-w-[120px] rounded-2xl border border-amber-100 bg-amber-50/70 px-5 py-3.5 text-center">
                  <p className="text-3xl font-black leading-none text-amber-500">
                    {reviews.length ? averageRating.toFixed(1) : "0.0"}
                  </p>
                  <p className="mt-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    {reviews.length} đánh giá
                  </p>
                </div>
              </div>

              <div className="mt-6">
                {!isAuthenticated ? (
                  <div className="rounded-2xl border border-indigo-50 bg-indigo-50/40 px-5 py-4 text-xs font-bold text-indigo-700 sm:text-sm">
                    Vui lòng đăng nhập để đánh giá sản phẩm
                  </div>
                ) : purchaseCheckLoading ? (
                  <div className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-xs font-bold text-slate-500 sm:text-sm">
                    Đang kiểm tra điều kiện đánh giá...
                  </div>
                ) : reviewsLoading ? (
                  <div className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-xs font-bold text-slate-500 sm:text-sm">
                    Đang tải dữ liệu đánh giá...
                  </div>
                ) : editingReview ? (
                  <ReviewForm
                    onSubmit={handleSubmitReview}
                    token={token}
                    loading={reviewSubmitLoading}
                    error={reviewSubmitError}
                    initialValues={editingReview}
                    isEditing
                    onCancel={handleCancelEditReview}
                  />
                ) : hasUserReviewed ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-5 py-4 text-xs font-bold text-emerald-700 sm:text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span>Bạn đã đánh giá sản phẩm này</span>
                      {currentUserReview ? (
                        <button
                          type="button"
                          onClick={() => handleStartEditReview(currentUserReview)}
                          className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 hover:scale-105"
                        >
                          Sửa đánh giá
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : eligibleOrderId ? (
                  <ReviewForm
                    onSubmit={handleSubmitReview}
                    token={token}
                    loading={reviewSubmitLoading}
                    error={reviewSubmitError}
                  />
                ) : (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/30 px-5 py-4 text-xs font-bold text-amber-700 sm:text-sm">
                    Bạn cần mua và hoàn thành đơn hàng mới được đánh giá sản phẩm này.
                  </div>
                )}

                {reviewSuccessMessage ? (
                  <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 sm:text-sm">
                    {reviewSuccessMessage}
                  </p>
                ) : null}
              </div>

              <div className="mt-6">
                <ReviewList
                  reviews={reviews}
                  loading={reviewsLoading}
                  error={reviewsError}
                  currentUserId={currentUserId}
                  onEditReview={handleStartEditReview}
                />
              </div>
            </article>

            <article className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-800">
                {isUsedProduct ? "Lưu ý trước khi mua hàng" : "Quyền lợi khi mua máy mới"}
              </h2>
              <div className="mt-4 space-y-3 rounded-2xl border border-slate-50 bg-slate-50/50 p-5">
                {purchaseNotes.map((note) => (
                  <p
                    key={note}
                    className="text-xs font-medium leading-relaxed text-slate-500 sm:text-sm"
                  >
                    • {note}
                  </p>
                ))}
              </div>
            </article>
          </section>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <article className="animate-fade-in rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm ${conditionClassName}`}
                >
                  {conditionLabel}
                </span>
                <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  {isUsedProduct ? "Điện thoại cũ" : "Máy mới chính hãng"}
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-black leading-tight text-slate-850 sm:text-3xl">
                {product.name}
              </h1>

              <div className="mt-5">
                <p className="text-3xl font-black tracking-tight text-rose-500 sm:text-4xl">
                  {product.price?.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <p className="mt-3 text-xs font-medium leading-relaxed text-slate-400">
                {isUsedProduct
                  ? "Mức giá đã bao gồm VAT. Ngoại hình, pin và tình trạng máy được ghi nhận theo đúng thiết bị đang bán."
                  : "Mức giá đã bao gồm VAT và gói bảo hành đi kèm. Phù hợp cho khách cần xem nhanh cấu hình và quyền lợi khi mua máy mới."}
              </p>

              <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-slate-50/60 p-5">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {isUsedProduct ? "Thông tin máy đang có" : "Thông tin nhanh của sản phẩm"}
                </h2>
                <div className="mt-4 grid gap-2.5">
                  {machineDetailRows.map((row) => (
                    <DetailRow key={row.label} label={row.label} value={row.value} />
                  ))}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 py-4 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-indigo-150 transition-all duration-300 hover:from-blue-750 hover:to-indigo-850 hover:shadow-lg active:scale-98"
                >
                  Mua ngay
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full rounded-xl border border-slate-150 bg-slate-50 py-3.5 text-xs font-black uppercase tracking-wider text-slate-650 transition-all duration-300 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 active:scale-98"
                >
                  Thêm vào giỏ hàng
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    to="/trade-in"
                    className="flex items-center justify-center rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-center text-xs font-bold text-orange-705 transition hover:border-orange-200 hover:bg-orange-50"
                  >
                    Thu cũ đổi mới
                  </Link>

                  <a
                    href="https://zalo.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-center text-xs font-bold text-sky-705 transition hover:border-sky-200 hover:bg-sky-50"
                  >
                    Chat Zalo
                  </a>
                </div>
              </div>

              {message ? (
                <p className="mt-4 animate-fade-in rounded-xl border border-emerald-100 bg-emerald-50 py-3 text-center text-xs font-bold text-emerald-750 sm:text-sm">
                  ✓ {message}
                </p>
              ) : null}

              <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-slate-50/60 p-5">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Cam kết tại cửa hàng
                </h2>
                <div className="mt-4 space-y-3">
                  <BenefitRow text="Miễn phí ship nội thành đơn trên 500k" />
                  <BenefitRow
                    text={
                      isUsedProduct
                        ? "Bảo hành nguồn và màn hình trong 3 tháng"
                        : "Bảo hành theo chính sách máy mới tại cửa hàng"
                    }
                  />
                  <BenefitRow text="Hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng" />
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-650">
                  <SpecsIcon />
                </span>
                <div>
                  <h2 className="text-sm font-black text-slate-800">
                    {isUsedProduct ? "Cấu hình tham khảo" : "Thông số kỹ thuật"}
                  </h2>
                  <p className="text-[11px] font-bold text-slate-400">
                    {isUsedProduct
                      ? "Thông tin cấu hình để đối chiếu nhanh khi chọn máy"
                      : "Thông số cốt lõi của sản phẩm mới"}
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
                <SpecRow label="Màn hình" value={specs.screen} />
                <SpecRow label="Vi xử lý (Chip)" value={specs.chip} />
                <SpecRow label="RAM" value={specs.ram} />
                <SpecRow label="Bộ nhớ trong" value={specs.storage} />
                <SpecRow label="Dung lượng pin" value={specs.battery} />
                <SpecRow label="Hệ thống camera" value={specs.camera} />
              </div>
            </article>
          </aside>
        </div>
      </div>
    </main>
  );
}

function buildUsedHighlights(product) {
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

function buildNewHighlights(product) {
  const specs = product.specs || {};

  return [
    {
      title: "Hiệu năng và chip",
      description:
        specs.chip || specs.ram
          ? `${specs.chip || "Chip đang cập nhật"}${specs.ram ? `, ${specs.ram}` : ""}.`
          : "Thông tin chip và hiệu năng đang được cập nhật."
    },
    {
      title: "Màn hình và trải nghiệm",
      description:
        specs.screen || specs.storage
          ? `${specs.screen || "Màn hình đang cập nhật"}${specs.storage ? ` - ${specs.storage}` : ""}.`
          : "Thông tin màn hình đang được cập nhật."
    },
    {
      title: "Pin và camera",
      description:
        specs.battery || specs.camera
          ? `${specs.battery || "Pin đang cập nhật"} - ${specs.camera || "Camera đang cập nhật"}.`
          : "Thông tin pin và camera đang được cập nhật."
    },
    {
      title: "Quyền lợi khi mua",
      description:
        "Máy mới ưu tiên xác định cấu hình, bảo hành và tình trạng hàng sẵn tại cửa hàng."
    }
  ];
}

function buildMachineDetailRows(product, isUsedProduct) {
  const specs = product.specs || {};
  const usedDetails = product.usedDetails || {};
  const stockText =
    Number(product.stock) > 0 ? `${product.stock} máy có sẵn` : "Tạm hết hàng";

  if (isUsedProduct) {
    return [
      { label: "Tình trạng", value: getConditionLabel(product.condition) },
      { label: "Màu sắc", value: usedDetails.color },
      { label: "Bộ nhớ", value: specs.storage },
      { label: "Sức khỏe pin", value: usedDetails.batteryHealth || specs.battery },
      { label: "Màn hình", value: usedDetails.screenStatus },
      { label: "Thân máy / Vỏ", value: usedDetails.bodyStatus },
      { label: "Face ID / Vân tay", value: usedDetails.faceIdStatus },
      { label: "Sửa chữa", value: usedDetails.repairHistory || "Chưa qua sửa chữa" },
      { label: "Phụ kiện", value: usedDetails.accessories },
      { label: "Bảo hành", value: usedDetails.warranty },
      { label: "Trạng thái hàng", value: stockText },
      { label: "Ghi chú thêm", value: usedDetails.note }
    ];
  }

  return [
    { label: "Hãng", value: product.brand },
    { label: "Màn hình", value: specs.screen },
    { label: "Vi xử lý", value: specs.chip },
    { label: "RAM", value: specs.ram },
    { label: "Bộ nhớ", value: specs.storage },
    { label: "Pin", value: specs.battery },
    { label: "Camera", value: specs.camera },
    { label: "Bảo hành", value: usedDetails.warranty || "Bảo hành theo chính sách cửa hàng" },
    { label: "Trạng thái hàng", value: stockText }
  ];
}

function buildPurchaseNotes(isUsedProduct) {
  if (isUsedProduct) {
    return [
      "Đây là sản phẩm điện thoại cũ, hình thức thực tế và hiệu suất pin sẽ có sự khác biệt nhỏ theo từng máy.",
      "Cửa hàng khuyến khích bạn kiểm tra kỹ thông tin mô tả chi tiết, hình ảnh chụp thực tế và liên hệ nhân viên để được gửi video máy trước khi giao hàng."
    ];
  }

  return [
    "Máy mới ưu tiên xem nhanh cấu hình, bộ nhớ, camera, pin và trạng thái hàng sẵn tại shop.",
    "Nếu cần tư vấn chi tiết hơn về nhu cầu học tập, chơi game hoặc chụp ảnh, bạn có thể dùng chatbot hoặc liên hệ shop để được gợi ý nhanh."
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
      <span className="text-sm font-semibold text-slate-900">{value || "Đang cập nhật"}</span>
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

function HeartIcon({ isFilled }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={isFilled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m12 20-1.4-1.3C5.4 14 2 10.9 2 7.2 2 4.4 4.2 2 7 2c1.6 0 3.2.7 4.2 1.9C12.8 2.7 14.4 2 16 2c2.8 0 5 2.4 5 5.2 0 3.7-3.4 6.8-8.6 11.5Z"
      />
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
