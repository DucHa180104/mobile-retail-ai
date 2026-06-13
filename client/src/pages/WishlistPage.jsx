import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { buildApiUrl } from "../lib/api.js";

function WishlistPage() {
  const { token, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchWishlist() {
      if (!isAuthenticated || !token) {
        setWishlist([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(buildApiUrl("/api/wishlist"), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Không thể tải danh sách yêu thích");
        }

        setWishlist(data.wishlist || []);
      } catch (fetchError) {
        setError(fetchError.message || "Không thể tải danh sách yêu thích");
      } finally {
        setLoading(false);
      }
    }

    fetchWishlist();
  }, [isAuthenticated, token]);

  const wishlistIds = useMemo(
    () => new Set(wishlist.map((product) => product._id)),
    [wishlist]
  );

  async function handleToggleWishlist(product) {
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

  if (!isAuthenticated) {
    return (
      <main className="px-4 py-5 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1120px] rounded-[1.6rem] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">Danh sách yêu thích</h1>
          <p className="mt-3 text-slate-600">Vui lòng đăng nhập để xem sản phẩm bạn đã yêu thích.</p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Đi đến đăng nhập
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="px-4 py-5 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1120px] rounded-[1.6rem] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-slate-600">Đang tải danh sách yêu thích...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-5 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1120px] rounded-[1.6rem] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-5 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1120px] space-y-5">
        <section className="rounded-[1.6rem] border border-slate-200 bg-white px-6 py-6 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">Danh sách yêu thích</h1>
          <p className="mt-2 text-sm text-slate-500">
            Bạn đang lưu {wishlist.length} sản phẩm để xem lại sau.
          </p>
        </section>

        {wishlist.length === 0 ? (
          <section className="rounded-[1.6rem] border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-slate-500 shadow-sm">
            Bạn chưa có sản phẩm yêu thích nào.
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {wishlist.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={addToCart}
                isWishlisted={wishlistIds.has(product._id)}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

export default WishlistPage;
