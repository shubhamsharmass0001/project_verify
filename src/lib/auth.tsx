import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { THAPAR_COLLEGE_ID, isHeadAdmin as checkHeadAdmin } from "@/lib/constants";
import type { User, Session } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  college_id: string;
  roll_no: string | null;
  linkedin_url: string | null;
  score: number;
  total_submissions: number;
  correct_submissions: number;
  created_at: string;
};

type SignUpResult = { error: string | null; rateLimited?: boolean };

export type DemoRole = "student" | "admin";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isHeadAdmin: boolean;
  isDemo: boolean;
  demoRole: DemoRole | null;
  loading: boolean;
  profileLoading: boolean;
  loginAsDemo: (role?: DemoRole) => void;
  exitDemo: () => void;
  signUp: (email: string, password: string, fullName: string, collegeId: string, rollNo: string, linkedinUrl?: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = "verifyhub_demo_role";

const createDemoProfile = (role: DemoRole): Profile => {
  if (role === "admin") {
    return {
      id: "demo-admin-profile-id",
      user_id: "demo-admin-user-id",
      full_name: "Prof. Aman Goel (Demo Admin)",
      email: "agoel2_be23@thapar.edu",
      college_id: THAPAR_COLLEGE_ID,
      roll_no: "102103001",
      linkedin_url: "https://linkedin.com/in/amangoel-demo",
      score: 350,
      total_submissions: 25,
      correct_submissions: 25,
      created_at: "2024-01-10T10:00:00.000Z",
    };
  }

  return {
    id: "demo-student-profile-id",
    user_id: "demo-student-user-id",
    full_name: "Alex Sharma (Demo Student)",
    email: "student.demo@thapar.edu",
    college_id: THAPAR_COLLEGE_ID,
    roll_no: "102103999",
    linkedin_url: "https://linkedin.com/in/alex-sharma-demo",
    score: 120,
    total_submissions: 8,
    correct_submissions: 6,
    created_at: "2024-02-15T09:30:00.000Z",
  };
};

const createDemoUser = (role: DemoRole): User => ({
  id: role === "admin" ? "demo-admin-user-id" : "demo-student-user-id",
  app_metadata: { provider: "email" },
  user_metadata: {
    full_name: role === "admin" ? "Prof. Aman Goel (Demo Admin)" : "Alex Sharma (Demo Student)",
  },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: role === "admin" ? "agoel2_be23@thapar.edu" : "student.demo@thapar.edu",
  phone: "",
  role: "authenticated",
  updated_at: new Date().toISOString(),
});

const createDemoSession = (demoUser: User): Session => ({
  access_token: "demo-jwt-token-bypass",
  refresh_token: "demo-refresh-token",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  token_type: "bearer",
  user: demoUser,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [demoRole, setDemoRole] = useState<DemoRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const setDemoState = (role: DemoRole) => {
    const demoUser = createDemoUser(role);
    const demoSession = createDemoSession(demoUser);
    const demoProfile = createDemoProfile(role);
    setUser(demoUser);
    setSession(demoSession);
    setProfile(demoProfile);
    setIsAdmin(role === "admin");
    setIsDemo(true);
    setDemoRole(role);
    setLoading(false);
    setProfileLoading(false);
    localStorage.setItem(DEMO_STORAGE_KEY, role);
  };

  const loginAsDemo = (role: DemoRole = "student") => {
    setDemoState(role);
  };

  const exitDemo = () => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setIsDemo(false);
    setDemoRole(null);
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const checkAdminStatus = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");
    setIsAdmin(roles && roles.length > 0 ? true : false);
  };

  const fetchProfile = async (userId: string, userEmail?: string) => {
    setProfileLoading(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
      } else {
        // Auto-heal: create missing profile row for authenticated user
        const email = userEmail || "";
        const { error: insertErr } = await supabase.from("profiles").insert({
          user_id: userId,
          full_name: email.split("@")[0] || "New User",
          email,
          college_id: THAPAR_COLLEGE_ID,
        });

        if (!insertErr) {
          // Re-fetch the newly created profile
          const { data: newProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();
          setProfile(newProfile);
        } else {
          // Insert failed (e.g. RLS or duplicate) — set null, UI will handle
          setProfile(null);
        }
      }
      await checkAdminStatus(userId);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (isDemo && demoRole) {
      setProfile(createDemoProfile(demoRole));
      return;
    }
    if (user) await fetchProfile(user.id, user.email ?? undefined);
  };

  useEffect(() => {
    const storedDemo = localStorage.getItem(DEMO_STORAGE_KEY) as DemoRole | null;
    if (storedDemo === "student" || storedDemo === "admin") {
      setDemoState(storedDemo);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const stored = localStorage.getItem(DEMO_STORAGE_KEY);
        if (stored) return;

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id, session.user.email ?? undefined), 0);
        } else {
          setProfile(null);
          setProfileLoading(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY);
      if (stored) return;

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? undefined);
      } else {
        setProfileLoading(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, collegeId: string, rollNo: string, linkedinUrl?: string): Promise<SignUpResult> => {
    // Validate @thapar.edu
    if (!email.endsWith("@thapar.edu")) {
      return { error: "Only @thapar.edu email addresses are allowed" };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      // Detect 429 rate-limit errors from Supabase
      const isRateLimited =
        error.status === 429 ||
        error.message?.toLowerCase().includes("rate limit") ||
        error.message?.toLowerCase().includes("too many requests");

      if (isRateLimited) {
        return {
          error: "Too many attempts. Please wait a few minutes before trying again.",
          rateLimited: true,
        };
      }
      return { error: error.message };
    }

    if (data.user) {
      const { error: profileErr } = await supabase.from("profiles").insert({
        user_id: data.user.id,
        full_name: fullName,
        email,
        college_id: collegeId,
        roll_no: rollNo,
        linkedin_url: linkedinUrl || null,
      });
      if (profileErr) return { error: profileErr.message };
    }
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    if (!email.endsWith("@thapar.edu")) {
      return { error: "Only @thapar.edu email addresses are allowed" };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setIsDemo(false);
    setDemoRole(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });
    return { error: error?.message ?? null };
  };

  const resetPassword = async (email: string) => {
    if (!email.endsWith("@thapar.edu")) {
      return { error: "Only @thapar.edu email addresses are allowed" };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      isAdmin, 
      isHeadAdmin: isDemo ? (demoRole === "admin") : checkHeadAdmin(user?.email),
      isDemo,
      demoRole,
      loading, 
      profileLoading, 
      loginAsDemo,
      exitDemo,
      signUp, 
      signIn, 
      signOut, 
      refreshProfile, 
      verifyOtp, 
      resetPassword, 
      updatePassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
