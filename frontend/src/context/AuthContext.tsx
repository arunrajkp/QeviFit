'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

/* ─── Types ────────────────────────────────────────────────── */
interface AppUser {
    id: string;
    name: string;
    email: string;
    plan: string;
    profileCompleted?: boolean;
}

interface AuthContextType {
    user: AppUser | null;
    session: Session | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<AppUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/* ─── Helper: map Supabase user → AppUser ──────────────────── */
function mapUser(su: SupabaseUser, extra?: Partial<AppUser>): AppUser {
    return {
        id: su.id,
        email: su.email || '',
        name: su.user_metadata?.name || su.email?.split('@')[0] || 'User',
        plan: su.user_metadata?.plan || 'free',
        profileCompleted: su.user_metadata?.profileCompleted || false,
        ...extra,
    };
}

/* ─── Provider ─────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    /* On mount: restore session from Supabase (handles token refresh) */
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                setUser(mapUser(session.user));
            }
            setLoading(false);
        });

        // Listen for auth state changes (login / logout / token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                setUser(mapUser(session.user));
                // Sync Supabase access token to localStorage for backend API calls
                localStorage.setItem('qevid_token', session.access_token);
            } else {
                setUser(null);
                localStorage.removeItem('qevid_token');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    /* Login */
    const login = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
            localStorage.setItem('qevid_token', data.session.access_token);
        }
        if (data.user) setUser(mapUser(data.user));
    };

    /* Register — creates user in Supabase Auth, stores name in metadata */
    const register = async (name: string, email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, plan: 'free', profileCompleted: false },
            },
        });
        if (error) throw error;

        // After signup, also create a row in the public users table via backend
        if (data.session) {
            localStorage.setItem('qevid_token', data.session.access_token);
            // Create user profile entry in backend DB
            try {
                await fetch('/api/auth/sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${data.session.access_token}`,
                    },
                    body: JSON.stringify({ name, email }),
                });
            } catch { /* non-critical */ }
        }
        if (data.user) setUser(mapUser(data.user));
    };

    /* Logout */
    const logout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('qevid_token');
        setUser(null);
        setSession(null);
        window.location.href = '/login';
    };

    /* Update local user state (e.g., after profile save) */
    const updateUser = (updates: Partial<AppUser>) => {
        if (user) {
            const updated = { ...user, ...updates };
            setUser(updated);
            // Also update Supabase metadata
            supabase.auth.updateUser({ data: updates }).catch(() => { });
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
