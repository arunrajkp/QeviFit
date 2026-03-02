import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface AuthUser {
    userId: string;
    email: string;
}

/**
 * Extract and verify the Supabase JWT from Authorization header.
 * Returns the user or throws an error string.
 */
export function getAuthUser(req: NextRequest): AuthUser {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) throw new Error('No token provided');

    const secret = process.env.SUPABASE_JWT_SECRET;
    let decoded: { sub?: string; email?: string } & jwt.JwtPayload;

    if (secret) {
        decoded = jwt.verify(token, secret) as typeof decoded;
    } else {
        // Dev fallback: decode without verifying signature
        const raw = jwt.decode(token);
        if (!raw || typeof raw === 'string') throw new Error('Invalid token');
        decoded = raw as typeof decoded;
    }

    const userId = decoded.sub;
    if (!userId) throw new Error('Invalid token payload');

    return { userId, email: decoded.email || '' };
}

/** Standard JSON error response */
export function authError(message = 'Unauthorized', status = 401) {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

/** Standard JSON success response */
export function jsonResponse(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}
