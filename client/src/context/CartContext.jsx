import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { buildApiUrl } from "../lib/api.js";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "phone-store-cart";

function getGuestCart() {
  const savedCart = localStorage.getItem(CART_STORAGE_KEY);

  if (!savedCart) {
    return [];
  }

  try {
    return JSON.parse(savedCart);
  } catch {
    return [];
  }
}

function setGuestCart(cartItems) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
}

function clearGuestCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
}

export function CartProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState(getGuestCart);
  const [syncing, setSyncing] = useState(false);
  const handledTokenRef = useRef("");

  useEffect(() => {
    async function initializeCart() {
      if (!isAuthenticated || !token) {
        handledTokenRef.current = "";
        setCartItems(getGuestCart());
        return;
      }

      if (handledTokenRef.current === token) {
        return;
      }

      handledTokenRef.current = token;
      setSyncing(true);

      try {
        const guestCart = getGuestCart();

        if (guestCart.length > 0) {
          const syncedCart = await syncCartToServer(guestCart, token);
          setCartItems(syncedCart);
          clearGuestCart();
          return;
        }

        const serverCart = await fetchServerCart(token);
        setCartItems(serverCart);
      } catch {
        setCartItems([]);
      } finally {
        setSyncing(false);
      }
    }

    initializeCart();
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated) {
      setGuestCart(cartItems);
    }
  }, [cartItems, isAuthenticated]);

  async function addToCart(product) {
    if (!isAuthenticated || !token) {
      setCartItems((currentItems) => {
        const existingProduct = currentItems.find((item) => item._id === product._id);

        if (existingProduct) {
          return currentItems.map((item) =>
            item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }

        return [{ ...product, quantity: 1 }, ...currentItems];
      });
      return;
    }

    try {
      const nextCart = await requestCartUpdate("/api/cart", token, {
        method: "POST",
        body: {
          productId: product._id,
          quantity: 1
        }
      });

      setCartItems(nextCart);
    } catch (error) {
      console.error("Cart add error:", error.message);
    }
  }

  async function removeFromCart(productId) {
    if (!isAuthenticated || !token) {
      setCartItems((currentItems) => currentItems.filter((item) => item._id !== productId));
      return;
    }

    try {
      const nextCart = await requestCartUpdate(`/api/cart/${productId}`, token, {
        method: "DELETE"
      });

      setCartItems(nextCart);
    } catch (error) {
      console.error("Cart remove error:", error.message);
    }
  }

  async function increaseQuantity(productId) {
    if (!isAuthenticated || !token) {
      setCartItems((currentItems) =>
        currentItems.map((item) =>
          item._id === productId ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
      return;
    }

    const currentItem = cartItems.find((item) => item._id === productId);

    if (!currentItem) {
      return;
    }

    try {
      const nextCart = await requestCartUpdate(`/api/cart/${productId}`, token, {
        method: "PUT",
        body: {
          quantity: currentItem.quantity + 1
        }
      });

      setCartItems(nextCart);
    } catch (error) {
      console.error("Cart increase error:", error.message);
    }
  }

  async function decreaseQuantity(productId) {
    if (!isAuthenticated || !token) {
      setCartItems((currentItems) =>
        currentItems
          .map((item) =>
            item._id === productId ? { ...item, quantity: item.quantity - 1 } : item
          )
          .filter((item) => item.quantity > 0)
      );
      return;
    }

    const currentItem = cartItems.find((item) => item._id === productId);

    if (!currentItem) {
      return;
    }

    try {
      const nextCart = await requestCartUpdate(`/api/cart/${productId}`, token, {
        method: "PUT",
        body: {
          quantity: currentItem.quantity - 1
        }
      });

      setCartItems(nextCart);
    } catch (error) {
      console.error("Cart decrease error:", error.message);
    }
  }

  async function clearCart() {
    if (!isAuthenticated || !token) {
      setCartItems([]);
      clearGuestCart();
      return;
    }

    try {
      const nextCart = await requestCartUpdate("/api/cart", token, {
        method: "DELETE"
      });

      setCartItems(nextCart);
    } catch (error) {
      console.error("Cart clear error:", error.message);
    }
  }

  const totalItems = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  const value = {
    cartItems,
    totalItems,
    syncing,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

async function fetchServerCart(token) {
  const response = await fetch(buildApiUrl("/api/cart"), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Không thể tải giỏ hàng");
  }

  return data.cartItems || [];
}

async function syncCartToServer(cartItems, token) {
  return requestCartUpdate("/api/cart/sync", token, {
    method: "PUT",
    body: {
      cartItems
    }
  });
}

async function requestCartUpdate(path, token, options) {
  const response = await fetch(buildApiUrl(path), {
    method: options.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Không thể cập nhật giỏ hàng");
  }

  return data.cartItems || [];
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
