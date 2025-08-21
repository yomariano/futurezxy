import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only bypass authentication for localhost development (not production)
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "localhost" &&
      process.env.NODE_ENV === "development"
    ) {
      // Create a mock user for localhost development only
      const mockUser = {
        id: "localhost-user",
        app_metadata: {
          provider: "localhost",
          providers: ["localhost"],
        },
        user_metadata: {
          full_name: "Local Developer",
          avatar_url: "",
        },
        aud: "authenticated",
        email: "developer@localhost",
        created_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        role: "authenticated",
        updated_at: new Date().toISOString(),
      } as unknown as User;

      setUser(mockUser);
      setLoading(false);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
