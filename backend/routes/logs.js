const express = require('express');
const router = express.Router();
const supabase = require('../config/db');
const { authenticate } = require('../middleware/auth');

/* ─── GET /api/logs?date=YYYY-MM-DD ─────────────────────── */
router.get('/', authenticate, async (req, res) => {
    try {
        const { userId } = req.user;
        const date = req.query.date || new Date().toISOString().split('T')[0];

        const { data: logs, error } = await supabase
            .from('daily_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('log_date', date)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return res.json({ logs: logs || [], date });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch logs.' });
    }
});

/* ─── POST /api/logs ─────────────────────────────────────── */
router.post('/', authenticate, async (req, res) => {
    try {
        const { userId } = req.user;
        const {
            food_name, quantity_g, meal_type,
            calories = 0, protein_g = 0, carbs_g = 0, fat_g = 0,
            fiber_g = 0, notes,
        } = req.body;

        if (!food_name || !quantity_g || !meal_type)
            return res.status(400).json({ error: 'food_name, quantity_g and meal_type are required.' });

        const { data: log, error } = await supabase
            .from('daily_logs')
            .insert({
                user_id: userId,
                log_date: new Date().toISOString().split('T')[0],
                food_name, quantity_g, meal_type,
                calories, protein_g, carbs_g, fat_g, fiber_g, notes,
            })
            .select()
            .single();

        if (error) throw error;
        return res.status(201).json({ message: 'Food logged!', log });
    } catch (err) {
        console.error('Add log error:', err.message);
        res.status(500).json({ error: 'Failed to add log.' });
    }
});

/* ─── DELETE /api/logs/:id ───────────────────────────────── */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { userId } = req.user;
        const { id } = req.params;

        const { error } = await supabase
            .from('daily_logs')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;
        return res.json({ message: 'Log entry deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete log.' });
    }
});

/* ─── GET /api/logs/weekly ───────────────────────────────── */
router.get('/weekly', authenticate, async (req, res) => {
    try {
        const { userId } = req.user;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const fromDate = sevenDaysAgo.toISOString().split('T')[0];

        const { data: logs, error } = await supabase
            .from('daily_logs')
            .select('log_date, calories, protein_g, carbs_g, fat_g')
            .eq('user_id', userId)
            .gte('log_date', fromDate)
            .order('log_date', { ascending: true });

        if (error) throw error;

        const byDate = {};
        (logs || []).forEach(l => {
            if (!byDate[l.log_date]) byDate[l.log_date] = { log_date: l.log_date, total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 };
            byDate[l.log_date].total_calories += l.calories || 0;
            byDate[l.log_date].total_protein += l.protein_g || 0;
            byDate[l.log_date].total_carbs += l.carbs_g || 0;
            byDate[l.log_date].total_fat += l.fat_g || 0;
        });

        return res.json({ weeklyData: Object.values(byDate) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch weekly data.' });
    }
});

module.exports = router;
