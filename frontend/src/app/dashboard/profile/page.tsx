'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { profileAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Profile {
    age: number; gender: string; height_cm: number; weight_kg: number; body_type: string;
    job_type: string; workout_frequency: number; sleep_hours: number; water_intake_liters: number;
    goal: string; dietary_preference: string; target_weight_kg: number;
    bmr: number; tdee: number; target_calories: number; target_protein_g: number; target_carbs_g: number; target_fat_g: number;
    profile_completed: boolean;
}

const GOAL_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
    fat_loss: { label: 'Fat Loss', color: '#ff6b00', emoji: '🔥' },
    muscle_gain: { label: 'Muscle Gain', color: '#00d4ff', emoji: '💪' },
    lean_body: { label: 'Lean Body', color: '#a855f7', emoji: '⚡' },
    good_physique: { label: 'Good Physique', color: '#ffd700', emoji: '🏆' },
    maintenance: { label: 'Maintenance', color: '#00ff87', emoji: '⚖️' },
};

export default function ProfilePage() {
    const { user, updateUser, logout } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [newWeight, setNewWeight] = useState('');
    const [logWeightLoading, setLogWeightLoading] = useState(false);

    const loadProfile = useCallback(async () => {
        try {
            const res = await profileAPI.get();
            setProfile(res.data.profile);
        } catch {
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    const handleLogWeight = async () => {
        if (!newWeight) return;
        setLogWeightLoading(true);
        try {
            await profileAPI.logWeight({ weight_kg: parseFloat(newWeight) });
            toast.success('⚖️ Weight updated!');
            setNewWeight('');
            loadProfile();
        } catch { toast.error('Failed to log weight.'); }
        finally { setLogWeightLoading(false); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="loader" /></div>;

    const goalInfo = profile?.goal ? GOAL_LABELS[profile.goal] : null;
    const bmi = profile ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1) : null;
    const getBMILabel = (bmi: number) => {
        if (bmi < 18.5) return { label: 'Underweight', color: '#ffd700' };
        if (bmi < 25) return { label: 'Normal', color: '#00ff87' };
        if (bmi < 30) return { label: 'Overweight', color: '#ff6b00' };
        return { label: 'Obese', color: '#ff006e' };
    };
    const bmiInfo = bmi ? getBMILabel(parseFloat(bmi)) : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>👤 My Profile</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Your body stats, nutrition targets and account settings</p>
                </div>
                <Link href="/onboarding">
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        ✏️ Update Profile
                    </button>
                </Link>
            </div>

            {/* User Card */}
            <div className="glass-card" style={{ padding: 28, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '2rem', color: '#fff',
                }}>
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>{user?.name}</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{user?.email}</p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span className="badge badge-cyan">{user?.plan?.toUpperCase() || 'FREE'} PLAN</span>
                        {goalInfo && <span className="badge" style={{ background: `${goalInfo.color}20`, color: goalInfo.color, border: `1px solid ${goalInfo.color}40` }}>{goalInfo.emoji} {goalInfo.label}</span>}
                        {profile?.profile_completed && <span className="badge badge-green">✓ Profile Complete</span>}
                    </div>
                </div>
            </div>

            {!profile ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>📋</div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Profile Not Set Up</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Complete the questionnaire to get your personalized diet plan.</p>
                    <Link href="/onboarding"><button className="btn-primary"><span>🚀 Set Up Profile</span></button></Link>
                </div>
            ) : (
                <>
                    {/* Body Stats */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 20 }}>📏 Body Statistics</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
                            {[
                                { label: 'Age', value: `${profile.age} yrs`, icon: '🎂' },
                                { label: 'Gender', value: profile.gender, icon: '👤' },
                                { label: 'Height', value: `${profile.height_cm} cm`, icon: '📏' },
                                { label: 'Weight', value: `${profile.weight_kg} kg`, icon: '⚖️' },
                                { label: 'Target Weight', value: `${profile.target_weight_kg} kg`, icon: '🎯' },
                                { label: 'Body Type', value: profile.body_type, icon: '💪' },
                                { label: 'Job Type', value: profile.job_type?.replace('_', ' '), icon: '🏢' },
                                { label: 'Workout', value: `${profile.workout_frequency}x/wk`, icon: '🏋️' },
                                { label: 'Sleep', value: `${profile.sleep_hours} hrs`, icon: '😴' },
                                { label: 'Water', value: `${profile.water_intake_liters}L`, icon: '💧' },
                                { label: 'Diet Pref', value: profile.dietary_preference, icon: '🥗' },
                            ].map(item => (
                                <div key={item.label} style={{
                                    padding: '14px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 12,
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{item.icon} {item.label}</div>
                                    <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{item.value || '—'}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* BMI Card */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🧮 BMI Analysis</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center', minWidth: 120 }}>
                                <div style={{ fontSize: '3rem', fontWeight: 900, color: bmiInfo?.color }}>{bmi}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>BMI Index</div>
                                <div style={{ marginTop: 6 }}>
                                    <span className="badge" style={{ background: `${bmiInfo?.color}20`, color: bmiInfo?.color, border: `1px solid ${bmiInfo?.color}30` }}>
                                        {bmiInfo?.label}
                                    </span>
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                {[
                                    { range: '< 18.5', label: 'Underweight', color: '#ffd700', active: parseFloat(bmi!) < 18.5 },
                                    { range: '18.5 – 24.9', label: 'Normal Weight', color: '#00ff87', active: parseFloat(bmi!) >= 18.5 && parseFloat(bmi!) < 25 },
                                    { range: '25 – 29.9', label: 'Overweight', color: '#ff6b00', active: parseFloat(bmi!) >= 25 && parseFloat(bmi!) < 30 },
                                    { range: '≥ 30', label: 'Obese', color: '#ff006e', active: parseFloat(bmi!) >= 30 },
                                ].map(row => (
                                    <div key={row.label} style={{
                                        display: 'flex', gap: 12, alignItems: 'center',
                                        padding: '8px 12px', borderRadius: 8, marginBottom: 4,
                                        background: row.active ? `${row.color}15` : 'transparent',
                                        border: row.active ? `1px solid ${row.color}30` : '1px solid transparent',
                                    }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.82rem', color: row.active ? '#f0f4ff' : 'var(--text-muted)', fontWeight: row.active ? 700 : 400 }}>{row.label}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{row.range}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Nutrition Targets */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 20 }}>🎯 Calculated Nutrition Targets</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                            {[
                                { label: 'BMR', value: `${Math.round(profile.bmr)} kcal`, desc: 'Basal Metabolic Rate', color: '#a855f7', icon: '🫀' },
                                { label: 'TDEE', value: `${Math.round(profile.tdee)} kcal`, desc: 'Total Daily Energy', color: '#ff6b00', icon: '🔥' },
                                { label: 'Target Calories', value: `${Math.round(profile.target_calories)} kcal`, desc: 'Daily calorie goal', color: '#00d4ff', icon: '⚡' },
                                { label: 'Protein', value: `${Math.round(profile.target_protein_g)}g`, desc: `${(profile.target_protein_g / profile.weight_kg).toFixed(1)}g/kg body weight`, color: '#00d4ff', icon: '🥩' },
                                { label: 'Carbs', value: `${Math.round(profile.target_carbs_g)}g`, desc: 'Carbohydrate target', color: '#00ff87', icon: '🍞' },
                                { label: 'Fat', value: `${Math.round(profile.target_fat_g)}g`, desc: 'Healthy fat target', color: '#ffd700', icon: '🥑' },
                            ].map(t => (
                                <div key={t.label} style={{
                                    padding: '18px', borderRadius: 14,
                                    background: `${t.color}08`,
                                    border: `1px solid ${t.color}25`,
                                }}>
                                    <div style={{ fontSize: '1.3rem', marginBottom: 8 }}>{t.icon}</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: t.color, marginBottom: 4 }}>{t.value}</div>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2 }}>{t.label}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{t.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Weight Log */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>⚖️ Quick Weight Log</h3>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Today's Weight (kg)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder={`Current: ${profile.weight_kg} kg`}
                                    value={newWeight}
                                    onChange={e => setNewWeight(e.target.value)}
                                    step="0.1"
                                />
                            </div>
                            <motion.button
                                className="btn-primary"
                                onClick={handleLogWeight}
                                disabled={logWeightLoading || !newWeight}
                                whileHover={!logWeightLoading && !!newWeight ? { scale: 1.02 } : {}}
                                style={{ flexShrink: 0, opacity: !newWeight ? 0.6 : 1 }}
                            >
                                <span>{logWeightLoading ? '⏳' : '+ Log'}</span>
                            </motion.button>
                        </div>
                    </div>
                </>
            )
            }

            {/* Plan Info */}
            <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>💎 Subscription Plan</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    {[
                        { name: 'Free', emoji: '🌱', features: ['7-day meal plan', 'Basic macro tracking', 'Food database'], color: '#00ff87', current: user?.plan === 'free' },
                        { name: 'Pro', emoji: '⚡', features: ['Everything in Free', 'Weight trend analytics', 'AI nutrition tips', 'Unlimited food logs'], color: '#00d4ff', current: user?.plan === 'pro' },
                        { name: 'Premium', emoji: '👑', features: ['Everything in Pro', 'AI Chat coach', 'Barcode scanning', 'Priority support'], color: '#ffd700', current: user?.plan === 'premium' },
                    ].map(plan => (
                        <div key={plan.name} style={{
                            padding: '20px',
                            borderRadius: 16,
                            background: plan.current ? `${plan.color}10` : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${plan.current ? plan.color + '40' : 'rgba(255,255,255,0.06)'}`,
                        }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{plan.emoji}</div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: plan.color, marginBottom: 12 }}>
                                {plan.name} {plan.current && <span style={{ fontSize: '0.75rem', background: `${plan.color}20`, padding: '2px 8px', borderRadius: 999, marginLeft: 8 }}>Current</span>}
                            </div>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 0, listStyle: 'none' }}>
                                {plan.features.map(f => (
                                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                        <span style={{ color: plan.color, fontSize: '0.7rem' }}>✓</span>{f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
}
