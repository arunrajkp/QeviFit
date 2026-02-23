const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const supabase = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'qevidiet_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

const makeToken = (id, email) =>
    jwt.sign({ userId: id, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

/* ─── POST /api/auth/register ──────────────────────────────── */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ error: 'Name, email and password are required.' });
        if (password.length < 6)
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });

        const emailLower = email.toLowerCase().trim();

        // Check existing
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', emailLower)
            .maybeSingle();

        if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

        const password_hash = await bcrypt.hash(password, 12);

        // Insert user
        const { data: user, error } = await supabase
            .from('users')
            .insert({ name: name.trim(), email: emailLower, password_hash })
            .select('id, name, email, plan')
            .single();

        if (error) throw error;

        // Create empty profile row
        await supabase.from('user_profiles').insert({ user_id: user.id });

        const token = makeToken(user.id, user.email);
        return res.status(201).json({
            message: 'Account created successfully!',
            token,
            user: { id: user.id, name: user.name, email: user.email, plan: user.plan, profileCompleted: false },
        });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

/* ─── POST /api/auth/login ──────────────────────────────────── */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required.' });

        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, password_hash, plan, is_active')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle();

        if (error || !user)
            return res.status(401).json({ error: 'Invalid email or password.' });
        if (!user.is_active)
            return res.status(403).json({ error: 'Account is suspended.' });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid)
            return res.status(401).json({ error: 'Invalid email or password.' });

        // Check profile completion
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('profile_completed')
            .eq('user_id', user.id)
            .maybeSingle();

        const token = makeToken(user.id, user.email);
        return res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id, name: user.name, email: user.email,
                plan: user.plan,
                profileCompleted: profile?.profile_completed || false,
            },
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

/* ─── GET /api/auth/me ──────────────────────────────────────── */
router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
    try {
        const { userId } = req.user;
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, plan, created_at')
            .eq('id', userId)
            .maybeSingle();

        if (error || !user) return res.status(404).json({ error: 'User not found.' });

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('profile_completed')
            .eq('user_id', userId)
            .maybeSingle();

        return res.json({ user: { ...user, profile_completed: profile?.profile_completed || false } });
    } catch (err) {
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
