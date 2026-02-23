import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Inject JWT token on every request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('qevid_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors globally
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('qevid_token');
            localStorage.removeItem('qevid_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
    register: (data: { name: string; email: string; password: string }) =>
        api.post('/auth/register', data),
    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),
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
    generate: (profile?: Record<string, unknown>) => api.post('/diet/generate', { profile }),
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
    calculate: (food_name: string, quantity_g: number) =>
        api.get(`/nutrition/calculate?food_name=${encodeURIComponent(food_name)}&quantity_g=${quantity_g}`),
    getFoods: (category?: string) =>
        api.get(`/nutrition/foods${category ? `?category=${category}` : ''}`),
};

export default api;
