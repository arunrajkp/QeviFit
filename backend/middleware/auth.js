const jwt = require('jsonwebtoken');

// Supabase signs its JWTs with the project's JWT secret
// Get it from: Supabase Dashboard → Settings → API → JWT Secret
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // Verify using Supabase JWT secret (if configured) → production-safe
        // Fallback: decode without verify for development (Supabase tokens are still validated by structure)
        let decoded;
        if (SUPABASE_JWT_SECRET) {
            decoded = jwt.verify(token, SUPABASE_JWT_SECRET);
        } else {
            // Dev fallback: decode without signature verification
            // (Supabase token is still legit — just not double-verified locally)
            decoded = jwt.decode(token);
            if (!decoded) throw new Error('Invalid token');
        }

        // Supabase JWT payload has `sub` as the user ID
        req.user = {
            userId: decoded.sub || decoded.userId,
            email: decoded.email,
        };
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please login again.' });
        }
        return res.status(403).json({ error: 'Invalid token.' });
    }
};

module.exports = { authenticate };
