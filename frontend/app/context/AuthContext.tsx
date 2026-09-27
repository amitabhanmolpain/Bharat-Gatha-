"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  // Handle hash tokens for OAuth redirect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#token=")) {
        const token = hash.split("=")[1];
        if (token) {
          localStorage.setItem("bharat_gatha_token", token);
          window.location.hash = "";
          checkAuth(); // re-check after setting token
        }
      }
    }
  }, [pathname]);

  const checkAuth = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("bharat_gatha_token");
    
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem("bharat_gatha_user", JSON.stringify(data.user));
      } else if (res.status === 401) {
        // Try refresh
        const refreshRes = await fetch('http://localhost:5001/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}` // Actually refresh uses cookies usually, but we send it just in case
          },
          credentials: 'include' // Important for HttpOnly cookies
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          localStorage.setItem("bharat_gatha_token", refreshData.access_token);
          // Recursively call checkAuth or just set state
          const newMeRes = await fetch('http://localhost:5001/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${refreshData.access_token}`
            },
          });
          if (newMeRes.ok) {
            const data = await newMeRes.json();
            setUser(data.user);
            setIsAuthenticated(true);
            localStorage.setItem("bharat_gatha_user", JSON.stringify(data.user));
          } else {
            handleLogoutState();
          }
        } else {
          handleLogoutState();
        }
      } else {
        handleLogoutState();
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      // In case of network errors (like DB down but API up), we don't necessarily logout, just maintain current state
      const savedUser = localStorage.getItem("bharat_gatha_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutState = () => {
    localStorage.removeItem("bharat_gatha_token");
    localStorage.removeItem("bharat_gatha_user");
    setUser(null);
    setIsAuthenticated(false);
  };

  const login = (token: string, userData: User) => {
    localStorage.setItem("bharat_gatha_token", token);
    localStorage.setItem("bharat_gatha_user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:5001/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // clear cookies
      });
    } catch (e) {
      console.error("Logout request failed", e);
    }
    handleLogoutState();
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
