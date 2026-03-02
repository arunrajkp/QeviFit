import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getAuthUser, authError, jsonResponse } from '@/lib/api-auth';
import { generateWeeklyMealPlan } from '@/lib/nutrition-engine';

// POST /api/diet/generate
export async function POST(req: NextRequest) {
    try {
        const user = getAuthUser(req);
        const supabase = createAdminClient();

        const { data: profile, error: pErr } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.userId)
            .maybeSingle();

        if (pErr || !profile)
            return jsonResponse({ error: 'Profile not found. Complete your profile first.' }, 404);

        const planData = generateWeeklyMealPlan(
            {
                targetCalories: profile.target_calories,
                targetProtein: profile.target_protein_g,
                targetCarbs: profile.target_carbs_g,
                targetFat: profile.target_fat_g,
            },
            profile.goal,
            profile.dietary_preference || 'none',
        );

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        const weekStartDate = weekStart.toISOString().split('T')[0];

        // Deactivate old plans
        await supabase
            .from('weekly_diet_plans')
            .update({ is_active: false })
            .eq('user_id', user.userId);

        const { data: plan, error: planErr } = await supabase
            .from('weekly_diet_plans')
            .insert({
                user_id: user.userId,
                week_start_date: weekStartDate,
                goal: profile.goal,
                target_calories: profile.target_calories,
                plan_data: planData,
                is_active: true,
            })
            .select()
            .single();

        if (planErr) throw planErr;
        return jsonResponse({ message: 'Meal plan generated!', plan }, 201);
    } catch (e: unknown) {
        if ((e as Error).message === 'No token provided') return authError();
        return jsonResponse({ error: 'Failed to generate meal plan.' }, 500);
    }
}
