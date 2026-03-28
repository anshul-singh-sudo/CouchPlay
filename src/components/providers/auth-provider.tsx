"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
      } else {
        // Automatically sign in as an anonymous guest
        const { data, error } = await supabase.auth.signInAnonymously();
        if (!error && data?.user) {
          setUser(data.user);
        }
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(true);
        supabase.auth.signInAnonymously().then(({ data }) => {
          if (data?.user) setUser(data.user);
          setLoading(false);
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading ? children : <div className="absolute inset-0 bg-background flex items-center justify-center">Loading Session...</div>}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
