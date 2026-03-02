'use client';
import { useState, useEffect, useCallback } from 'react';
import { profileAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ChevronRight, User, Target, Activity, Zap, Scale, LogOut } from 'lucide-react';

interface Profile {
    age: number; gender: string; height_cm: number; weight_kg: number; body_type: string;
    job_type: string; workout_frequency: number; sleep_hours: number; water_intake_liters: number;
    goal: string; dietary_preference: string; target_weight_kg: number;
    bmr: number; tdee: number; target_calories: number; target_protein_g: number;
    target_carbs_g: number; target_fat_g: number; profile_completed: boolean;
}

const GOAL_LABELS: Record<string, string> = {
    fat_loss: 'Fat Loss', muscle_gain: 'Muscle Gain', lean_body: 'Lean Body',
    good_physique: 'Good Physique', maintenance: 'Maintenance',
};

const row = (label: string, value: string) => (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{label}</span>
        <span style={{ fontWeight: 500, color: '#0f172a', textTransform: 'capitalize' }}>{value || '—'}</span>
    </div>
);

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [newWeight, setNewWeight] = useState('');
    const [saving, setSaving] = useState(false);

    const loadProfile = useCallback(async () => {
        try {
            const res = await profileAPI.get();
            setProfile(res.data.profile);
        } catch { setProfile(null); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    const handleLogWeight = async () => {
        if (!newWeight) return;
        setSaving(true);
        try {
            await profileAPI.logWeight({ weight_kg: parseFloat(newWeight) });
            toast.success('Weight updated!');
            setNewWeight('');
            loadProfile();
        } catch { toast.error('Failed to log weight.'); }
        finally { setSaving(false); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="loader" style={{ borderColor: '#e2e8f0', borderTopColor: '#3b82f6' }} /></div>;

    const bmi = profile ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1) : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <div className="header-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</div>
                <div style={{ fontSize: '2.4rem', fontWeight: 300, color: '#1e293b' }}>Profile</div>
            </div>

            {/* User Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, padding: '20px', background: '#f8fafc', borderRadius: 16 }}>
                <div style={{
                    width: 56, height: 56, borderRadius: '50%', background: '#0f172a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '1.4rem', color: '#fff', flexShrink: 0,
                }}>
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#0f172a' }}>{user?.name}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{user?.email}</div>
                    {profile?.goal && <div style={{ marginTop: 4, fontSize: '0.75rem', background: '#eff6ff', color: '#3b82f6', padding: '2px 10px', borderRadius: 999, display: 'inline-block', fontWeight: 500 }}>{GOAL_LABELS[profile.goal] || profile.goal}</div>}
                </div>
            </div>

            {!profile ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', background: '#f8fafc', borderRadius: 16 }}>
                    <User size={48} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: 16 }} />
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 8, color: '#0f172a' }}>No Profile Yet</div>
                    <div style={{ color: '#94a3b8', marginBottom: 24, fontSize: '0.9rem' }}>Complete your profile to get personalized targets.</div>
                    <Link href="/onboarding"><button className="btn-primary">Set Up Profile</button></Link>
                </div>
            ) : (
                <>
                    {/* Body Stats Section */}
                    <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 12 }}>BODY STATS</div>
                        {row('Age', `${profile.age} years`)}
                        {row('Gender', profile.gender)}
                        {row('Height', `${profile.height_cm} cm`)}
                        {row('Current Weight', `${profile.weight_kg} kg`)}
                        {row('Target Weight', `${profile.target_weight_kg} kg`)}
                        {row('BMI', bmi || '—')}
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '24px 0' }} />

                    {/* Lifestyle Section */}
                    <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 12 }}>LIFESTYLE</div>
                        {row('Job Type', profile.job_type?.replace('_', ' '))}
                        {row('Workouts / Week', `${profile.workout_frequency}x`)}
                        {row('Sleep', `${profile.sleep_hours} hours`)}
                        {row('Water Intake', `${profile.water_intake_liters} L`)}
                        {row('Diet Preference', profile.dietary_preference)}
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '24px 0' }} />

                    {/* Nutrition Targets */}
                    <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 12 }}>NUTRITION TARGETS</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                            {[
                                { label: 'Calories', value: `${Math.round(profile.target_calories)} kcal` },
                                { label: 'Protein', value: `${Math.round(profile.target_protein_g)}g` },
                                { label: 'Carbs', value: `${Math.round(profile.target_carbs_g)}g` },
                                { label: 'Fat', value: `${Math.round(profile.target_fat_g)}g` },
                            ].map(t => (
                                <div key={t.label} style={{ background: '#f8fafc', borderRadius: 12, padding: '16px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 }}>{t.label}</div>
                                    <div style={{ fontWeight: 500, fontSize: '1.1rem', color: '#0f172a' }}>{t.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '24px 0' }} />

                    {/* Log Weight */}
                    <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 16 }}>LOG WEIGHT</div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <input
                                type="number" step="0.1" placeholder={`Current: ${profile.weight_kg} kg`}
                                className="input-field" value={newWeight}
                                onChange={e => setNewWeight(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button className="btn-primary" onClick={handleLogWeight} disabled={saving || !newWeight}
                                style={{ padding: '14px 24px', opacity: !newWeight ? 0.5 : 1 }}>
                                {saving ? '...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '24px 0' }} />

            {/* Actions */}
            <Link href="/onboarding" style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', cursor: 'pointer' }}>
                    <span style={{ fontWeight: 500, color: '#0f172a' }}>Edit Profile</span>
                    <ChevronRight size={18} color="#94a3b8" />
                </div>
            </Link>
            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9' }} />
            <div onClick={logout} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', cursor: 'pointer' }}>
                <span style={{ fontWeight: 500, color: '#ef4444' }}>Sign Out</span>
                <LogOut size={18} color="#ef4444" />
            </div>

            <div style={{ height: 40 }} />
        </div>
    );
}
