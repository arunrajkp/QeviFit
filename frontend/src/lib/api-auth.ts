import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface AuthUser {
    userId: string;
    email: string;
}

/**
 * Verify a Supabase JWT by asking Supabase to validate it.
 * Works with both HS256 (legacy) AND ECC (P-256) signing keys.
 * No need for SUPABASE_JWT_SECRET at all!
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser> {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) throw new Error('No token provided');

    // Use Supabase's own auth.getUser() — handles all key types automatically
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) throw new Error('Invalid or expired token');

    return {
        userId: user.id,
        email: user.email || '',
    };
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
