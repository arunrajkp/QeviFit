'use client';
import { useState, useEffect, useCallback } from 'react';
import { profileAPI } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';
import { Scale } from 'lucide-react';

interface WeightLog { weight_kg: number; logged_date: string; notes?: string; }

export default function ProgressPage() {
    const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [newWeight, setNewWeight] = useState('');
    const [saving, setSaving] = useState(false);

    const loadLogs = useCallback(async () => {
        try {
            const res = await profileAPI.getWeightLogs();
            setWeightLogs(res.data.weightLogs || []);
        } catch {
            // Demo data if no real data
            const demo: WeightLog[] = [];
            const base = 82;
            for (let i = 29; i >= 0; i--) {
                const d = new Date(); d.setDate(d.getDate() - i);
                demo.push({
                    weight_kg: parseFloat((base - (29 - i) * 0.08 + (Math.random() - 0.5) * 0.3).toFixed(1)),
                    logged_date: d.toISOString().split('T')[0],
                });
            }
            setWeightLogs(demo);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadLogs(); }, [loadLogs]);

    const handleLogWeight = async () => {
        if (!newWeight) return;
        setSaving(true);
        try {
            await profileAPI.logWeight({ weight_kg: parseFloat(newWeight) });
            toast.success('Weight logged!');
            setNewWeight('');
            loadLogs();
        } catch { toast.error('Failed to log weight.'); }
        finally { setSaving(false); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="loader" style={{ borderColor: '#e2e8f0', borderTopColor: '#3b82f6' }} /></div>;

    const latest = weightLogs[0]?.weight_kg;
    const oldest = weightLogs[weightLogs.length - 1]?.weight_kg;
    const change = latest && oldest ? (latest - oldest).toFixed(1) : null;
    const chartData = [...weightLogs].reverse().map(l => ({ date: l.logged_date.slice(5), weight: l.weight_kg }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ marginBottom: 40 }}>
                <div className="header-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</div>
                <div style={{ fontSize: '2.4rem', fontWeight: 300, color: '#1e293b' }}>Progress</div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', marginBottom: 40 }}>
                <div className="macro-box">
                    <div className="label">CURRENT</div>
                    <div className="value">{latest || '—'}<span className="unit"> kg</span></div>
                </div>
                <div className="macro-box" style={{ borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9' }}>
                    <div className="label">CHANGE</div>
                    <div className="value" style={{ color: change && parseFloat(change) < 0 ? '#22c55e' : change && parseFloat(change) > 0 ? '#f59e0b' : '#0f172a' }}>
                        {change ? (parseFloat(change) > 0 ? `+${change}` : change) : '—'}<span className="unit"> kg</span>
                    </div>
                </div>
                <div className="macro-box">
                    <div className="label">LOGS</div>
                    <div className="value">{weightLogs.length}<span className="unit"> days</span></div>
                </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', marginBottom: 32 }} />

            {/* Weight Chart */}
            <div style={{ marginBottom: 40 }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 20 }}>WEIGHT TREND (30 DAYS)</div>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                            tickFormatter={(v, i) => i % 5 === 0 ? v : ''} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                            domain={['auto', 'auto']} />
                        <Tooltip
                            contentStyle={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 8, fontSize: '0.8rem' }}
                            formatter={(v: number) => [`${v} kg`, 'Weight']}
                        />
                        <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', marginBottom: 32 }} />

            {/* Log Weight Input */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 16 }}>LOG TODAY'S WEIGHT</div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <input type="number" step="0.1" placeholder="e.g. 75.5 kg"
                        className="input-field" value={newWeight}
                        onChange={e => setNewWeight(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button className="btn-primary" onClick={handleLogWeight} disabled={saving || !newWeight}
                        style={{ padding: '14px 24px', opacity: !newWeight ? 0.5 : 1 }}>
                        {saving ? '...' : 'Log'}
                    </button>
                </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', marginBottom: 24 }} />

            {/* Recent Logs List */}
            <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 16 }}>RECENT ENTRIES</div>
                {weightLogs.slice(0, 10).map((log, i) => (
                    <div key={log.logged_date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < 9 ? '1px solid #f1f5f9' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Scale size={16} color="#94a3b8" strokeWidth={1.5} />
                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{log.logged_date}</span>
                        </div>
                        <span style={{ fontWeight: 500, color: '#0f172a' }}>{log.weight_kg} kg</span>
                    </div>
                ))}
                {weightLogs.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0', fontSize: '0.9rem' }}>No weight logs yet. Start tracking above!</div>}
            </div>

            <div style={{ height: 40 }} />
        </div>
    );
}
