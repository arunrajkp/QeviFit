import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getAuthUser, authError, jsonResponse } from '@/lib/api-auth';

// GET /api/profile/weight-logs
export async function GET(req: NextRequest) {
    try {
        const user = getAuthUser(req);
        const supabase = createAdminClient();

        const { data: logs, error } = await supabase
            .from('weight_logs')
            .select('*')
            .eq('user_id', user.userId)
            .order('logged_date', { ascending: false })
            .limit(60);

        if (error) throw error;
        return jsonResponse({ weightLogs: logs || [] });
    } catch (e: unknown) {
        if ((e as Error).message === 'No token provided') return authError();
        return jsonResponse({ error: 'Failed to fetch weight logs.' }, 500);
    }
}

// POST /api/profile/weight-logs
export async function POST(req: NextRequest) {
    try {
        const user = getAuthUser(req);
        const supabase = createAdminClient();
        const { weight_kg, notes } = await req.json();

        if (!weight_kg) return jsonResponse({ error: 'weight_kg is required.' }, 400);

        const today = new Date().toISOString().split('T')[0];

        const { data: log, error } = await supabase
            .from('weight_logs')
            .upsert(
                { user_id: user.userId, weight_kg, logged_date: today, notes: notes || null },
                { onConflict: 'user_id,logged_date' }
            )
            .select()
            .single();

        if (error) throw error;
        return jsonResponse({ message: 'Weight logged!', log }, 201);
    } catch (e: unknown) {
        if ((e as Error).message === 'No token provided') return authError();
        return jsonResponse({ error: 'Failed to log weight.' }, 500);
    }
}
