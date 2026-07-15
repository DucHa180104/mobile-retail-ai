import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReviewForm from "../components/ReviewForm.jsx";
import ReviewList from "../components/ReviewList.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { buildApiUrl, resolveMediaUrl } from "../lib/api.js";

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
  const [quantity, setQuantity] = useState(1);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState("");
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState("");
  const [purchaseCheckLoading, setPurchaseCheckLoading] = useState(false);
  const [eligibleOrderId, setEligibleOrderId] = useState("");
  const [editingReview, setEditingReview] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    if (!product?.category) return;
    async function fetchRelated() {
      try {
        const response = await fetch(buildApiUrl(`/api/products?category=${product.category}&limit=8`));
        if (!response.ok) return;
        const data = await response.json();
        const filtered = (data.products || []).filter(p => String(p._id) !== String(product._id)).slice(0, 5);
        setRelatedProducts(filtered);
      } catch (err) {
        console.error(err);
      }
    }
    fetchRelated();
  }, [product?.category, product?._id]);

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

    return product.images.map((image) => resolveMediaUrl(image));
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
    addToCart(product, quantity);
    setMessage(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
  }

  function handleBuyNow() {
    addToCart(product, quantity);
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
  const originalPrice = product.price ? product.price + 1000050 : null;
  const categoryLabel = product.category === "phone" ? "Điện thoại" : product.category === "tablet" ? "Máy tính bảng" : "Phụ kiện";
  const categoryLink = product.category === "phone" ? "/phones" : product.category === "tablet" ? "/tablets" : "/accessories";
  const isWishlisted = wishlistIds.has(String(product._id));
  const machineDetailRows = buildMachineDetailRows(product, isUsedProduct);
  const purchaseNotes = buildPurchaseNotes(isUsedProduct);

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8 bg-white min-h-screen">
      <div className="mx-auto max-w-[1360px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 sm:text-sm">
            <Link to="/" className="transition hover:text-slate-900">
              Trang chủ
            </Link>
            <span className="text-slate-300">/</span>
            <Link to={categoryLink} className="transition hover:text-slate-900">
              {categoryLabel}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="max-w-[240px] truncate text-slate-900 font-extrabold">{product.name}</span>
          </div>

          <Link
            to="/cart"
            className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-900 hover:text-slate-900"
          >
            Xem giỏ hàng
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.18fr_0.82fr]">
          <section className="space-y-6">
            <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-[80px_1fr] gap-5">
                <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto no-scrollbar">
                  {galleryImages.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square w-full overflow-hidden rounded-xl border bg-white p-1 transition-all duration-300 ${
                        selectedImageIndex === index
                          ? "border-slate-900 ring-2 ring-slate-100"
                          : "border-slate-150 hover:border-slate-400"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="h-full w-full rounded-lg object-cover"
                      />
                    </button>
                  ))}
                </div>

                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/60 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleToggleWishlist}
                    className={`absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all duration-300 active:scale-90 ${
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
                    className="h-[85%] w-[85%] object-contain transition-transform duration-500 hover:scale-[1.02]"
                  />
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {isUsedProduct ? "Tình trạng thực tế của máy" : "Điểm nổi bật của sản phẩm"}
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {highlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-100 bg-slate-50/30 p-5 transition-all duration-300 hover:border-slate-200 hover:bg-white"
                  >
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{item.title}</h3>
                    <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {isUsedProduct ? "Mô tả chi tiết sản phẩm" : "Giới thiệu sản phẩm"}
              </h2>
              <div className="prose prose-slate mt-4 max-w-none text-xs font-semibold leading-relaxed text-slate-500 sm:text-sm">
                {product.description || "Thông tin mô tả chi tiết đang được cập nhật."}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">Đánh giá từ khách hàng</h2>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    Chỉ người dùng đã mua hàng và hoàn thành đơn hàng mới được đánh giá.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                {!isAuthenticated ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/40 px-5 py-4 text-xs font-bold text-slate-500">
                    Vui lòng đăng nhập để đánh giá sản phẩm
                  </div>
                ) : purchaseCheckLoading ? (
                  <div className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-xs font-bold text-slate-400">
                    Đang kiểm tra điều kiện đánh giá...
                  </div>
                ) : reviewsLoading ? (
                  <div className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-xs font-bold text-slate-400">
                    Đang tải dữ liệu đánh giá...
                  </div>
                ) : editingReview ? (
                  <div className="border border-slate-100/80 rounded-2xl p-5 bg-slate-50/20">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-4">
                      {editingReview._id ? "Chỉnh sửa đánh giá" : "Thêm đánh giá mới"}
                    </h3>
                    <ReviewForm
                      onSubmit={handleSubmitReview}
                      token={token}
                      loading={reviewSubmitLoading}
                      error={reviewSubmitError}
                      initialValues={editingReview}
                      isEditing
                      onCancel={handleCancelEditReview}
                    />
                  </div>
                ) : hasUserReviewed ? (
                  <div className="rounded-2xl border border-slate-150 bg-slate-50/30 px-5 py-4 text-xs font-bold text-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span>Bạn đã đánh giá sản phẩm này</span>
                      {currentUserReview ? (
                        <button
                          type="button"
                          onClick={() => handleStartEditReview(currentUserReview)}
                          className="rounded-full border border-slate-900 bg-slate-900 px-4.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-850"
                        >
                          Sửa đánh giá
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : eligibleOrderId ? (
                  <div className="border border-slate-100/80 rounded-2xl p-5 bg-slate-50/20">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-4">Viết đánh giá mới</h3>
                    <ReviewForm
                      onSubmit={handleSubmitReview}
                      token={token}
                      loading={reviewSubmitLoading}
                      error={reviewSubmitError}
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/30 px-5 py-4 text-xs font-bold text-slate-400">
                    Bạn cần mua và hoàn thành đơn hàng mới được đánh giá sản phẩm này.
                  </div>
                )}
              </div>

              <div className="mt-6">
                {reviewSuccessMessage ? (
                  <p className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 py-3 text-center text-xs font-bold text-emerald-700">
                    {reviewSuccessMessage}
                  </p>
                ) : null}

                <ReviewList
                  reviews={reviews}
                  loading={reviewsLoading}
                  error={reviewsError}
                  currentUserId={currentUserId}
                  onEditReview={handleStartEditReview}
                />
              </div>
            </article>

            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {isUsedProduct ? "Lưu ý trước khi mua hàng" : "Quyền lợi khi mua máy mới"}
              </h2>
              <div className="mt-4 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/30 p-5">
                {purchaseNotes.map((note) => (
                  <p
                    key={note}
                    className="text-xs font-semibold leading-relaxed text-slate-500"
                  >
                    • {note}
                  </p>
                ))}
              </div>
            </article>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${conditionClassName}`}
                  >
                    {conditionLabel}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {product.brand || "Mạnh Hương Mobile"}
                  </span>
                </div>

                <h1 className="mt-3 text-xl font-bold leading-snug text-slate-900">
                  {product.name}
                </h1>

                <div className="mt-2.5 flex items-center gap-1.5 text-xs">
                  <span className="font-extrabold text-slate-800">
                    {reviews.length > 0 ? averageRating.toFixed(1) : "5.0"}
                  </span>
                  <span className="text-amber-400">★★★★★</span>
                  <span className="text-slate-400 font-bold">({reviews.length} đánh giá)</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {product.price?.toLocaleString("vi-VN")} đ
                  </span>
                  {originalPrice ? (
                    <span className="text-xs text-slate-400 line-through">
                      {originalPrice.toLocaleString("vi-VN")} đ
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold">
                  <span className={`h-2 w-2 rounded-full ${product.stock > 0 ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                  <span className={product.stock > 0 ? "text-emerald-600" : "text-rose-500"}>
                    {product.stock > 0 ? `Còn hàng - ${product.stock} sản phẩm có sẵn` : "Tạm hết hàng"}
                  </span>
                </div>
              </div>

              {product.stock > 0 && (
                <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số lượng:</span>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4.5 py-1.5 text-xs font-bold text-slate-700 outline-none transition hover:border-slate-400 focus:bg-white cursor-pointer"
                  >
                    {Array.from({ length: Math.min(10, product.stock) }, (_, i) => i + 1).map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="w-full rounded-full bg-blue-600 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-blue-750 transition duration-300 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  Mua ngay
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="w-full rounded-full border border-slate-200 bg-white py-3 text-xs font-bold uppercase tracking-wider text-slate-800 transition duration-300 hover:border-slate-800 hover:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  Thêm vào giỏ hàng
                </button>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <Link
                    to="/trade-in"
                    className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-bold text-slate-700 hover:border-slate-800 transition"
                  >
                    Thu cũ đổi mới
                  </Link>

                  <a
                    href="https://zalo.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-bold text-slate-700 hover:border-slate-800 transition"
                  >
                    Chat tư vấn Zalo
                  </a>
                </div>
              </div>

              {/* Machine detail rows (Thông tin máy đang có) */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {isUsedProduct ? "Thông tin máy đang có" : "Thông tin nhanh của sản phẩm"}
                </h3>
                <div className="grid gap-2">
                  {machineDetailRows.map((row) => (
                    <DetailRow key={row.label} label={row.label} value={row.value} />
                  ))}
                </div>
              </div>

              {message ? (
                <p className="animate-fade-in rounded-xl border border-emerald-100 bg-emerald-50 py-2.5 text-center text-xs font-bold text-emerald-700">
                  ✓ {message}
                </p>
              ) : null}

              <div className="border-t border-slate-100 pt-5 space-y-3">
                <div className="flex items-start gap-3 text-xs text-slate-650 leading-relaxed">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-slate-500 mt-0.5 shrink-0">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  <span>Miễn phí vận chuyển toàn quốc cho tất cả đơn hàng trên 500.000 đ</span>
                </div>

                <div className="flex items-start gap-3 text-xs text-slate-650 leading-relaxed">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-slate-500 mt-0.5 shrink-0">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  <span>Đổi trả an tâm, hoàn tiền 100% trong 30 ngày nếu lỗi</span>
                </div>

                <div className="flex items-start gap-3 text-xs text-slate-650 leading-relaxed">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-slate-500 mt-0.5 shrink-0">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Bảo mật thanh toán thông tin giao dịch tuyệt đối</span>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
                  <SpecsIcon />
                </span>
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">
                    {isUsedProduct ? "Cấu hình tham khảo" : "Thông số kỹ thuật"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-450">
                    {isUsedProduct
                      ? "Thông tin cấu hình để đối chiếu nhanh khi chọn máy"
                      : "Thông số cốt lõi của sản phẩm mới"}
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-100/80">
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

        {/* Explore your Interests (Similar Products) */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-slate-100 pt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Khám phá sản phẩm tương tự (Explore your Interests)</h2>
              <Link to={categoryLink} className="text-xs font-bold text-slate-500 hover:text-slate-900 transition">
                Xem tất cả &gt;
              </Link>
            </div>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  isWishlisted={wishlistIds.has(String(p._id))}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>
          </div>
        )}

        {/* Explore Category Cards */}
        <div className="border-t border-slate-100 pt-8 space-y-6">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Khám phá thêm (Explore more)</h2>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Link to="/phones" className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/30 p-4 transition hover:border-slate-300">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800">Điện thoại</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Phones & Devices</span>
              </div>
              <span className="text-slate-400 font-bold">→</span>
            </Link>
            <Link to="/tablets" className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/30 p-4 transition hover:border-slate-300">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800">Máy tính bảng</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Tablets & iPads</span>
              </div>
              <span className="text-slate-400 font-bold">→</span>
            </Link>
            <Link to="/accessories" className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/30 p-4 transition hover:border-slate-300">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800">Phụ kiện công nghệ</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Accessories & Gear</span>
              </div>
              <span className="text-slate-400 font-bold">→</span>
            </Link>
            <Link to="/trade-in" className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/30 p-4 transition hover:border-slate-300">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800">Thu cũ đổi mới</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Trade-in Program</span>
              </div>
              <span className="text-slate-400 font-bold">→</span>
            </Link>
          </div>
        </div>

        {/* Partner brand logos */}
        <div className="border-t border-slate-100 pt-8 pb-12 space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Thương hiệu đối tác (Shop by brands)</h2>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 opacity-40 hover:opacity-60 transition duration-300">
            <span className="text-sm font-black text-slate-800 tracking-tighter">APPLE</span>
            <span className="text-sm font-black text-slate-800 tracking-tighter">SAMSUNG</span>
            <span className="text-sm font-black text-slate-800 tracking-tighter">XIAOMI</span>
            <span className="text-sm font-black text-slate-800 tracking-tighter">LENOVO</span>
            <span className="text-sm font-black text-slate-800 tracking-tighter">ANKER</span>
            <span className="text-sm font-black text-slate-805 tracking-tighter font-serif">JBL</span>
          </div>
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
