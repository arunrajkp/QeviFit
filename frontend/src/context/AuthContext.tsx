'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

interface User {
    id: string;
    name: string;
    email: string;
    plan: string;
    profileCompleted?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('qevid_token');
        const savedUser = localStorage.getItem('qevid_user');
        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch { /* ignore */ }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const res = await authAPI.login({ email, password });
        const { token, user: userData } = res.data;
        localStorage.setItem('qevid_token', token);
        localStorage.setItem('qevid_user', JSON.stringify(userData));
        setUser(userData);
    };

    const register = async (name: string, email: string, password: string) => {
        const res = await authAPI.register({ name, email, password });
        const { token, user: userData } = res.data;
        localStorage.setItem('qevid_token', token);
        localStorage.setItem('qevid_user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('qevid_token');
        localStorage.removeItem('qevid_user');
        setUser(null);
    };

    const updateUser = (updates: Partial<User>) => {
        if (user) {
            const updated = { ...user, ...updates };
            setUser(updated);
            localStorage.setItem('qevid_user', JSON.stringify(updated));
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
