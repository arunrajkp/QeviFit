const express = require('express');
const router = express.Router();
const supabase = require('../config/db');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/auth/sync
 * Called after a new user registers via Supabase Auth on the frontend.
 * Creates corresponding rows in our public tables (user_profiles).
 * The user ID comes from the verified Supabase JWT (req.user.userId = sub claim).
 */
router.post('/sync', authenticate, async (req, res) => {
    try {
        const { userId, email } = req.user;
        const { name } = req.body;

        // Create user_profiles row if it doesn't exist yet
        const { error } = await supabase
            .from('user_profiles')
            .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });

        if (error && error.code !== '23505') {
            console.error('Sync error:', error.message);
        }

        return res.json({ message: 'User synced.', userId, email });
    } catch (err) {
        console.error('Auth sync error:', err.message);
        res.status(500).json({ error: 'Sync failed.' });
    }
});

/**
 * GET /api/auth/me
 * Returns the user's profile completion status from our DB.
 * The user identity comes from the Supabase JWT.
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        const { userId, email } = req.user;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('profile_completed')
            .eq('user_id', userId)
            .maybeSingle();

        return res.json({
            user: {
                id: userId,
                email,
                profileCompleted: profile?.profile_completed || false,
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
