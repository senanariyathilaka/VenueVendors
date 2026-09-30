import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { adminLogin as adminLoginRequest } from "@/services/adminApi";

type AdminUser = {
  username: string;
};

type AdminAuthContextType = {
  adminUser: AdminUser | null;
  adminToken: string;
  isReady: boolean;
  loginError: string;
  loginAdmin: (username: string, password: string) => Promise<boolean>;
  logoutAdmin: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

const ADMIN_TOKEN_KEY = "vv_admin_token";
const ADMIN_USER_KEY = "vv_admin_user";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminToken, setAdminToken] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    const savedUser = localStorage.getItem(ADMIN_USER_KEY);

    if (savedToken && savedUser) {
      setAdminToken(savedToken);
      setAdminUser(JSON.parse(savedUser));
    }

    setIsReady(true);
  }, []);

  const loginAdmin = async (username: string, password: string) => {
    setLoginError("");

    try {
      const result = await adminLoginRequest(username, password);

      if (!result.success || !result.token) {
        setLoginError(result.message || "Admin login failed.");
        return false;
      }

      const user = { username };

      localStorage.setItem(ADMIN_TOKEN_KEY, result.token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));

      setAdminToken(result.token);
      setAdminUser(user);
      return true;
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "Admin login failed."
      );
      return false;
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setAdminToken("");
    setAdminUser(null);
    setLoginError("");
  };

  const value = useMemo(
    () => ({
      adminUser,
      adminToken,
      isReady,
      loginError,
      loginAdmin,
      logoutAdmin,
    }),
    [adminUser, adminToken, isReady, loginError]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider.");
  }

  return context;
}