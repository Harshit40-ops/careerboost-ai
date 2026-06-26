// auth.jsx
// --------
// A lightweight authentication context. It remembers the logged-in user and
// exposes login / register / logout to the whole app via the useAuth() hook.

import { createContext, useContext, useEffect, useState } from "react";
import { api, tokenStore } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // We persist the user object in localStorage so a page refresh keeps state.
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("cb_user");
    return raw ? JSON.parse(raw) : null;
  });

  // Keep localStorage in sync whenever `user` changes.
  useEffect(() => {
    if (user) localStorage.setItem("cb_user", JSON.stringify(user));
    else localStorage.removeItem("cb_user");
  }, [user]);

  function handleAuthResult(data) {
    tokenStore.set(data.access_token);
    setUser(data.user);
    return data.user;
  }

  const login = async (email, password) =>
    handleAuthResult(await api.login({ email, password }));

  const register = async (name, email, password) =>
    handleAuthResult(await api.register({ name, email, password }));

  const logout = () => {
    tokenStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Handy hook used by pages/components.
export const useAuth = () => useContext(AuthContext);
