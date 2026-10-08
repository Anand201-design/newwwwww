import React, { createContext, useContext, useState, useEffect } from "react";
import { safeLocalStorage } from "../utils/safeStorage";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  joinedDate?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, name?: string) => Promise<boolean>;
  signup: (name: string, email: string) => Promise<boolean>;
  logout: () => void;
  continueAsGuest: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isAuthModalOpen: boolean;
  authModalMode: "login" | "signup";
  openAuthModal: (mode?: "login" | "signup") => void;
  closeAuthModal: () => void;
}

const DEFAULT_USER: UserProfile = {
  id: "user_default_01",
  name: "Emily Morgan",
  email: "emily.morgan@plantcare.ai",
  role: "Botanical Care Specialist",
  joinedDate: "October 2024",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = safeLocalStorage.getItem("plantcare_user_session");
      if (stored) {
        return JSON.parse(stored);
      }
      // Migrate from old simple keys if present
      const storedName = safeLocalStorage.getItem("plantcare_user_name");
      const storedEmail = safeLocalStorage.getItem("plantcare_user_email");
      if (storedName || storedEmail) {
        return {
          ...DEFAULT_USER,
          name: storedName || DEFAULT_USER.name,
          email: storedEmail || DEFAULT_USER.email,
        };
      }
      return DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try {
      return safeLocalStorage.getItem("plantcare_is_guest") === "true";
    } catch {
      return true;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    try {
      if (user) {
        safeLocalStorage.setItem("plantcare_user_session", JSON.stringify(user));
        safeLocalStorage.setItem("plantcare_user_name", user.name);
        safeLocalStorage.setItem("plantcare_user_email", user.email);
      } else {
        safeLocalStorage.removeItem("plantcare_user_session");
      }
    } catch {
      // ignore
    }
  }, [user]);

  const login = async (email: string, name?: string): Promise<boolean> => {
    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      name: name || email.split("@")[0] || "Plant Caretaker",
      email,
      role: "Plant Caretaker",
      joinedDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    };
    setUser(newUser);
    setIsGuest(false);
    try {
      safeLocalStorage.removeItem("plantcare_is_guest");
    } catch {
      // ignore
    }
    setIsAuthModalOpen(false);
    return true;
  };

  const signup = async (name: string, email: string): Promise<boolean> => {
    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      name: name.trim() || "Plant Enthusiast",
      email: email.trim(),
      role: "Plant Enthusiast",
      joinedDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    };
    setUser(newUser);
    setIsGuest(false);
    try {
      safeLocalStorage.removeItem("plantcare_is_guest");
    } catch {
      // ignore
    }
    setIsAuthModalOpen(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsGuest(true);
    try {
      safeLocalStorage.setItem("plantcare_is_guest", "true");
      safeLocalStorage.removeItem("plantcare_user_session");
    } catch {
      // ignore
    }
  };

  const continueAsGuest = () => {
    setUser(null);
    setIsGuest(true);
    try {
      safeLocalStorage.setItem("plantcare_is_guest", "true");
    } catch {
      // ignore
    }
    setIsAuthModalOpen(false);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
  };

  const openAuthModal = (mode: "login" | "signup" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isGuest,
        login,
        signup,
        logout,
        continueAsGuest,
        updateProfile,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
