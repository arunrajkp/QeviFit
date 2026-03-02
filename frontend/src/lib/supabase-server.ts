import { createClient } from '@supabase/supabase-js';

// This client uses the SERVICE ROLE key → bypasses RLS
// ONLY used in Next.js API routes (server-side), never in the browser
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_KEY!;
    if (!key) {
        throw new Error('SUPABASE_SERVICE_KEY is not set in environment variables.');
    }
    return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}
