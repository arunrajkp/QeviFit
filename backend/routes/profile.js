const express = require('express');
const router = express.Router();
const supabase = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { calculateNutrition } = require('../utils/nutritionEngine');

/* ─── GET /api/profile ────────────────────────────────────── */
router.get('/', authenticate, async (req, res) => {
    try {
        const { userId } = req.user;
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        return res.json({ profile: profile || null });
    } catch (err) {
        console.error('Get profile error:', err.message);
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
});

/* ─── POST /api/profile ───────────────────────────────────── */
router.post('/', authenticate, async (req, res) => {
    try {
        const { userId } = req.user;
        const {
            age, gender, height_cm, weight_kg, target_weight_kg,
            body_type, job_type, workout_frequency, sleep_hours,
            water_intake_liters, goal, dietary_preference,
        } = req.body;

        const nutrition = calculateNutrition({
            age: Number(age),
            gender,
            height_cm: Number(height_cm),
            weight_kg: Number(weight_kg),
            job_type: job_type || 'moderate',
            workout_frequency: Number(workout_frequency) || 3,
            goal: goal || 'maintenance',
        });

        const profileData = {
            user_id: userId,
            age: Number(age),
            gender,
            height_cm: Number(height_cm),
            weight_kg: Number(weight_kg),
            target_weight_kg: target_weight_kg ? Number(target_weight_kg) : null,
            body_type: body_type || null,
            job_type: job_type || 'moderate',
            workout_frequency: Number(workout_frequency) || 3,
            sleep_hours: Number(sleep_hours) || 7,
            water_intake_liters: Number(water_intake_liters) || 2.5,
            goal: goal || 'maintenance',
            dietary_preference: dietary_preference || 'none',
            bmr: parseFloat(nutrition.bmr.toFixed(2)),
            tdee: parseFloat(nutrition.tdee.toFixed(2)),
            target_calories: parseFloat(nutrition.targetCalories.toFixed(2)),
            target_protein_g: parseFloat(nutrition.targetProtein.toFixed(2)),
            target_carbs_g: parseFloat(nutrition.targetCarbs.toFixed(2)),
            target_fat_g: parseFloat(nutrition.targetFat.toFixed(2)),
            profile_completed: true,
            updated_at: new Date().toISOString(),
        };

        // Upsert (insert or update if already exists)
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .upsert(profileData, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw error;

        // Auto-log current weight
        if (weight_kg) {
            await supabase.from('weight_logs').insert({
                user_id: userId,
                weight_kg,
                logged_date: new Date().toISOString().split('T')[0],
                notes: 'Profile setup',
            });
        }

        return res.json({
            message: 'Profile saved successfully!',
            profile,
            calculatedTargets: {
                bmr: nutrition.bmr,
                tdee: nutrition.tdee,
                calories: nutrition.targetCalories,
                protein: nutrition.targetProtein,
                carbs: nutrition.targetCarbs,
                fat: nutrition.targetFat,
            },
        });
    } catch (err) {
        console.error('Save profile error:', err.message);
        res.status(500).json({ error: 'Failed to save profile.' });
    }
});

/* ─── GET /api/profile/weight-logs ───────────────────────── */
router.get('/weight-logs', authenticate, async (req, res) => {
    try {
        const { userId } = req.user;
        const { data: logs, error } = await supabase
            .from('weight_logs')
            .select('*')
            .eq('user_id', userId)
            .order('logged_date', { ascending: false })
            .limit(60);

        if (error) throw error;
        return res.json({ weightLogs: logs });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch weight logs.' });
    }
});

/* ─── POST /api/profile/weight-log ───────────────────────── */
router.post('/weight-log', authenticate, async (req, res) => {
    try {
        const { userId } = req.user;
        const { weight_kg, notes } = req.body;
        if (!weight_kg) return res.status(400).json({ error: 'weight_kg is required.' });

        const today = new Date().toISOString().split('T')[0];

        // Upsert for today (one entry per day)
        const { data: log, error } = await supabase
            .from('weight_logs')
            .upsert({
                user_id: userId, weight_kg, logged_date: today, notes: notes || null,
            }, { onConflict: 'user_id,logged_date' })
            .select()
            .single();

        if (error) {
            const { data: inserted, error: insErr } = await supabase
                .from('weight_logs')
                .insert({ user_id: userId, weight_kg, logged_date: today, notes: notes || null })
                .select().single();
            if (insErr) throw insErr;
            return res.status(201).json({ message: 'Weight logged!', log: inserted });
        }

        return res.status(201).json({ message: 'Weight logged!', log });
    } catch (err) {
        res.status(500).json({ error: 'Failed to log weight.' });
    }
});

module.exports = router;
