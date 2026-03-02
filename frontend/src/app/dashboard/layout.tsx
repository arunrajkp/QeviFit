'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Home, BarChart2, UtensilsCrossed, User, Plus } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

    if (loading || !user) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loader" style={{ borderColor: '#e2e8f0', borderTopColor: '#3b82f6' }} />
        </div>
    );

    const navItems = [
        { href: '/dashboard', label: 'TODAY', icon: Home },
        { href: '/dashboard/progress', label: 'STATS', icon: BarChart2 },
        { href: '/dashboard/food-log', label: 'LOG', icon: Plus, isFab: true },
        { href: '/dashboard/meal-plan', label: 'PLANS', icon: UtensilsCrossed },
        { href: '/dashboard/profile', label: 'PROFILE', icon: User },
    ];

    return (
        <div className="dash-wrapper">
            {/* ── Main ── */}
            <main className="dash-main">
                <div className="dash-content">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* ── Bottom Nav ── */}
            <nav className="bottom-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    // Determine "active" for the Today tab (exact match) and others (startsWith)
                    const isActive = item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname.startsWith(item.href);

                    if (item.isFab) {
                        return (
                            <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    width: 52, height: 52,
                                    background: '#0f172a',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white',
                                    marginTop: -20,
                                    boxShadow: '0 4px 14px rgba(15,23,42,0.25)',
                                    flexShrink: 0,
                                }}>
                                    <Icon size={22} strokeWidth={2.5} />
                                </div>
                                <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em', marginTop: 4 }}>{item.label}</span>
                            </Link>
                        );
                    }

                    return (
                        <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                            <div className={`nav-item ${isActive ? 'active' : ''}`}>
                                <Icon strokeWidth={isActive ? 2.5 : 1.8} size={22} />
                                <span>{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
