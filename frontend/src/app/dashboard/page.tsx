'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { dietAPI, logsAPI } from '@/lib/api';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';

interface Summary {
    targets: { calories: number; protein: number; carbs: number; fat: number; goal: string; bmr: number; tdee: number };
    consumed: { calories: number; protein: number; carbs: number; fat: number };
    date: string;
}

interface WeeklyData {
    log_date: string;
    total_calories: number;
    total_protein: number;
}

// Progress Ring component
function ProgressRing({ value, max, size = 80, strokeWidth = 7, color = '#00d4ff', label, sublabel }: {
    value: number; max: number; size?: number; strokeWidth?: number;
    color?: string; label: string; sublabel?: string;
}) {
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const percent = Math.min(value / max, 1);
    const offset = circumference * (1 - percent);
    const cx = size / 2, cy = size / 2;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
                <motion.circle
                    cx={cx} cy={cy} r={radius} fill="none"
                    stroke={color} strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                    style={{ fill: '#f0f4ff', fontSize: size * 0.2, fontWeight: 700, transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px` }}>
                    {Math.round(percent * 100)}%
                </text>
            </svg>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{label}</div>
                {sublabel && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{sublabel}</div>}
            </div>
        </div>
    );
}

// Macro Bar
function MacroBar({ label, consumed, target, color }: { label: string; consumed: number; target: number; color: string }) {
    const percent = Math.min((consumed / Math.max(target, 1)) * 100, 100);
    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <span style={{ color, fontWeight: 700 }}>{Math.round(consumed)}g</span> / {Math.round(target)}g
                </span>
            </div>
            <div className="macro-bar">
                <motion.div
                    className="macro-bar-fill"
                    style={{ background: color, width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
}

const MACRO_COLORS = ['#00d4ff', '#00ff87', '#a855f7'];
const GOAL_LABELS: Record<string, string> = {
    fat_loss: '🔥 Fat Loss', muscle_gain: '💪 Muscle Gain',
    lean_body: '⚡ Lean Body', good_physique: '🏆 Good Physique', maintenance: '⚖️ Maintenance',
};

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [summary, setSummary] = useState<Summary | null>(null);
    const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
    const [tips, setTips] = useState<string[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [summaryRes, weeklyRes, tipsRes] = await Promise.all([
                dietAPI.getSummary(),
                logsAPI.getWeekly(),
                dietAPI.getTips(),
            ]);
            setSummary(summaryRes.data);
            setWeeklyData(weeklyRes.data.weeklyData || []);
            setTips(tipsRes.data.tips || []);
        } catch {
            // Use demo data
            setSummary({
                date: new Date().toISOString().split('T')[0],
                targets: { calories: 2200, protein: 165, carbs: 242, fat: 73, goal: 'muscle_gain', bmr: 1850, tdee: 2700 },
                consumed: { calories: 1420, protein: 98, carbs: 156, fat: 42 },
            });
            setTips([
                'Eat protein with every meal to stay full and preserve muscle mass.',
                'Drink at least 8-10 glasses of water daily for optimal metabolism.',
                'Never skip breakfast — it kickstarts your metabolism for the day.',
            ]);
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // Demo weekly chart data if no real data
    const chartData = weeklyData.length > 0 ? weeklyData.map(d => ({
        day: new Date(d.log_date).toLocaleDateString('en', { weekday: 'short' }),
        calories: Math.round(d.total_calories),
        protein: Math.round(d.total_protein),
    })) : [
        { day: 'Mon', calories: 2100, protein: 158 },
        { day: 'Tue', calories: 1980, protein: 145 },
        { day: 'Wed', calories: 2220, protein: 170 },
        { day: 'Thu', calories: 2050, protein: 162 },
        { day: 'Fri', calories: 2300, protein: 175 },
        { day: 'Sat', calories: 1850, protein: 140 },
        { day: 'Sun', calories: 2150, protein: 160 },
    ];

    if (loadingData) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
                <div className="loader" />
            </div>
        );
    }

    const targets = summary?.targets || { calories: 2000, protein: 150, carbs: 200, fat: 65, goal: 'maintenance', bmr: 1600, tdee: 2000 };
    const consumed = summary?.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const remaining = Math.max(0, targets.calories - consumed.calories);

    const pieData = [
        { name: 'Protein', value: consumed.protein * 4, fill: '#00d4ff' },
        { name: 'Carbs', value: consumed.carbs * 4, fill: '#00ff87' },
        { name: 'Fat', value: consumed.fat * 9, fill: '#a855f7' },
    ].filter(d => d.value > 0);

    const goalCompletion = Math.min(Math.round((consumed.calories / targets.calories) * 100), 100);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Greeting */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
                        Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="badge badge-cyan">{GOAL_LABELS[targets.goal] || '🎯 Goal'}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Today: {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                </div>
                <Link href="/dashboard/food-log">
                    <motion.button
                        className="btn-primary"
                        whileHover={{ scale: 1.03 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px' }}
                    >
                        <span>+ Log Food</span>
                    </motion.button>
                </Link>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
                {[
                    { label: 'Calories Left', value: remaining, unit: 'kcal', color: '#00d4ff', accent: 'cyan', icon: '⚡' },
                    { label: 'Consumed', value: Math.round(consumed.calories), unit: 'kcal', color: '#00ff87', accent: 'green', icon: '🍽️' },
                    { label: 'BMR', value: Math.round(targets.bmr), unit: 'kcal', color: '#a855f7', accent: 'purple', icon: '🫀' },
                    { label: 'TDEE', value: Math.round(targets.tdee), unit: 'kcal', color: '#ff6b00', accent: 'orange', icon: '🔥' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        className={`stat-card ${stat.accent}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                    >
                        <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{stat.icon}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value.toLocaleString()}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{stat.unit}</div>
                    </motion.div>
                ))}
            </div>

            {/* Macros + Rings */}
            <div className="two-col-layout">
                {/* Macro Bars */}
                <div className="glass-card" style={{ padding: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Today's Macros</h3>
                        <Link href="/dashboard/food-log" style={{ color: 'var(--neon-cyan)', fontSize: '0.85rem', textDecoration: 'none' }}>View Log →</Link>
                    </div>
                    <MacroBar label="🥩 Protein" consumed={consumed.protein} target={targets.protein} color="#00d4ff" />
                    <MacroBar label="🍞 Carbs" consumed={consumed.carbs} target={targets.carbs} color="#00ff87" />
                    <MacroBar label="🥑 Fat" consumed={consumed.fat} target={targets.fat} color="#a855f7" />

                    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <ProgressRing value={consumed.protein} max={targets.protein} color="#00d4ff" label="Protein" sublabel={`${Math.round(consumed.protein)}g`} size={72} />
                        <ProgressRing value={consumed.carbs} max={targets.carbs} color="#00ff87" label="Carbs" sublabel={`${Math.round(consumed.carbs)}g`} size={72} />
                        <ProgressRing value={consumed.fat} max={targets.fat} color="#a855f7" label="Fat" sublabel={`${Math.round(consumed.fat)}g`} size={72} />
                    </div>
                </div>

                {/* Calorie Ring + Pie */}
                <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                    <h3 style={{ fontWeight: 700, alignSelf: 'flex-start' }}>Goal Progress</h3>
                    <ProgressRing value={consumed.calories} max={targets.calories} color="#00d4ff" label="Calories" sublabel={`${Math.round(consumed.calories)} / ${targets.calories}`} size={110} strokeWidth={9} />
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        <span style={{ color: '#00d4ff', fontWeight: 700 }}>{goalCompletion}%</span> of daily goal achieved
                    </div>
                    {pieData.length > 0 && (
                        <PieChart width={140} height={100}>
                            <Pie data={pieData} cx={70} cy={50} innerRadius={30} outerRadius={48} paddingAngle={3} dataKey="value">
                                {pieData.map((entry, index) => (
                                    <Cell key={index} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    )}
                </div>
            </div>

            {/* Weekly Chart */}
            <div className="glass-card" style={{ padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700 }}>Weekly Calorie & Protein Trend</h3>
                    <Link href="/dashboard/progress" style={{ color: 'var(--neon-cyan)', fontSize: '0.85rem', textDecoration: 'none' }}>Full Report →</Link>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="protGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00ff87" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#00ff87" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip contentStyle={{ background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 10 }} />
                        <Area type="monotone" dataKey="calories" stroke="#00d4ff" fill="url(#calGrad)" strokeWidth={2} name="Calories" />
                        <Area type="monotone" dataKey="protein" stroke="#00ff87" fill="url(#protGrad)" strokeWidth={2} name="Protein (g)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* AI Tips */}
            <div className="glass-card" style={{ padding: 28 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 20 }}>🧠 AI Nutrition Tips</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                    {tips.slice(0, 4).map((tip, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                padding: '14px 18px', borderRadius: 12,
                                background: 'rgba(0,212,255,0.05)',
                                border: '1px solid rgba(0,212,255,0.1)',
                                fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-muted)',
                            }}
                        >
                            <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>💡 </span>{tip}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
