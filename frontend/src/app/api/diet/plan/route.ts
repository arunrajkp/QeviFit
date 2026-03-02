import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getAuthUser, authError, jsonResponse } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser(req);
        const supabase = createAdminClient();

        const { data: plan, error } = await supabase
            .from('weekly_diet_plans')
            .select('*')
            .eq('user_id', user.userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return jsonResponse({ plan: plan || null });
    } catch (e: unknown) {
        if ((e as Error).message === 'No token provided' || (e as Error).message?.includes('Invalid')) return authError();
        return jsonResponse({ error: 'Failed to fetch meal plan.' }, 500);
    }
}
