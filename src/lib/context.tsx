import { createContext, useEffect, useContext, Children } from "react";
// import { AuthState, useAuth } from "../lib/auth";

type AuthContextType = AuthState & {
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
  };
  const AuthContext = createContext<AuthContextType | null>(null);
  
  export const AuthContext=({Children}) = createContext<AuthContextType>({
    const [session, setSession] = useState<undefined>(undefined);
    return(
        <AuthContext.Provider value={{session, setSession}}>
        {Children}
        </AuthContext.Provider>
    )
  });
  
