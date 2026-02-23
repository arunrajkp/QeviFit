'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { profileAPI } from '@/lib/api';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    BarChart, Bar, Legend,
} from 'recharts';
import toast from 'react-hot-toast';

interface WeightLog { weight_kg: number; logged_date: string; notes?: string; }

// Demo data generator
const genDemoWeight = () => {
    const logs: WeightLog[] = [];
    const base = 82;
    for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        logs.push({
            weight_kg: parseFloat((base - (29 - i) * 0.08 + (Math.random() - 0.5) * 0.4).toFixed(1)),
            logged_date: d.toISOString().split('T')[0],
        });
    }
    return logs;
};

const genDemoMacros = () => {
    const data = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
        data.push({
            day: days[i],
            protein: Math.round(140 + Math.random() * 50),
            carbs: Math.round(180 + Math.random() * 80),
            fat: Math.round(55 + Math.random() * 25),
            calories: Math.round(1900 + Math.random() * 600),
        });
    }
    return data;
};

const CUSTOM_TOOLTIP = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 12, padding: '12px 16px' }}>
            <p style={{ fontWeight: 700, marginBottom: 6, color: '#f0f4ff' }}>{label}</p>
            {payload.map(p => (
                <p key={p.name} style={{ color: p.color, fontSize: '0.85rem' }}>{p.name}: <strong>{p.value}</strong></p>
            ))}
        </div>
    );
};

export default function ProgressPage() {
    const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
    const [macroData] = useState(genDemoMacros());
    const [newWeight, setNewWeight] = useState('');
    const [weightNotes, setWeightNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [range, setRange] = useState<7 | 14 | 30>(30);

    const loadWeightLogs = useCallback(async () => {
        try {
            const res = await profileAPI.getWeightLogs();
            setWeightLogs(res.data.weightLogs || genDemoWeight());
        } catch {
            setWeightLogs(genDemoWeight());
        }
    }, []);

    useEffect(() => { loadWeightLogs(); }, [loadWeightLogs]);

    const handleLogWeight = async () => {
        if (!newWeight) { toast.error('Please enter your weight.'); return; }
        setLoading(true);
        try {
            await profileAPI.logWeight({ weight_kg: parseFloat(newWeight), notes: weightNotes });
            toast.success('⚖️ Weight logged!');
            setNewWeight('');
            setWeightNotes('');
            loadWeightLogs();
        } catch {
            // Demo mode
            setWeightLogs(prev => [{ weight_kg: parseFloat(newWeight), logged_date: new Date().toISOString().split('T')[0], notes: weightNotes }, ...prev]);
            toast.success('⚖️ Weight logged! (Demo)');
            setNewWeight('');
        } finally {
            setLoading(false);
        }
    };

    const filtered = weightLogs.slice(0, range).reverse();
    const chartData = filtered.map((l) => ({
        date: new Date(l.logged_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        weight: l.weight_kg,
    }));

    const startWeight = filtered[0]?.weight_kg ?? 0;
    const currentWeight = filtered[filtered.length - 1]?.weight_kg ?? 0;
    const weightChange = parseFloat((currentWeight - startWeight).toFixed(1));

    // Calculate weekly compliance (demo)
    const targetCalories = 2200;
    const complianceDays = macroData.filter(d => Math.abs(d.calories - targetCalories) < 300).length;
    const compliancePct = Math.round((complianceDays / 7) * 100);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>📈 Progress Tracker</h2>
                <p style={{ color: 'var(--text-muted)' }}>Track your weight trends and weekly nutrition compliance</p>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                {[
                    { label: 'Current Weight', value: `${currentWeight} kg`, color: '#00d4ff', icon: '⚖️', accent: 'cyan' },
                    { label: 'Weight Change', value: `${weightChange > 0 ? '+' : ''}${weightChange} kg`, color: weightChange <= 0 ? '#00ff87' : '#ff006e', icon: weightChange <= 0 ? '📉' : '📈', accent: 'green' },
                    { label: 'Weekly Compliance', value: `${compliancePct}%`, color: '#a855f7', icon: '🎯', accent: 'purple' },
                    { label: 'Days Tracked', value: `${Math.min(filtered.length, range)}`, color: '#ffd700', icon: '📅', accent: 'orange' },
                ].map((s, i) => (
                    <motion.div key={s.label} className={`stat-card ${s.accent}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{s.icon}</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Weight Log Form */}
            <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>⚖️ Log Today's Weight</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <input
                        id="weight-input"
                        type="number"
                        className="input-field"
                        placeholder="Weight (kg), e.g. 78.5"
                        value={newWeight}
                        onChange={e => setNewWeight(e.target.value)}
                        style={{ flex: '1 1 180px' }}
                        step="0.1"
                    />
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Notes (optional)"
                        value={weightNotes}
                        onChange={e => setWeightNotes(e.target.value)}
                        style={{ flex: '2 1 250px' }}
                    />
                    <motion.button
                        id="log-weight-btn"
                        className="btn-primary"
                        onClick={handleLogWeight}
                        disabled={loading || !newWeight}
                        whileHover={!loading && !!newWeight ? { scale: 1.02 } : {}}
                        style={{ flexShrink: 0, opacity: !newWeight || loading ? 0.6 : 1 }}
                    >
                        <span>{loading ? '⏳' : '+ Log Weight'}</span>
                    </motion.button>
                </div>
            </div>

            {/* Weight Chart */}
            <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700 }}>Weight Trend</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {([7, 14, 30] as const).map(r => (
                            <button key={r} onClick={() => setRange(r)}
                                style={{
                                    padding: '5px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem',
                                    border: `1px solid ${range === r ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.08)'}`,
                                    background: range === r ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                                    color: range === r ? 'var(--neon-cyan)' : 'var(--text-muted)',
                                    fontWeight: range === r ? 700 : 400,
                                }}>
                                {r}D
                            </button>
                        ))}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CUSTOM_TOOLTIP />} />
                        <Line type="monotone" dataKey="weight" stroke="#00d4ff" strokeWidth={2.5}
                            dot={{ fill: '#00d4ff', r: 3 }} activeDot={{ r: 5 }} name="Weight (kg)" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Weekly Nutrition Chart */}
            <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 24 }}>Weekly Macro Overview</h3>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={macroData} barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip content={<CUSTOM_TOOLTIP />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="protein" name="Protein (g)" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="carbs" name="Carbs (g)" fill="#00ff87" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="fat" name="Fat (g)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Weight History Table */}
            <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Weight History</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                        <thead>
                            <tr>
                                {['Date', 'Weight (kg)', 'Change', 'Notes'].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.slice().reverse().slice(0, 10).map((log, i, arr) => {
                                const prev = arr[i + 1];
                                const change = prev ? parseFloat((log.weight_kg - prev.weight_kg).toFixed(1)) : 0;
                                return (
                                    <tr key={log.logged_date} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{new Date(log.logged_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#00d4ff' }}>{log.weight_kg}</td>
                                        <td style={{ padding: '10px 14px', color: change === 0 ? 'var(--text-muted)' : change < 0 ? '#00ff87' : '#ff006e', fontWeight: 600 }}>
                                            {i < arr.length - 1 ? `${change > 0 ? '+' : ''}${change}` : '—'}
                                        </td>
                                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{log.notes || '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
