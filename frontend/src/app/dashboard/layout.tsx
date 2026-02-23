'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/meal-plan', label: 'Meal Plan', icon: '📅' },
    { href: '/dashboard/food-log', label: 'Food Log', icon: '🍽️' },
    { href: '/dashboard/progress', label: 'Progress', icon: '📈' },
    { href: '/dashboard/profile', label: 'Profile', icon: '👤' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);
    // Close sidebar on route change (mobile)
    useEffect(() => { setSidebarOpen(false); }, [pathname]);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loader" />
        </div>
    );
    if (!user) return null;

    const currentPage = NAV_ITEMS.find(n => n.href === pathname);

    return (
        <div className="dash-wrapper">
            {/* ── Mobile overlay ── */}
            <div
                className={`dash-overlay ${sidebarOpen ? 'open' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* ── Sidebar ── */}
            <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
                {/* Logo */}
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, #00d4ff, #00ff87)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 900, color: '#050814', flexShrink: 0,
                    }}>Q</div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Qevi<span className="gradient-text">Diet</span></span>
                </Link>

                {/* User snippet */}
                <div style={{
                    padding: '12px 14px', borderRadius: 14,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: 24,
                }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '1rem', color: '#fff', marginBottom: 8,
                    }}>
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{user.name}</div>
                    <div className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{user.plan?.toUpperCase() || 'FREE'}</div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {NAV_ITEMS.map(item => (
                        <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                            <div className={`nav-link ${pathname === item.href ? 'active' : ''}`}>
                                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                                <span>{item.label}</span>
                            </div>
                        </Link>
                    ))}
                </nav>

                {/* Logout */}
                <button
                    id="logout-btn"
                    onClick={() => { logout(); router.push('/'); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px', borderRadius: 12, width: '100%',
                        background: 'rgba(255, 0, 110, 0.08)',
                        border: '1px solid rgba(255, 0, 110, 0.15)',
                        color: '#ff006e', fontWeight: 500, fontSize: '0.9rem',
                        cursor: 'pointer', transition: 'all 0.2s', marginTop: 12,
                    }}
                >
                    <span>🚪</span><span>Sign Out</span>
                </button>
            </aside>

            {/* ── Main ── */}
            <main className="dash-main">
                {/* Top bar */}
                <div className="dash-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Hamburger – only visible on mobile via CSS */}
                        <button
                            className="dash-hamburger"
                            onClick={() => setSidebarOpen(o => !o)}
                            aria-label="Toggle menu"
                        >
                            {sidebarOpen ? '✕' : '☰'}
                        </button>
                        <h1 style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            {currentPage?.icon} {currentPage?.label || 'Dashboard'}
                        </h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
                        }}>
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <div className="dash-content">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
