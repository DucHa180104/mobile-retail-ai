import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("http://localhost:5000/api/products");

        if (!response.ok) {
          throw new Error("Khong the tai danh sach san pham");
        }

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <p className="text-center text-gray-600">Dang tai san pham...</p>
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

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Danh sach san pham
        </h1>

        {products.length === 0 ? (
          <p className="text-gray-600">Chua co san pham nao.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product._id}
                to={`/products/${product._id}`}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <img
                  src={product.images?.[0] || "https://via.placeholder.com/400x300?text=No+Image"}
                  alt={product.name}
                  className="h-56 w-full object-cover"
                />

                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {product.name}
                  </h2>
                  <p className="mt-2 text-blue-600">
                    {product.price?.toLocaleString("vi-VN")} VND
                  </p>
                  <span className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">
                    Xem chi tiet
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default ProductListPage;
