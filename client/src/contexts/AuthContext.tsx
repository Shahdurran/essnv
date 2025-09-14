/*
 * AUTHENTICATION CONTEXT
 * ======================
 * 
 * This context provides authentication state management throughout the application.
 * It handles login status, user information, and authentication-related actions.
 * 
 * FEATURES:
 * - Persistent authentication state using localStorage
 * - Automatic session restoration on app load
 * - Login and logout functionality
 * - Type-safe authentication context with TypeScript
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const authStatus = localStorage.getItem("isAuthenticated");
        const username = localStorage.getItem("username");
        
        if (authStatus === "true" && username) {
          setIsAuthenticated(true);
          setUser({ username });
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        // Clear potentially corrupted auth data
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("username");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (username: string) => {
    try {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("username", username);
      setIsAuthenticated(true);
      setUser({ username });
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("username");
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}