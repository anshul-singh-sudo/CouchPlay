"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  isPro: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isGuest: true,
  isPro: false,
});

// Stable QueryClient instance — created once outside render to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Derive metadata from user object
  const isGuest = !user?.email;
  const isPro = user?.user_metadata?.subscription_tier === "pro";

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
      } else {
        // Automatically sign in as anonymous guest — no barrier to playing
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, loading, isGuest, isPro }}>
        {loading ? (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-t-rose-600 border-rose-600/20 animate-spin" />
            <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Starting Session</p>
          </div>
        ) : (
          children
        )}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export const useAuth = () => useContext(AuthContext);
