'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { dietAPI } from '@/lib/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_ICONS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
const MEAL_COLORS: Record<string, string> = { breakfast: '#ffd700', lunch: '#00d4ff', dinner: '#a855f7', snack: '#00ff87' };

interface Meal {
    name: string; calories: number; protein: number; carbs: number; fat: number; description: string;
}
interface DayPlan {
    day: string;
    meals: { breakfast: Meal; lunch: Meal; dinner: Meal; snack: Meal };
    dayTotals: { calories: number; protein: number; carbs: number; fat: number };
}
interface PlanData {
    targetCalories: number; targetProtein: number; targetCarbs: number; targetFat: number;
    weeklyPlan: DayPlan[];
    tips: string[];
}

function MealCard({ type, meal, color }: { type: string; meal: Meal; color: string }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <motion.div
            onClick={() => setExpanded(!expanded)}
            whileHover={{ x: 4 }}
            style={{
                padding: '16px', borderRadius: 14, cursor: 'pointer',
                background: `linear-gradient(135deg, ${color}10, ${color}05)`,
                border: `1px solid ${color}25`,
                marginBottom: 10, transition: 'all 0.2s',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.3rem' }}>{MEAL_ICONS[type]}</span>
                    <div>
                        <div style={{ fontSize: '0.7rem', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{type}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{meal.name}</div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color, fontSize: '1rem' }}>{meal.calories} kcal</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g</div>
                </div>
            </div>
            {expanded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${color}20` }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>📋 {meal.description}</p>
                </motion.div>
            )}
        </motion.div>
    );
}

export default function MealPlanPage() {
    const [plan, setPlan] = useState<PlanData | null>(null);
    const [selectedDay, setSelectedDay] = useState(0);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const loadPlan = useCallback(async () => {
        try {
            const res = await dietAPI.getPlan();
            if (res.data.plan) {
                const planData = typeof res.data.plan.plan_data === 'string'
                    ? JSON.parse(res.data.plan.plan_data)
                    : res.data.plan.plan_data;
                setPlan(planData);
            }
        } catch {
            // Use demo data
            setPlan(getDemoPlan());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadPlan(); }, [loadPlan]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await dietAPI.generate();
            await loadPlan();
        } catch {
            setPlan(getDemoPlan());
        } finally {
            setGenerating(false);
        }
    };

    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="loader" /></div>;
    }

    if (!plan) {
        return (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
                <div style={{ fontSize: '4rem', marginBottom: 16 }}>📋</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>No Meal Plan Yet</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Complete your profile first, then generate your personalized 7-day plan.</p>
                <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
                    <span>{generating ? '⏳ Generating...' : '🚀 Generate My Plan'}</span>
                </button>
            </div>
        );
    }

    const dayPlan = plan.weeklyPlan?.[selectedDay];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Your 7-Day Meal Plan</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Target: <span style={{ color: '#00d4ff', fontWeight: 700 }}>{plan.targetCalories} kcal</span> ·
                        P:<span style={{ color: '#00d4ff' }}>{plan.targetProtein}g</span> ·
                        C:<span style={{ color: '#00ff87' }}>{plan.targetCarbs}g</span> ·
                        F:<span style={{ color: '#a855f7' }}>{plan.targetFat}g</span>
                    </p>
                </div>
                <motion.button
                    className="btn-secondary"
                    onClick={handleGenerate}
                    disabled={generating}
                    whileHover={{ scale: 1.02 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                    {generating ? '⏳ Regenerating...' : '🔄 Regenerate Plan'}
                </motion.button>
            </div>

            {/* Day Selector */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {DAYS.map((day, i) => (
                    <motion.button
                        key={day}
                        onClick={() => setSelectedDay(i)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                            flex: '0 0 auto',
                            padding: '10px 18px', borderRadius: 12, cursor: 'pointer',
                            border: `1px solid ${selectedDay === i ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.08)'}`,
                            background: selectedDay === i ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.03)',
                            color: selectedDay === i ? 'var(--neon-cyan)' : 'var(--text-muted)',
                            fontWeight: selectedDay === i ? 700 : 500,
                            fontSize: '0.85rem', transition: 'all 0.2s',
                            position: 'relative',
                        }}
                    >
                        {DAY_SHORT[i]}
                        {i === todayIndex && (
                            <div style={{
                                position: 'absolute', top: 4, right: 4,
                                width: 6, height: 6, borderRadius: '50%',
                                background: 'var(--neon-green)', boxShadow: '0 0 6px var(--neon-green)',
                            }} />
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Day Totals */}
            {dayPlan && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                    {[
                        { label: 'Total Calories', value: dayPlan.dayTotals.calories, unit: 'kcal', color: '#00d4ff' },
                        { label: 'Protein', value: dayPlan.dayTotals.protein, unit: 'g', color: '#00d4ff' },
                        { label: 'Carbs', value: dayPlan.dayTotals.carbs, unit: 'g', color: '#00ff87' },
                        { label: 'Fat', value: dayPlan.dayTotals.fat, unit: 'g', color: '#a855f7' },
                    ].map(s => (
                        <div key={s.label} style={{
                            textAlign: 'center', padding: '14px',
                            background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: s.color }}>{s.value}{s.unit}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Meals */}
            {dayPlan && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                    {Object.entries(dayPlan.meals).map(([type, meal]) => (
                        <div key={type} className="glass-card" style={{ padding: 20 }}>
                            <MealCard type={type} meal={meal as Meal} color={MEAL_COLORS[type]} />
                        </div>
                    ))}
                </div>
            )}

            {/* Tips */}
            {plan.tips && (
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🧠 Plan Tips</h3>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {plan.tips.slice(0, 4).map((tip, i) => (
                            <li key={i} style={{ display: 'flex', gap: 10, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                <span style={{ color: 'var(--neon-cyan)', flexShrink: 0 }}>→</span>
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function getDemoPlan(): PlanData {
    return {
        targetCalories: 2200, targetProtein: 165, targetCarbs: 242, targetFat: 73,
        tips: ['Eat protein with every meal.', 'Drink 8-10 glasses of water daily.', 'Never skip breakfast.'],
        weeklyPlan: DAYS.map(day => ({
            day,
            meals: {
                breakfast: { name: 'Scrambled Eggs & Whole Wheat Toast', calories: 380, protein: 24, carbs: 32, fat: 14, description: '3 eggs, 2 slices whole wheat toast, 1 tsp butter' },
                lunch: { name: 'Grilled Chicken with Rice & Veggies', calories: 520, protein: 45, carbs: 48, fat: 10, description: '200g chicken breast, 1 cup brown rice, mixed vegetables' },
                dinner: { name: 'Grilled Chicken with Salad', calories: 380, protein: 42, carbs: 18, fat: 12, description: '180g grilled chicken, mixed greens, olive oil' },
                snack: { name: 'Boiled Eggs & Nuts', calories: 200, protein: 16, carbs: 4, fat: 14, description: '2 boiled eggs, 10 almonds' },
            },
            dayTotals: { calories: 1480, protein: 127, carbs: 102, fat: 50 },
        })),
    };
}
