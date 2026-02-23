'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logsAPI, nutritionAPI, dietAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface FoodLog { id: string; food_name: string; quantity_g: number; meal_type: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; created_at: string; }
interface FoodItem { id: string; name: string; calories_per_100g: number; protein_per_100g: number; carbs_per_100g: number; fat_per_100g: number; }
interface Summary { targets: { calories: number; protein: number; carbs: number; fat: number }; consumed: { calories: number; protein: number; carbs: number; fat: number }; }

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];
const MEAL_ICONS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎', pre_workout: '⚡', post_workout: '💪' };
const MEAL_COLORS: Record<string, string> = { breakfast: '#ffd700', lunch: '#00d4ff', dinner: '#a855f7', snack: '#00ff87', pre_workout: '#ff6b00', post_workout: '#ff006e' };

export default function FoodLogPage() {
    const [logs, setLogs] = useState<FoodLog[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
    const [quantity, setQuantity] = useState('100');
    const [mealType, setMealType] = useState('lunch');
    const [customFood, setCustomFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    const [showCustom, setShowCustom] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'search' | 'custom'>('search');
    const today = new Date().toISOString().split('T')[0];

    const loadData = useCallback(async () => {
        try {
            const [logsRes, summaryRes] = await Promise.all([logsAPI.get(), dietAPI.getSummary()]);
            setLogs(logsRes.data.logs);
            setSummary(summaryRes.data);
        } catch {
            setSummary({ targets: { calories: 2200, protein: 165, carbs: 242, fat: 73 }, consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 } });
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSearch = async (q: string) => {
        setSearchQuery(q);
        if (q.length < 2) { setSearchResults([]); return; }
        try {
            const res = await nutritionAPI.search(q);
            setSearchResults(res.data.foods || []);
        } catch {
            // Demo foods
            const demo = [
                { id: '1', name: 'Chicken Breast', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6 },
                { id: '2', name: 'Brown Rice', calories_per_100g: 123, protein_per_100g: 2.6, carbs_per_100g: 26, fat_per_100g: 0.9 },
                { id: '3', name: 'Egg', calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11 },
                { id: '4', name: 'Banana', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3 },
                { id: '5', name: 'Almonds', calories_per_100g: 579, protein_per_100g: 21, carbs_per_100g: 22, fat_per_100g: 50 },
                { id: '6', name: 'Paneer', calories_per_100g: 265, protein_per_100g: 18.3, carbs_per_100g: 1.2, fat_per_100g: 20 },
                { id: '7', name: 'Oats', calories_per_100g: 389, protein_per_100g: 17, carbs_per_100g: 66, fat_per_100g: 7 },
            ].filter(f => f.name.toLowerCase().includes(q.toLowerCase()));
            setSearchResults(demo);
        }
    };

    const getCalculated = (food: FoodItem, qty: number) => {
        const factor = qty / 100;
        return {
            calories: Math.round(food.calories_per_100g * factor),
            protein: Math.round(food.protein_per_100g * factor * 10) / 10,
            carbs: Math.round(food.carbs_per_100g * factor * 10) / 10,
            fat: Math.round(food.fat_per_100g * factor * 10) / 10,
        };
    };

    const handleAddFood = async () => {
        if (!selectedFood) return;
        const qty = parseFloat(quantity);
        const calc = getCalculated(selectedFood, qty);
        setLoading(true);
        try {
            await logsAPI.add({
                food_name: selectedFood.name,
                quantity_g: qty,
                meal_type: mealType,
                ...calc,
            });
            toast.success(`✅ ${selectedFood.name} logged!`);
            setSelectedFood(null);
            setSearchQuery('');
            setSearchResults([]);
            loadData();
        } catch {
            toast.error('Failed to log food.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustom = async () => {
        if (!customFood.name) { toast.error('Please enter a food name.'); return; }
        setLoading(true);
        try {
            await logsAPI.add({
                food_name: customFood.name,
                quantity_g: 100,
                meal_type: mealType,
                calories: parseFloat(customFood.calories) || 0,
                protein_g: parseFloat(customFood.protein) || 0,
                carbs_g: parseFloat(customFood.carbs) || 0,
                fat_g: parseFloat(customFood.fat) || 0,
            });
            toast.success(`✅ ${customFood.name} logged!`);
            setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '' });
            loadData();
        } catch {
            toast.error('Failed to log food.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await logsAPI.delete(id);
            toast.success('Entry removed.');
            loadData();
        } catch { toast.error('Failed to delete.'); }
    };

    const targets = summary?.targets || { calories: 2000, protein: 150, carbs: 200, fat: 65 };
    const consumed = summary?.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0 };

    // Group logs by meal type
    const grouped = MEAL_TYPES.reduce((acc, mt) => {
        acc[mt] = logs.filter(l => l.meal_type === mt);
        return acc;
    }, {} as Record<string, FoodLog[]>);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>🍽️ Food Log</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                {[
                    { label: 'Calories', consumed: consumed.calories, target: targets.calories, unit: 'kcal', color: '#00d4ff' },
                    { label: 'Protein', consumed: consumed.protein, target: targets.protein, unit: 'g', color: '#00d4ff' },
                    { label: 'Carbs', consumed: consumed.carbs, target: targets.carbs, unit: 'g', color: '#00ff87' },
                    { label: 'Fat', consumed: consumed.fat, target: targets.fat, unit: 'g', color: '#a855f7' },
                ].map(m => {
                    const pct = Math.min((m.consumed / Math.max(m.target, 1)) * 100, 100);
                    const over = m.consumed > m.target;
                    return (
                        <div key={m.label} style={{
                            padding: '14px 16px', borderRadius: 14,
                            background: 'rgba(255,255,255,0.03)',
                            border: `1px solid ${over ? 'rgba(255,0,110,0.3)' : 'rgba(255,255,255,0.07)'}`,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{m.label}</span>
                                {over && <span style={{ fontSize: '0.7rem', color: '#ff006e' }}>Over!</span>}
                            </div>
                            <div style={{ fontWeight: 800, color: over ? '#ff006e' : m.color, fontSize: '1.1rem' }}>
                                {Math.round(m.consumed)}{m.unit}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>of {m.target}{m.unit}</div>
                            <div className="macro-bar">
                                <motion.div className="macro-bar-fill"
                                    style={{ background: over ? '#ff006e' : m.color, width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="two-col-layout">
                {/* Log Food Panel */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 20 }}>+ Add Food</h3>

                    {/* Mode Toggle */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                        {['search', 'custom'].map(m => (
                            <button key={m} onClick={() => setMode(m as 'search' | 'custom')}
                                style={{
                                    flex: 1, padding: '8px 14px', borderRadius: 10,
                                    border: `1px solid ${mode === m ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.08)'}`,
                                    background: mode === m ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                                    color: mode === m ? 'var(--neon-cyan)' : 'var(--text-muted)',
                                    cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                                }}>
                                {m === 'search' ? '🔍 Search' : '✏️ Custom'}
                            </button>
                        ))}
                    </div>

                    {/* Meal Type */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Meal Type</label>
                        <select id="meal-type-select" className="input-field" value={mealType} onChange={e => setMealType(e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                            {MEAL_TYPES.map(mt => (
                                <option key={mt} value={mt} style={{ background: '#0a0f1e' }}>
                                    {MEAL_ICONS[mt]} {mt.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </option>
                            ))}
                        </select>
                    </div>

                    {mode === 'search' ? (
                        <>
                            {/* Search */}
                            <div style={{ marginBottom: 16 }}>
                                <input
                                    id="food-search"
                                    type="text"
                                    className="input-field"
                                    placeholder="Search food (e.g., chicken, rice...)"
                                    value={searchQuery}
                                    onChange={e => handleSearch(e.target.value)}
                                />
                            </div>

                            {/* Results */}
                            {searchResults.length > 0 && !selectedFood && (
                                <div style={{
                                    borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                                    overflow: 'hidden', marginBottom: 16, maxHeight: 220, overflowY: 'auto',
                                }}>
                                    {searchResults.map(food => (
                                        <div key={food.id} onClick={() => { setSelectedFood(food); setSearchQuery(food.name); setSearchResults([]); }}
                                            style={{
                                                padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                transition: 'background 0.2s', display: 'flex', justifyContent: 'space-between',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,255,0.08)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{food.name}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{food.calories_per_100g} kcal/100g</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Selected Food */}
                            {selectedFood && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 16 }}>
                                    <div style={{
                                        padding: '14px 16px', borderRadius: 12,
                                        background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
                                        marginBottom: 12,
                                    }}>
                                        <div style={{ fontWeight: 700, marginBottom: 4 }}>✅ {selectedFood.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {selectedFood.calories_per_100g} kcal · P:{selectedFood.protein_per_100g}g · C:{selectedFood.carbs_per_100g}g · F:{selectedFood.fat_per_100g}g (per 100g)
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Quantity (grams)</label>
                                            <input id="food-quantity" type="number" className="input-field" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" />
                                        </div>
                                        <div style={{
                                            padding: '10px 14px', borderRadius: 10,
                                            background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.12)',
                                            fontSize: '0.8rem', lineHeight: 1.8,
                                        }}>
                                            {(() => { const c = getCalculated(selectedFood, parseFloat(quantity) || 100); return `${c.calories}kcal | P:${c.protein}g C:${c.carbs}g F:${c.fat}g`; })()}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <motion.button
                                id="log-food-btn"
                                className="btn-primary"
                                onClick={handleAddFood}
                                disabled={!selectedFood || loading}
                                whileHover={selectedFood && !loading ? { scale: 1.02 } : {}}
                                style={{ width: '100%', opacity: !selectedFood || loading ? 0.5 : 1 }}
                            >
                                <span>{loading ? '⏳ Logging...' : '+ Log Food'}</span>
                            </motion.button>
                        </>
                    ) : (
                        <>
                            {/* Custom Food Form */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <input className="input-field" placeholder="Food name *" value={customFood.name} onChange={e => setCustomFood({ ...customFood, name: e.target.value })} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <input className="input-field" placeholder="Calories (kcal)" type="number" value={customFood.calories} onChange={e => setCustomFood({ ...customFood, calories: e.target.value })} />
                                    <input className="input-field" placeholder="Protein (g)" type="number" value={customFood.protein} onChange={e => setCustomFood({ ...customFood, protein: e.target.value })} />
                                    <input className="input-field" placeholder="Carbs (g)" type="number" value={customFood.carbs} onChange={e => setCustomFood({ ...customFood, carbs: e.target.value })} />
                                    <input className="input-field" placeholder="Fat (g)" type="number" value={customFood.fat} onChange={e => setCustomFood({ ...customFood, fat: e.target.value })} />
                                </div>
                                <motion.button className="btn-primary" onClick={handleAddCustom} disabled={loading} whileHover={!loading ? { scale: 1.02 } : {}} style={{ width: '100%' }}>
                                    <span>{loading ? '⏳ Logging...' : '+ Add Custom Food'}</span>
                                </motion.button>
                            </div>
                        </>
                    )}
                </div>

                {/* Today's Log */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 20 }}>📋 Today's Log</h3>
                    {logs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🍽️</div>
                            <p>No food logged today yet. Start tracking to reach your goal!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {MEAL_TYPES.filter(mt => grouped[mt]?.length > 0).map(mt => (
                                <div key={mt}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                        <span style={{ fontSize: '1.1rem' }}>{MEAL_ICONS[mt]}</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: MEAL_COLORS[mt], textTransform: 'uppercase', letterSpacing: '0.08em' }}>{mt.replace('_', ' ')}</span>
                                    </div>
                                    {grouped[mt].map(log => (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '10px 14px', borderRadius: 10, marginBottom: 6,
                                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{log.food_name} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({log.quantity_g}g)</span></div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                    {log.calories}kcal · P:{log.protein_g}g · C:{log.carbs_g}g · F:{log.fat_g}g
                                                </div>
                                            </div>
                                            <button onClick={() => handleDelete(log.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,0,110,0.5)', fontSize: '1rem', padding: '4px' }}>
                                                🗑️
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
