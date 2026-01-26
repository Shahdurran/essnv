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

export interface User {
  username: string;
  role: 'admin' | 'user';
  practiceName: string;
  practiceSubtitle: string | null;
  logoUrl: string | null;
  ownerName: string | null;
  ownerTitle: string | null;
  ownerPhotoUrl: string | null;
  revenueTitle: string;
  expensesTitle: string;
  cashInTitle: string;
  cashOutTitle: string;
  topRevenueTitle: string;
  revenueSubheadings: Record<string, string>;
  expensesSubheadings: Record<string, string>;
  cashInSubheadings: Record<string, string>;
  cashOutSubheadings: Record<string, string>;
  cashFlowSubheadings: Record<string, string>;
  procedureNameOverrides: Record<string, string>;
  locationNameOverrides: Record<string, string>;
  showCollectionsWidget: boolean;
  userLocations?: string[]; // Array of location IDs that this user has access to
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
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
    const checkAuthStatus = async () => {
      try {
        const authStatus = localStorage.getItem("isAuthenticated");
        
        if (authStatus === "true") {
          // Fetch current user from API
          const response = await fetch('/api/auth/me', {
            credentials: 'include'
          });
          
          if (response.ok) {
            const userData = await response.json();
            setIsAuthenticated(true);
            setUser(userData);
          } else {
            // Clear invalid auth
            localStorage.removeItem("isAuthenticated");
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        localStorage.removeItem("isAuthenticated");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (userData: User) => {
    try {
      localStorage.setItem("isAuthenticated", "true");
      setIsAuthenticated(true);
      setUser(userData);
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      localStorage.removeItem("isAuthenticated");
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    isLoading,
    isAdmin: user?.role === 'admin'
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
    // During development with HMR, context might be temporarily undefined
    // Return a safe default instead of throwing
    if (import.meta.env.DEV) {
      console.warn("useAuth called outside AuthProvider, returning default values");
      return {
        isAuthenticated: false,
        user: null,
        login: () => {},
        logout: async () => {},
        isLoading: true,
        isAdmin: false
      };
    }
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}