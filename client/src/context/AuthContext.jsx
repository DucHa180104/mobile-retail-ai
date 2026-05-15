import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = "mobile-retail-auth";

function getStoredAuth() {
  try {
    const storedValue = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!storedValue) {
      return {
        user: null,
        token: ""
      };
    }

    const parsedValue = JSON.parse(storedValue);

    return {
      user: parsedValue.user || null,
      token: parsedValue.token || ""
    };
  } catch {
    return {
      user: null,
      token: ""
    };
  }
}

export function AuthProvider({ children }) {
  const [{ user, token }, setAuthState] = useState(getStoredAuth);

  function login(authUser, authToken) {
    const nextState = {
      user: authUser,
      token: authToken
    };

    setAuthState(nextState);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextState));
  }

  function logout() {
    setAuthState({
      user: null,
      token: ""
    });
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      login,
      logout
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
