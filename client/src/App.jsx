import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminProtectedRoute from "./components/AdminProtectedRoute.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminChatbotLogsPage from "./pages/AdminChatbotLogsPage.jsx";
import AdminOrdersPage from "./pages/AdminOrdersPage.jsx";
import AdminProductsPage from "./pages/AdminProductsPage.jsx";
import AdminSettingsPage from "./pages/AdminSettingsPage.jsx";
import AdminSupportChatPage from "./pages/AdminSupportChatPage.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MyOrdersPage from "./pages/MyOrdersPage.jsx";
import OrderDetailPage from "./pages/OrderDetailPage.jsx";
import OrderSuccessPage from "./pages/OrderSuccessPage.jsx";
import AccessoriesPage from "./pages/AccessoriesPage.jsx";
import PhonesPage from "./pages/PhonesPage.jsx";
import TabletsPage from "./pages/TabletsPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import ProductListPage from "./pages/ProductListPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import TradeInPage from "./pages/TradeInPage.jsx";
import WishlistPage from "./pages/WishlistPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
// CHATBOT: thêm import page chatbot ở đây
import ChatbotPage from "./pages/ChatbotPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<ProductListPage />} />
          <Route path="/phones" element={<PhonesPage />} />
          <Route path="/tablets" element={<TabletsPage />} />
          <Route path="/accessories" element={<AccessoriesPage />} />
          <Route path="/products" element={<PhonesPage />} />
          <Route path="/trade-in" element={<TradeInPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/my-orders/:id" element={<OrderDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          {/* CHATBOT: thêm route React ở đây */}
          <Route path="/chatbot" element={<ChatbotPage />} />
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
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="chatbot-logs" element={<AdminChatbotLogsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="support-chat" element={<AdminSupportChatPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
