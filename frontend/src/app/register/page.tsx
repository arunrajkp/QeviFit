'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirm) {
            toast.error('Passwords do not match.');
            return;
        }
        if (form.password.length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            await register(form.name, form.email, form.password);
            toast.success('Account created! Let\'s set up your profile 🎉');
            router.push('/onboarding');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
    const strengthColors = ['', '#ff006e', '#ffd700', '#00ff87'];
    const strengthLabels = ['', 'Weak', 'Good', 'Strong'];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ width: '100%', maxWidth: 460 }}
            >
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 14,
                                background: 'linear-gradient(135deg, #00d4ff, #00ff87)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 22, fontWeight: 900, color: '#050814',
                            }}>Q</div>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>Qevi<span className="gradient-text">Diet</span></span>
                        </div>
                    </Link>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>Start your journey 🚀</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Create your free account – takes 30 seconds</p>
                </div>

                <div className="glass-card" style={{ padding: '36px 32px' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Name</label>
                            <input
                                id="register-name"
                                type="text"
                                className="input-field"
                                placeholder="Your full name"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Email Address</label>
                            <input
                                id="register-email"
                                type="email"
                                className="input-field"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="register-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input-field"
                                    placeholder="Min 6 characters"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                    style={{ paddingRight: 48 }}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {form.password && (
                                <div style={{ marginTop: 8 }}>
                                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColors[strength] : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                                        ))}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: strengthColors[strength] }}>{strengthLabels[strength]}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Confirm Password</label>
                            <input
                                id="register-confirm"
                                type="password"
                                className="input-field"
                                placeholder="Confirm your password"
                                value={form.confirm}
                                onChange={e => setForm({ ...form, confirm: e.target.value })}
                                required
                            />
                            {form.confirm && form.password !== form.confirm && (
                                <p style={{ fontSize: '0.78rem', color: '#ff006e', marginTop: 6 }}>⚠ Passwords do not match</p>
                            )}
                        </div>

                        <motion.button
                            id="register-submit"
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            whileHover={!loading ? { scale: 1.02 } : {}}
                            whileTap={!loading ? { scale: 0.98 } : {}}
                            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 6, opacity: loading ? 0.7 : 1 }}
                        >
                            <span>{loading ? '⏳ Creating account...' : '🎯 Create Free Account'}</span>
                        </motion.button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Already have an account?{' '}
                        <Link href="/login" style={{ color: 'var(--neon-cyan)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                    </div>
                </div>

                <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    🔐 Your data is encrypted & never shared
                </p>
            </motion.div>
        </div>
    );
}
