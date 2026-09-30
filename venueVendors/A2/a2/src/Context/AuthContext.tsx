import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchProfile,
  loginUser,
  signupUser,
  type AuthApiUser,
  type SignupPayload,
  type UserRole,
} from "@/services/authService";

export type { UserRole };

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  comments: string;
  rating: number;
  requirements: string;
  approvalCount: number;
  phone?: string;
  dateJoined?: string;
  venue?: string;

  // Kept temporarily so the current hirer page still compiles
  // before we replace its old localStorage-based logic.
  password?: string;
}

interface AuthActionResult {
  success: boolean;
  message: string;
  user?: AuthUser;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  users: AuthUser[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  signup: (payload: SignupPayload) => Promise<AuthActionResult>;
  logout: () => void;
  refreshProfile: (role: UserRole, id: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_STORAGE_KEY = "vv_current_user";


const compatibilityUsers: AuthUser[] = [
  {
    id: 1,
    name: "Mia Carter",
    email: "mia.hirer@venuevendors.com",
    role: "hirer",
    comments: "good applicant very reliable and trustworthy",
    rating: 5,
    requirements: "large capacity",
    approvalCount: 0,
    phone: "",
    password: "",
  },
  {
    id: 2,
    name: "Noah Singh",
    email: "noah.hirer@venuevendors.com",
    role: "hirer",
    comments: "Very reliable, honest and great communication",
    rating: 3,
    requirements: "large capacity",
    approvalCount: 5,
    phone: "",
    password: "",
  },
  {
    id: 3,
    name: "Bryan Hoover",
    email: "bryan.hirer@venuevendors.com",
    role: "hirer",
    comments: "somewhat reliable good applicant",
    rating: 4,
    requirements: "large capacity",
    approvalCount: 7,
    phone: "",
    password: "",
  },
  {
    id: 4,
    name: "John Nguyen",
    email: "john.hirer@venuevendors.com",
    role: "hirer",
    comments: "unreliable and left the place messy",
    rating: 3,
    requirements: "space for lots of tables and ",
    approvalCount: 8,
    phone: "",
    password: "",
  },
  {
    id: 5,
    name: "Luca Bennett",
    email: "luca.vendor@venuevendors.com",
    role: "vendor",
    comments: "",
    rating: 1,
    requirements: "",
    approvalCount: 9,
    venue: "",
    password: "",
  },
  {
    id: 6,
    name: "Chloe Adams",
    email: "chloe.vendor@venuevendors.com",
    role: "vendor",
    comments: "",
    rating: 5,
    requirements: "",
    approvalCount: 0,
    venue: "",
    password: "",
  },
  {
    id: 7,
    name: "Ethan Ali",
    email: "ethan.vendor@venuevendors.com",
    role: "vendor",
    comments: "",
    rating: 4,
    requirements: "",
    approvalCount: 0,
    venue: "",
    password: "",
  },
];

function normaliseUser(user: AuthApiUser): AuthUser {
  return {
    ...user,
    phone: user.phone ?? "",
    comments: user.comments ?? "",
    rating: user.rating ?? 0,
    requirements: user.requirements ?? "",
    approvalCount: user.approvalCount ?? 0,
    password: "",
  };
}

function mergeCompatibilityUsers(
  existingUsers: AuthUser[],
  incomingUser: AuthUser
) {
  const existingIndex = existingUsers.findIndex(
    (user) => user.email.toLowerCase() === incomingUser.email.toLowerCase()
  );

  if (existingIndex === -1) {
    return [incomingUser, ...existingUsers];
  }

  const updatedUsers = [...existingUsers];
  updatedUsers[existingIndex] = {
    ...updatedUsers[existingIndex],
    ...incomingUser,
  };

  return updatedUsers;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<AuthUser[]>(compatibilityUsers);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedCurrentUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);

    if (storedCurrentUser) {
      try {
        const parsedUser = JSON.parse(storedCurrentUser) as AuthUser;
        setCurrentUser(parsedUser);
        setUsers((prev) => mergeCompatibilityUsers(prev, parsedUser));
      } catch {
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  const refreshProfile = async (role: UserRole, id: number) => {
    const refreshedUser = normaliseUser(await fetchProfile(role, id));

    setCurrentUser(refreshedUser);
    setUsers((prev) => mergeCompatibilityUsers(prev, refreshedUser));

    if (typeof window !== "undefined") {
      localStorage.setItem(
        CURRENT_USER_STORAGE_KEY,
        JSON.stringify(refreshedUser)
      );
    }
  };

  const signup = async (payload: SignupPayload): Promise<AuthActionResult> => {
    try {
      const response = await signupUser(payload);
      const signedUpUser = normaliseUser(response.user);

      setCurrentUser(signedUpUser);
      setUsers((prev) => mergeCompatibilityUsers(prev, signedUpUser));

      if (typeof window !== "undefined") {
        localStorage.setItem(
          CURRENT_USER_STORAGE_KEY,
          JSON.stringify(signedUpUser)
        );
      }

      return {
        success: true,
        message: response.message,
        user: signedUpUser,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unable to create account.",
      };
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<AuthActionResult> => {
    try {
      const response = await loginUser(email, password);
      const signedInUser = normaliseUser(response.user);

      setCurrentUser(signedInUser);
      setUsers((prev) => mergeCompatibilityUsers(prev, signedInUser));

      if (typeof window !== "undefined") {
        localStorage.setItem(
          CURRENT_USER_STORAGE_KEY,
          JSON.stringify(signedInUser)
        );
      }

      return {
        success: true,
        message: response.message,
        user: signedInUser,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to complete sign-in.",
      };
    }
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }

    setCurrentUser(null);
  };

  const contextValue = useMemo(
    () => ({
      currentUser,
      users,
      isLoading,
      login,
      signup,
      logout,
      refreshProfile,
    }),
    [currentUser, users, isLoading]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
