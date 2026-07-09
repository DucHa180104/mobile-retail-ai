import { resolveMediaUrl } from "../lib/api.js";

function ReviewList({
  reviews,
  loading = false,
  error = "",
  currentUserId = "",
  onEditReview = null
}) {
  if (loading) {
    return <p className="text-sm text-slate-500">Đang tải đánh giá...</p>;
  }

  if (error) {
    return <p className="text-sm font-medium text-red-600">{error}</p>;
  }

  if (!reviews.length) {
    return <p className="text-sm text-slate-500">Chưa có đánh giá nào</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const isOwner = currentUserId && String(review.user?._id) === String(currentUserId);

        return (
          <article
            key={review._id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{review.user?.name || "Người dùng"}</p>
                <p className="mt-1 text-sm text-slate-500">{formatReviewDate(review.createdAt)}</p>
              </div>

              <div className="flex items-center gap-3">
                {isOwner && onEditReview ? (
                  <button
                    type="button"
                    onClick={() => onEditReview(review)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                  >
                    Sửa đánh giá
                  </button>
                ) : null}

                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }, (_, index) => (
                    <span key={`${review._id}-${index}`}>
                      {index < Number(review.rating || 0) ? "★" : "☆"}
                    </span>
                  ))}
                  <span className="ml-2 text-sm font-semibold text-slate-700">
                    {review.rating}/5
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              {review.comment?.trim() || "Khách hàng không để lại bình luận."}
            </p>

            {review.images?.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {review.images.map((imageUrl, index) => (
                  <img
                    key={`${review._id}-image-${index}`}
                    src={resolveMediaUrl(imageUrl)}
                    alt={`Ảnh đánh giá ${index + 1}`}
                    className="h-36 w-full rounded-2xl border border-slate-200 object-cover"
                  />
                ))}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function formatReviewDate(value) {
  if (!value) {
    return "Đang cập nhật";
  }

  return new Date(value).toLocaleString("vi-VN");
}

export default ReviewList;
