import { createContext, useEffect, useContext, useState, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
// import { AuthState, useAuth } from "../lib/auth";

// Define AuthState type
type AuthState = {
  session: Session | null;
  user: any | null;
  isLoading: boolean;
};

type AuthContextType = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | null>(null);

// Create the Auth Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add sign in method
  const signIn = async (email: string, password: string) => {
    // Implementation will be added later
    throw new Error("Not implemented");
  };

  // Add sign out method
  const signOut = async () => {
    // Implementation will be added later
    throw new Error("Not implemented");
  };

  // Return the Provider component
  return (
    <AuthContext.Provider 
      value={{
        session,
        user,
        isLoading,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
