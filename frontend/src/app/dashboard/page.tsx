'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { dietAPI, logsAPI } from '@/lib/api';
import { Calendar, Sun, Utensils, Apple } from 'lucide-react';

interface Summary {
    targets: { calories: number; protein: number; carbs: number; fat: number; goal: string; bmr: number; tdee: number };
    consumed: { calories: number; protein: number; carbs: number; fat: number };
    date: string;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const summaryRes = await dietAPI.getSummary();
            setSummary(summaryRes.data);
        } catch {
            // Mock data for UI presentation
            setSummary({
                date: new Date().toISOString().split('T')[0],
                targets: { calories: 2345, protein: 180, carbs: 242, fat: 73, goal: 'muscle_gain', bmr: 1850, tdee: 2700 },
                consumed: { calories: 1100, protein: 112, carbs: 145, fat: 42 },
            });
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    if (loadingData) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
                <div className="loader" style={{ borderColor: '#e2e8f0', borderTopColor: '#3b82f6' }} />
            </div>
        );
    }

    const targets = summary?.targets || { calories: 2000, protein: 150, carbs: 200, fat: 65, goal: 'maintenance', bmr: 1600, tdee: 2000 };
    const consumed = summary?.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const remaining = Math.max(0, targets.calories - consumed.calories);

    // Calculate ring dimensions
    const size = 300;
    const strokeWidth = 3;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const percent = Math.min(consumed.calories / targets.calories, 1);
    const offset = circumference * (1 - percent);
    const cx = size / 2, cy = size / 2;

    const todayDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 8px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                    <div className="header-date">{todayDateStr}</div>
                    <div className="header-title" style={{ fontSize: '2.4rem', fontWeight: 300, color: '#1e293b' }}>Summary</div>
                </div>
                <div className="circle-icon" style={{ cursor: 'pointer' }}>
                    <Calendar size={20} strokeWidth={1.5} color="#64748b" />
                </div>
            </div>

            {/* Giant Circular Progress Ring */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 50, position: 'relative' }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
                    <motion.circle
                        cx={cx} cy={cy} r={radius} fill="none"
                        stroke="#3b82f6" strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                </svg>
                {/* Centered Text */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: '4.5rem', fontWeight: 300, color: '#0f172a', lineHeight: 1, marginBottom: 8 }}>
                        {remaining.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.15em' }}>
                        KCAL REMAINING
                    </div>
                </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', marginBottom: 32 }} />

            {/* Macros Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', marginBottom: 32 }}>
                <div className="macro-box">
                    <div className="label">PROTEIN</div>
                    <div className="value">{Math.round(consumed.protein)}<span className="unit">g</span></div>
                </div>
                <div className="macro-box" style={{ borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9' }}>
                    <div className="label">CARBS</div>
                    <div className="value">{Math.round(consumed.carbs)}<span className="unit">g</span></div>
                </div>
                <div className="macro-box">
                    <div className="label">FATS</div>
                    <div className="value">{Math.round(consumed.fat)}<span className="unit">g</span></div>
                </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', marginBottom: 36 }} />

            {/* Logged Meals Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8', letterSpacing: '0.15em' }}>LOGGED MEALS</div>
                <Link href="/dashboard/food-log" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>History</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Breakfast Item */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="circle-icon" style={{ backgroundColor: '#ffffff', flexShrink: 0 }}>
                        <Sun size={20} color="#64748b" strokeWidth={1.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 400, color: '#0f172a', marginBottom: 4 }}>Breakfast</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Oatmeal, Eggs, Berries</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 400, color: '#0f172a', marginBottom: 4 }}>420 kcal</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.05em' }}>32G PROTEIN</div>
                    </div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px dashed #f1f5f9' }} />

                {/* Lunch Item */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="circle-icon" style={{ backgroundColor: '#ffffff', flexShrink: 0 }}>
                        <Utensils size={20} color="#64748b" strokeWidth={1.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 400, color: '#0f172a', marginBottom: 4 }}>Lunch</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Chicken Salad, Avocado</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 400, color: '#0f172a', marginBottom: 4 }}>680 kcal</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.05em' }}>48G PROTEIN</div>
                    </div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px dashed #f1f5f9' }} />

                {/* Snack Item */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="circle-icon" style={{ backgroundColor: '#ffffff', flexShrink: 0 }}>
                        <Apple size={20} color="#64748b" strokeWidth={1.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 400, color: '#0f172a', marginBottom: 4 }}>Snack</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Protein Shake, Almonds</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 400, color: '#0f172a', marginBottom: 4 }}>210 kcal</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.05em' }}>25G PROTEIN</div>
                    </div>
                </div>

            </div>

            <div style={{ height: 60 }} /> {/* Spacer for bottom nav */}
        </div>
    );
}
