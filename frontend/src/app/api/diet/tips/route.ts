import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getAuthUser, authError, jsonResponse } from '@/lib/api-auth';
import { generateNutritionTips } from '@/lib/nutrition-engine';

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser(req);
        const supabase = createAdminClient();

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('goal, dietary_preference')
            .eq('user_id', user.userId)
            .maybeSingle();

        const tips = generateNutritionTips(profile?.goal || 'maintenance', profile?.dietary_preference);
        return jsonResponse({ tips });
    } catch (e: unknown) {
        if ((e as Error).message === 'No token provided' || (e as Error).message?.includes('Invalid')) return authError();
        return jsonResponse({ error: 'Failed to fetch tips.' }, 500);
    }
}
