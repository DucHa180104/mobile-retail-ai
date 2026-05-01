import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import OrderSuccessPage from "./pages/OrderSuccessPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import ProductListPage from "./pages/ProductListPage.jsx";

function App() {
  return (
    <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<ProductListPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
          </Route>
        </Routes>
    </BrowserRouter>
  );
}

export default App;
