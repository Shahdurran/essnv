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
  profitLossTitle: string;
  cashInTitle: string;
  cashOutTitle: string;
  topRevenueTitle: string;
  revenueSubheadings: Record<string, string>;
  expensesSubheadings: Record<string, string>;
  cashInSubheadings: Record<string, string>;
  cashOutSubheadings: Record<string, string>;
  cashFlowSubheadings: Record<string, string>;
  arSubheadings?: Record<string, string>;
  procedureNameOverrides: Record<string, string>;
  locationNameOverrides: Record<string, string>;
  showCollectionsWidget: boolean;
  providers?: Array<{ name: string; percentage: number }>;
  userLocations?: string[]; // Array of location IDs that this user has access to
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User, token?: string) => void;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
  updateUser: (userData: User) => void; // New function to update user state immediately
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
          // Fetch current user from API with token
          const token = localStorage.getItem("authToken");
          const headers: Record<string, string> = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
            headers
          });
          
          if (response.ok) {
            const userData = await response.json();
            setIsAuthenticated(true);
            setUser(userData);
          } else {
            // Clear invalid auth
            localStorage.removeItem("isAuthenticated");
            localStorage.removeItem("authToken");
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

  const login = (userData: User, token?: string) => {
    try {
      localStorage.setItem("isAuthenticated", "true");
      if (token) {
        localStorage.setItem("authToken", token);
      }
      setIsAuthenticated(true);
      setUser(userData);
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("authToken");
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Refresh user data from the server (useful after saving settings)
  // CRITICAL: This ensures AuthContext has fresh data after Save operations
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log("[AuthContext] Refreshing user data from server...");
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        console.log("[AuthContext] User data refreshed successfully:", userData.username);
      } else {
        console.error("[AuthContext] Failed to refresh user data:", response.status);
      }
    } catch (error) {
      console.error("[AuthContext] Error refreshing user data:", error);
    }
  };

  // Update user state immediately (useful after saving settings)
  const updateUser = (userData: User) => {
    setUser(userData);
    console.log("[AuthContext] User state updated immediately");
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    isLoading,
    isAdmin: user?.role === 'admin',
    refreshUser,
    updateUser
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
        isAdmin: false,
        refreshUser: async () => {},
        updateUser: () => {}
      };
    }
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}