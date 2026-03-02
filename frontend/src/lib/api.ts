import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Inject Supabase access token on every request
api.interceptors.request.use(async (config) => {
    if (typeof window !== 'undefined') {
        // Always get the freshest token from Supabase (auto-refreshed)
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || localStorage.getItem('qevid_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 globally
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            // Try to refresh session once
            const { data: { session } } = await supabase.auth.refreshSession();
            if (!session) {
                await supabase.auth.signOut();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ─── Auth (backend sync only — login/register done via Supabase client) ───────
export const authAPI = {
    sync: (data: { name?: string; email?: string }) => api.post('/auth/sync', data),
    me: () => api.get('/auth/me'),
};

// ─── Profile ─────────────────────────────────────────────────────────────────
export const profileAPI = {
    get: () => api.get('/profile'),
    save: (data: Record<string, unknown>) => api.post('/profile', data),
    getWeightLogs: () => api.get('/profile/weight-logs'),
    logWeight: (data: { weight_kg: number; notes?: string }) =>
        api.post('/profile/weight-logs', data),
};

// ─── Diet ─────────────────────────────────────────────────────────────────────
export const dietAPI = {
    getPlan: () => api.get('/diet/plan'),
    generate: () => api.post('/diet/generate', {}),
    getSummary: () => api.get('/diet/summary'),
    getTips: (goal?: string) => api.get(`/diet/tips${goal ? `?goal=${goal}` : ''}`),
};

// ─── Logs ─────────────────────────────────────────────────────────────────────
export const logsAPI = {
    get: (date?: string) => api.get(`/logs${date ? `?date=${date}` : ''}`),
    add: (data: Record<string, unknown>) => api.post('/logs', data),
    delete: (id: string) => api.delete(`/logs/${id}`),
    getWeekly: () => api.get('/logs/weekly'),
};

// ─── Nutrition ────────────────────────────────────────────────────────────────
export const nutritionAPI = {
    search: (q: string) => api.get(`/nutrition/search?q=${encodeURIComponent(q)}`),
    calculate: (food_id: string, quantity_g: number) =>
        api.post('/nutrition/calculate', { food_id, quantity_g }),
    getFoods: (category?: string) =>
        api.get(`/nutrition/foods${category ? `?category=${category}` : ''}`),
};

export default api;
