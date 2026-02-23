'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { profileAPI, dietAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const STEPS = ['Personal Info', 'Body Type', 'Activity', 'Goal & Diet', 'Review'];

const GOALS = [
    { value: 'fat_loss', label: 'Fat Loss', emoji: '🔥', desc: '500 kcal deficit', color: '#ff6b00' },
    { value: 'muscle_gain', label: 'Muscle Gain', emoji: '💪', desc: '300 kcal surplus', color: '#00d4ff' },
    { value: 'lean_body', label: 'Lean Body', emoji: '⚡', desc: 'Body recomp', color: '#a855f7' },
    { value: 'good_physique', label: 'Good Physique', emoji: '🏆', desc: '200 kcal deficit', color: '#ffd700' },
    { value: 'maintenance', label: 'Maintenance', emoji: '⚖️', desc: 'Maintain weight', color: '#00ff87' },
];

const BODY_TYPES = [
    { value: 'ectomorph', label: 'Ectomorph', emoji: '🦒', desc: 'Lean & long, difficulty gaining weight' },
    { value: 'mesomorph', label: 'Mesomorph', emoji: '💎', desc: 'Athletic, gains muscle easily' },
    { value: 'endomorph', label: 'Endomorph', emoji: '🐻', desc: 'Stocky, easy fat gain' },
];

const JOB_TYPES = [
    { value: 'sedentary', label: 'Sedentary', emoji: '💻', desc: 'Desk job, mostly sitting' },
    { value: 'light', label: 'Light Active', emoji: '🚶', desc: 'Some walking during day' },
    { value: 'moderate', label: 'Moderate', emoji: '🏃', desc: 'On feet most of the day' },
    { value: 'active', label: 'Active', emoji: '⚒️', desc: 'Physical labor, always moving' },
];

const DIET_PREFS = [
    { value: 'none', label: 'No Preference', emoji: '🍽️' },
    { value: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
    { value: 'vegan', label: 'Vegan', emoji: '🌱' },
    { value: 'keto', label: 'Keto', emoji: '🥑' },
];

export default function OnboardingPage() {
    const { user, updateUser } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        age: '', gender: 'male', height_cm: '', weight_kg: '', target_weight_kg: '',
        body_type: '', job_type: '', workout_frequency: '3', sleep_hours: '7',
        water_intake_liters: '2.5', goal: '', dietary_preference: 'none',
    });

    const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

    const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
    const prev = () => setStep(s => Math.max(s - 1, 0));

    const canProceed = () => {
        if (step === 0) return form.age && form.height_cm && form.weight_kg && form.gender;
        if (step === 1) return !!form.body_type;
        if (step === 2) return !!form.job_type;
        if (step === 3) return !!form.goal;
        return true;
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await profileAPI.save({
                ...form,
                age: parseInt(form.age),
                height_cm: parseFloat(form.height_cm),
                weight_kg: parseFloat(form.weight_kg),
                target_weight_kg: parseFloat(form.target_weight_kg || form.weight_kg),
                workout_frequency: parseInt(form.workout_frequency),
                sleep_hours: parseFloat(form.sleep_hours),
                water_intake_liters: parseFloat(form.water_intake_liters),
            });

            // Generate diet plan
            await dietAPI.generate(res.data.profile);

            updateUser({ profileCompleted: true });
            toast.success('Profile set up! Your plan is ready 🎉');
            router.push('/dashboard');
        } catch {
            toast.error('Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const progress = ((step + 1) / STEPS.length) * 100;

    const slideVariants = {
        enter: { x: 60, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -60, opacity: 0 },
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
            <div style={{ width: '100%', maxWidth: 640 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 4 }}>
                        🎯 Build Your <span className="gradient-text">Personalized Plan</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {user?.name ? `Hey ${user.name},` : ''} Answer a few questions to get your AI diet plan
                    </p>
                </div>

                {/* Step Indicators */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24, alignItems: 'center' }}>
                    {STEPS.map((s, i) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                            <div
                                className={`step-indicator ${i < step ? 'completed' : i === step ? 'active' : ''}`}
                                style={{ fontSize: '0.8rem' }}
                            >
                                {i < step ? '✓' : i + 1}
                            </div>
                            {i < STEPS.length - 1 && (
                                <div style={{ width: 32, height: 2, background: i < step ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)', margin: '0 4px', borderRadius: 1, transition: 'background 0.3s' }} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Progress Bar */}
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 32, overflow: 'hidden' }}>
                    <motion.div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #00d4ff, #00ff87)' }}
                        animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
                </div>

                {/* Step Content */}
                <div className="glass-card" style={{ padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 32px)', minHeight: 360 }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                        >
                            {/* STEP 0: Personal Info */}
                            {step === 0 && (
                                <div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Personal Information</h2>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.9rem' }}>Used for accurate BMR calculation</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Age <span style={{ color: 'var(--neon-cyan)' }}>*</span></label>
                                            <input id="age" type="number" className="input-field" placeholder="e.g. 25" min="10" max="80"
                                                value={form.age} onChange={e => update('age', e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Gender <span style={{ color: 'var(--neon-cyan)' }}>*</span></label>
                                            <select id="gender" className="input-field" value={form.gender}
                                                onChange={e => update('gender', e.target.value)}
                                                style={{ background: 'rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                                                <option value="male" style={{ background: '#0a0f1e' }}>Male</option>
                                                <option value="female" style={{ background: '#0a0f1e' }}>Female</option>
                                                <option value="other" style={{ background: '#0a0f1e' }}>Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Height (cm) <span style={{ color: 'var(--neon-cyan)' }}>*</span></label>
                                            <input id="height" type="number" className="input-field" placeholder="e.g. 175" min="100" max="250"
                                                value={form.height_cm} onChange={e => update('height_cm', e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Weight (kg) <span style={{ color: 'var(--neon-cyan)' }}>*</span></label>
                                            <input id="weight" type="number" className="input-field" placeholder="e.g. 75" min="30" max="250"
                                                value={form.weight_kg} onChange={e => update('weight_kg', e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Target Weight (kg)</label>
                                            <input id="target-weight" type="number" className="input-field" placeholder="e.g. 70" min="30" max="250"
                                                value={form.target_weight_kg} onChange={e => update('target_weight_kg', e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Sleep (hours/night)</label>
                                            <input id="sleep" type="number" className="input-field" placeholder="e.g. 7" min="4" max="12" step="0.5"
                                                value={form.sleep_hours} onChange={e => update('sleep_hours', e.target.value)} />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 16 }}>
                                        <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Daily Water Intake (litres)</label>
                                        <input id="water" type="number" className="input-field" placeholder="e.g. 2.5" min="0.5" max="10" step="0.5"
                                            value={form.water_intake_liters} onChange={e => update('water_intake_liters', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* STEP 1: Body Type */}
                            {step === 1 && (
                                <div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Your Body Type</h2>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.9rem' }}>Helps us understand your metabolic tendencies</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        {BODY_TYPES.map(bt => (
                                            <div
                                                key={bt.value}
                                                id={`body-${bt.value}`}
                                                className={`option-card ${form.body_type === bt.value ? 'selected' : ''}`}
                                                style={{ display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left' }}
                                                onClick={() => update('body_type', bt.value)}
                                            >
                                                <span style={{ fontSize: '2rem' }}>{bt.emoji}</span>
                                                <div>
                                                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{bt.label}</div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{bt.desc}</div>
                                                </div>
                                                {form.body_type === bt.value && (
                                                    <div style={{ marginLeft: 'auto', color: 'var(--neon-cyan)', fontSize: '1.2rem' }}>✓</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Activity Level */}
                            {step === 2 && (
                                <div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Activity Level</h2>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>Used to calculate your TDEE (activity multiplier)</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
                                        {JOB_TYPES.map(jt => (
                                            <div
                                                key={jt.value}
                                                id={`job-${jt.value}`}
                                                className={`option-card ${form.job_type === jt.value ? 'selected' : ''}`}
                                                onClick={() => update('job_type', jt.value)}
                                            >
                                                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{jt.emoji}</div>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{jt.label}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{jt.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 12, fontSize: '0.9rem', fontWeight: 600 }}>
                                            Workout Days per Week: <span style={{ color: 'var(--neon-cyan)', fontWeight: 800 }}>{form.workout_frequency}</span>
                                        </label>
                                        <input id="workout-freq" type="range" min="0" max="7" step="1"
                                            value={form.workout_frequency}
                                            onChange={e => update('workout_frequency', e.target.value)}
                                            style={{ width: '100%', accentColor: '#00d4ff', cursor: 'pointer' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>
                                            <span>0 (None)</span><span>3-4 (Moderate)</span><span>7 (Daily)</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Goal & Diet */}
                            {step === 3 && (
                                <div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Your Goal & Diet</h2>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.9rem' }}>This determines your calorie target and meal plan style</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                                        {GOALS.map(g => (
                                            <div
                                                key={g.value}
                                                id={`goal-${g.value}`}
                                                className={`option-card ${form.goal === g.value ? 'selected' : ''}`}
                                                onClick={() => update('goal', g.value)}
                                                style={{ borderColor: form.goal === g.value ? g.color : undefined }}
                                            >
                                                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{g.emoji}</div>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{g.label}</div>
                                                <div style={{ color: g.color, fontSize: '0.78rem', fontWeight: 600 }}>{g.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 12, fontSize: '0.9rem', fontWeight: 600 }}>Dietary Preference</label>
                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            {DIET_PREFS.map(dp => (
                                                <div
                                                    key={dp.value}
                                                    id={`diet-${dp.value}`}
                                                    onClick={() => update('dietary_preference', dp.value)}
                                                    style={{
                                                        padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
                                                        border: `1px solid ${form.dietary_preference === dp.value ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.1)'}`,
                                                        background: form.dietary_preference === dp.value ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                                                        fontSize: '0.85rem', fontWeight: 500,
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    {dp.emoji} {dp.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Review */}
                            {step === 4 && (
                                <div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Review Your Profile</h2>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>Everything looks good? We'll generate your personalized plan!</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
                                        {[
                                            { label: 'Age', value: `${form.age} years`, icon: '🎂' },
                                            { label: 'Gender', value: form.gender, icon: '👤' },
                                            { label: 'Height', value: `${form.height_cm} cm`, icon: '📏' },
                                            { label: 'Weight', value: `${form.weight_kg} kg`, icon: '⚖️' },
                                            { label: 'Body Type', value: form.body_type, icon: '💪' },
                                            { label: 'Job Type', value: form.job_type, icon: '🏢' },
                                            { label: 'Workout', value: `${form.workout_frequency}x/week`, icon: '🏋️' },
                                            { label: 'Goal', value: GOALS.find(g => g.value === form.goal)?.label || '', icon: '🎯' },
                                            { label: 'Diet', value: form.dietary_preference, icon: '🥗' },
                                            { label: 'Sleep', value: `${form.sleep_hours} hrs`, icon: '😴' },
                                        ].map(item => (
                                            <div key={item.label} style={{
                                                padding: '14px 16px', borderRadius: 12,
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                            }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{item.icon} {item.label}</div>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem', textTransform: 'capitalize' }}>{item.value || '—'}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{
                                        padding: '16px 20px', borderRadius: 12,
                                        background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,255,135,0.05))',
                                        border: '1px solid rgba(0,212,255,0.2)',
                                    }}>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', fontWeight: 600, marginBottom: 4 }}>🧠 AI will calculate for you:</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>BMR → TDEE → Target Calories → Macros (Protein, Carbs, Fat) → 7-Day Meal Plan</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
                    <button
                        className="btn-secondary"
                        onClick={prev}
                        disabled={step === 0}
                        style={{ opacity: step === 0 ? 0.4 : 1, flex: 1 }}
                    >
                        ← Back
                    </button>
                    {step < STEPS.length - 1 ? (
                        <motion.button
                            className="btn-primary"
                            onClick={next}
                            disabled={!canProceed()}
                            whileHover={canProceed() ? { scale: 1.02 } : {}}
                            style={{ flex: 2, opacity: canProceed() ? 1 : 0.5 }}
                        >
                            <span>Continue →</span>
                        </motion.button>
                    ) : (
                        <motion.button
                            id="generate-plan-btn"
                            className="btn-primary"
                            onClick={handleSubmit}
                            disabled={loading}
                            whileHover={!loading ? { scale: 1.02 } : {}}
                            style={{ flex: 2, opacity: loading ? 0.7 : 1 }}
                        >
                            <span>{loading ? '⏳ Generating Plan...' : '🚀 Generate My Plan!'}</span>
                        </motion.button>
                    )}
                </div>

                <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Step {step + 1} of {STEPS.length} — {STEPS[step]}
                </p>
            </div>
        </div>
    );
}
