const express = require('express');
const router = express.Router();
const supabase = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { generateWeeklyMealPlan, generateNutritionTips } = require('../utils/nutritionEngine');

/* ─── POST /api/diet/generate ────────────────────────────── */
router.post('/generate', authenticate, async (req, res) => {
    try {
        const { userId } = req.user;

        // Fetch profile
        const { data: profile, error: pErr } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (pErr || !profile)
            return res.status(404).json({ error: 'Profile not found. Please complete your profile first.' });

        const planData = generateWeeklyMealPlan(
            {
                targetCalories: profile.target_calories,
                targetProtein: profile.target_protein_g,
                targetCarbs: profile.target_carbs_g,
                targetFat: profile.target_fat_g,
            },
            profile.goal,
            profile.dietary_preference || 'none',
        );

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
        const weekStartDate = weekStart.toISOString().split('T')[0];

        // Deactivate old plans
        await supabase
            .from('weekly_diet_plans')
            .update({ is_active: false })
            .eq('user_id', userId);

        // Insert new plan
        const { data: plan, error: planErr } = await supabase
            .from('weekly_diet_plans')
            .insert({
                user_id: userId,
                week_start_date: weekStartDate,
                goal: profile.goal,
                target_calories: profile.target_calories,
                plan_data: planData,
                is_active: true,
            })
            .select()
            .single();

        if (planErr) throw planErr;

        return res.status(201).json({ message: 'Meal plan generated!', plan });
    } catch (err) {
        console.error('Generate plan error:', err.message);
        res.status(500).json({ error: 'Failed to generate meal plan.' });
    }
});

/* ─── GET /api/diet/plan ─────────────────────────────────── */
router.get('/plan', authenticate, async (req, res) => {
    try {
        const { userId } = req.user;
        const { data: plan, error } = await supabase
            .from('weekly_diet_plans')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return res.json({ plan: plan || null });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch meal plan.' });
    }
});

/* ─── GET /api/diet/summary ──────────────────────────────── */
router.get('/summary', authenticate, async (req, res) => {
    try {
        const { userId } = req.user;
        const today = new Date().toISOString().split('T')[0];

        // Profile targets
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('goal, bmr, tdee, target_calories, target_protein_g, target_carbs_g, target_fat_g')
            .eq('user_id', userId)
            .maybeSingle();

        // Today's logs aggregate
        const { data: logs } = await supabase
            .from('daily_logs')
            .select('calories, protein_g, carbs_g, fat_g')
            .eq('user_id', userId)
            .eq('log_date', today);

        const consumed = (logs || []).reduce(
            (a, l) => ({
                calories: a.calories + (l.calories || 0),
                protein: a.protein + (l.protein_g || 0),
                carbs: a.carbs + (l.carbs_g || 0),
                fat: a.fat + (l.fat_g || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 },
        );

        return res.json({
            date: today,
            targets: profile
                ? {
                    calories: profile.target_calories, protein: profile.target_protein_g,
                    carbs: profile.target_carbs_g, fat: profile.target_fat_g,
                    goal: profile.goal, bmr: profile.bmr, tdee: profile.tdee,
                }
                : { calories: 2000, protein: 150, carbs: 200, fat: 65, goal: 'maintenance', bmr: 1600, tdee: 2000 },
            consumed,
        });
    } catch (err) {
        console.error('Summary error:', err.message);
        res.status(500).json({ error: 'Failed to fetch summary.' });
    }
});

/* ─── GET /api/diet/tips ─────────────────────────────────── */
router.get('/tips', authenticate, async (req, res) => {
    try {
        const { userId } = req.user;
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('goal, dietary_preference')
            .eq('user_id', userId)
            .maybeSingle();

        const tips = generateNutritionTips(profile?.goal, profile?.dietary_preference);
        return res.json({ tips });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tips.' });
    }
});

module.exports = router;
