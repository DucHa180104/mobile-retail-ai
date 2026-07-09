import { useEffect, useState } from "react";
import { buildApiUrl, resolveMediaUrl } from "../lib/api.js";

function ReviewForm({
  onSubmit,
  token = "",
  loading = false,
  error = "",
  initialValues = null,
  isEditing = false,
  onCancel
}) {
  const [rating, setRating] = useState(initialValues?.rating || 5);
  const [comment, setComment] = useState(initialValues?.comment || "");
  const [images, setImages] = useState(initialValues?.images || []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    setRating(initialValues?.rating || 5);
    setComment(initialValues?.comment || "");
    setImages(Array.isArray(initialValues?.images) ? initialValues.images : []);
    setUploadError("");
  }, [initialValues]);

  async function handleSubmit(event) {
    event.preventDefault();

    const isSuccess = await onSubmit({
      rating,
      comment,
      images
    });

    if (isSuccess && !isEditing) {
      setRating(5);
      setComment("");
      setImages([]);
      setUploadError("");
    }
  }

  async function handleImageChange(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    if (!token) {
      setUploadError("Bạn cần đăng nhập lại để tải ảnh đánh giá.");
      event.target.value = "";
      return;
    }

    if (images.length + files.length > 3) {
      setUploadError("Mỗi đánh giá chỉ được tối đa 3 ảnh.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      const uploadedImageUrls = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(buildApiUrl("/api/uploads/review"), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Không thể tải ảnh đánh giá");
        }

        if (data.imageUrl) {
          uploadedImageUrls.push(data.imageUrl);
        }
      }

      setImages((current) => [...current, ...uploadedImageUrls].slice(0, 3));
    } catch (uploadFailure) {
      setUploadError(uploadFailure.message || "Không thể tải ảnh đánh giá");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function handleRemoveImage(imageIndex) {
    setImages((current) => current.filter((_, index) => index !== imageIndex));
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-600">Đánh giá của bạn:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const isActive = star <= rating;

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl transition ${
                    isActive ? "text-amber-400" : "text-slate-300 hover:text-amber-300"
                  }`}
                  aria-label={`Chọn ${star} sao`}
                >
                  ★
                </button>
              );
            })}
          </div>
        </div>

        {isEditing && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
          >
            Hủy sửa
          </button>
        ) : null}
      </div>

      <div className="mt-4">
        <label htmlFor="review-comment" className="text-sm font-semibold text-slate-700">
          Nhận xét
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          placeholder="Chia sẻ trải nghiệm sử dụng, tình trạng máy, pin, ngoại hình..."
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
        />
      </div>

      <div className="mt-4">
        <label className="text-sm font-semibold text-slate-700">Ảnh thực tế</label>
        <input
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={handleImageChange}
          disabled={uploading || images.length >= 3}
          className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-semibold file:text-white"
        />
        <p className="mt-2 text-xs text-slate-500">
          Tối đa 3 ảnh. Trên điện thoại bạn có thể chụp trực tiếp hoặc chọn từ thư viện.
        </p>

        {uploading ? (
          <p className="mt-2 text-sm font-medium text-blue-600">Đang tải ảnh lên...</p>
        ) : null}

        {uploadError ? <p className="mt-2 text-sm font-medium text-red-600">{uploadError}</p> : null}

        {images.length ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {images.map((imageUrl, index) => (
              <div
                key={`${imageUrl}-${index}`}
                className="rounded-2xl border border-slate-200 bg-white p-3"
              >
                <img
                  src={resolveMediaUrl(imageUrl)}
                  alt={`Ảnh đánh giá ${index + 1}`}
                  className="h-24 w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="mt-3 w-full rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Xóa ảnh
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading || uploading}
        className="mt-4 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {loading ? "Đang lưu đánh giá..." : isEditing ? "Lưu đánh giá" : "Gửi đánh giá"}
      </button>
    </form>
  );
}

export default ReviewForm;
