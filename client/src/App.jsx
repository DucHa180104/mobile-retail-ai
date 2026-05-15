import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminOrdersPage from "./pages/AdminOrdersPage.jsx";
import AdminProductsPage from "./pages/AdminProductsPage.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import OrderSuccessPage from "./pages/OrderSuccessPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import ProductListPage from "./pages/ProductListPage.jsx";
import PhonesPage from "./pages/PhonesPage.jsx";
import TradeInPage from "./pages/TradeInPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import AdminProtectedRoute from "./components/AdminProtectedRoute.jsx";
import MyOrdersPage from "./pages/MyOrdersPage.jsx";

function App() {
  return (
    <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<ProductListPage />} />
            <Route path="/phones" element={<PhonesPage />} />
            <Route path="/products" element={<PhonesPage />} />
            <Route path="/trade-in" element={<TradeInPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
          </Route>
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
          </Route>
        </Routes>
    </BrowserRouter>
  );
}

export default App;
