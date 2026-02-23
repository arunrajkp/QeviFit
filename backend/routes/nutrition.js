const express = require('express');
const router = express.Router();
const supabase = require('../config/db');
const { authenticate } = require('../middleware/auth');

/* ─── GET /api/nutrition/search?q=chicken ──────────────────── */
router.get('/search', authenticate, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 1)
            return res.status(400).json({ error: 'Query parameter q is required.' });

        const { data: foods, error } = await supabase
            .from('food_database')
            .select('id, name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g')
            .ilike('name', `%${q.trim()}%`)
            .order('name', { ascending: true })
            .limit(20);

        if (error) throw error;
        return res.json({ foods: foods || [], query: q });
    } catch (err) {
        console.error('Food search error:', err.message);
        res.status(500).json({ error: 'Food search failed.' });
    }
});

/* ─── GET /api/nutrition/foods?category=protein ─────────────── */
router.get('/foods', authenticate, async (req, res) => {
    try {
        const { category } = req.query;
        let query = supabase
            .from('food_database')
            .select('id, name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g')
            .order('name', { ascending: true })
            .limit(100);

        if (category) query = query.eq('category', category.toLowerCase());

        const { data: foods, error } = await query;
        if (error) throw error;
        return res.json({ foods: foods || [] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch foods.' });
    }
});

/* ─── POST /api/nutrition/calculate ─────────────────────────── */
router.post('/calculate', authenticate, async (req, res) => {
    try {
        const { food_id, quantity_g } = req.body;
        if (!food_id || !quantity_g)
            return res.status(400).json({ error: 'food_id and quantity_g are required.' });

        const { data: food, error } = await supabase
            .from('food_database')
            .select('*')
            .eq('id', food_id)
            .maybeSingle();

        if (error || !food) return res.status(404).json({ error: 'Food not found.' });

        const factor = quantity_g / 100;
        return res.json({
            food_name: food.name,
            quantity_g,
            calories: parseFloat((food.calories_per_100g * factor).toFixed(2)),
            protein_g: parseFloat((food.protein_per_100g * factor).toFixed(2)),
            carbs_g: parseFloat((food.carbs_per_100g * factor).toFixed(2)),
            fat_g: parseFloat((food.fat_per_100g * factor).toFixed(2)),
            fiber_g: parseFloat((food.fiber_per_100g * factor).toFixed(2)),
        });
    } catch (err) {
        res.status(500).json({ error: 'Calculation failed.' });
    }
});

/* ─── GET /api/nutrition/categories ─────────────────────────── */
router.get('/categories', authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('food_database')
            .select('category')
            .order('category', { ascending: true });

        if (error) throw error;
        const categories = [...new Set((data || []).map(d => d.category).filter(Boolean))];
        return res.json({ categories });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
});

module.exports = router;
