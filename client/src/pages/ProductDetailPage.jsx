import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${id}`);

        if (!response.ok) {
          throw new Error("Khong the tai thong tin san pham");
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

  if (!product) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <p className="text-center text-gray-600">Khong tim thay san pham.</p>
      </main>
    );
  }

  const specs = product.specs || {};

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:grid-cols-2">
          <img
            src={product.images?.[0] || "https://via.placeholder.com/600x450?text=No+Image"}
            alt={product.name}
            className="h-80 w-full rounded-lg object-cover"
          />

          <section>
            <h1 className="text-3xl font-bold text-gray-900">
              {product.name}
            </h1>

            <p className="mt-4 text-2xl font-semibold text-blue-600">
              {product.price?.toLocaleString("vi-VN")} VND
            </p>

            <p className="mt-6 text-gray-700">
              {product.description || "Chua co mo ta."}
            </p>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900">
                Thong so ky thuat
              </h2>

              <div className="mt-4 grid gap-3">
                <SpecItem label="Man hinh" value={specs.screen} />
                <SpecItem label="Chip" value={specs.chip} />
                <SpecItem label="RAM" value={specs.ram} />
                <SpecItem label="Bo nho" value={specs.storage} />
                <SpecItem label="Pin" value={specs.battery} />
                <SpecItem label="Camera" value={specs.camera} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SpecItem({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
      <span className="font-medium text-gray-700">{label}</span>
      <span className="text-right text-gray-600">{value || "Dang cap nhat"}</span>
    </div>
  );
}

export default ProductDetailPage;
