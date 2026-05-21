import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "wt_token";
const USER_KEY  = "wt_user";
const MODE_KEY  = "wt_mode";

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem(MODE_KEY) === "guest");

  // Always re-fetch the user profile on startup so is_staff/is_superuser stay current.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!res.ok) throw new Error("invalid"); return res.json(); })
      .then(userData => {
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setUser(userData);
      })
      .catch(() => {
        // Token is invalid/expired — clear everything so the user sees the login page
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      });
  }, []); // run once on mount

  const isAuthenticated = !!user || isGuest;
  const isAdmin      = !!(user?.is_staff || user?.is_superuser);
  const isSuperAdmin = !!user?.is_superuser;

  const login = useCallback((token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.removeItem(MODE_KEY);
    setUser(userData);
    setIsGuest(false);
  }, []);

  const continueAsGuest = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.setItem(MODE_KEY, "guest");
    setUser(null);
    setIsGuest(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(MODE_KEY);
    setUser(null);
    setIsGuest(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isGuest, isAuthenticated, isAdmin, isSuperAdmin, login, continueAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
