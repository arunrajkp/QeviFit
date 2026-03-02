import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getAuthUser, authError, jsonResponse } from '@/lib/api-auth';

// GET /api/diet/summary
export async function GET(req: NextRequest) {
    try {
        const user = getAuthUser(req);
        const supabase = createAdminClient();
        const today = new Date().toISOString().split('T')[0];

        const [{ data: profile }, { data: logs }] = await Promise.all([
            supabase
                .from('user_profiles')
                .select('goal, bmr, tdee, target_calories, target_protein_g, target_carbs_g, target_fat_g')
                .eq('user_id', user.userId)
                .maybeSingle(),
            supabase
                .from('daily_logs')
                .select('calories, protein_g, carbs_g, fat_g')
                .eq('user_id', user.userId)
                .eq('log_date', today),
        ]);

        const consumed = (logs || []).reduce(
            (a, l) => ({
                calories: a.calories + (l.calories || 0),
                protein: a.protein + (l.protein_g || 0),
                carbs: a.carbs + (l.carbs_g || 0),
                fat: a.fat + (l.fat_g || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 },
        );

        return jsonResponse({
            date: today,
            targets: profile
                ? {
                    calories: profile.target_calories, protein: profile.target_protein_g,
                    carbs: profile.target_carbs_g, fat: profile.target_fat_g,
                    goal: profile.goal, bmr: profile.bmr, tdee: profile.tdee,
                }
                : { calories: 2000, protein: 150, carbs: 200, fat: 65, goal: 'maintenance', bmr: 1600, tdee: 2000 },
            consumed,
        });
    } catch (e: unknown) {
        if ((e as Error).message === 'No token provided') return authError();
        return jsonResponse({ error: 'Failed to fetch summary.' }, 500);
    }
}
