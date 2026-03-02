import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getAuthUser, authError, jsonResponse } from '@/lib/api-auth';
import { calculateNutrition } from '@/lib/nutrition-engine';

// GET /api/profile
export async function GET(req: NextRequest) {
    try {
        const user = getAuthUser(req);
        const supabase = createAdminClient();

        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.userId)
            .maybeSingle();

        if (error) throw error;
        return jsonResponse({ profile: profile || null });
    } catch (e: unknown) {
        if ((e as Error).message === 'No token provided') return authError();
        return jsonResponse({ error: 'Failed to fetch profile.' }, 500);
    }
}

// POST /api/profile
export async function POST(req: NextRequest) {
    try {
        const user = getAuthUser(req);
        const supabase = createAdminClient();
        const body = await req.json();

        const {
            age, gender, height_cm, weight_kg, target_weight_kg,
            body_type, job_type, workout_frequency, sleep_hours,
            water_intake_liters, goal, dietary_preference,
        } = body;

        const nutrition = calculateNutrition({
            age: Number(age), gender,
            height_cm: Number(height_cm), weight_kg: Number(weight_kg),
            job_type: job_type || 'moderate',
            workout_frequency: Number(workout_frequency) || 3,
            goal: goal || 'maintenance',
        });

        const profileData = {
            user_id: user.userId,
            age: Number(age), gender,
            height_cm: Number(height_cm), weight_kg: Number(weight_kg),
            target_weight_kg: target_weight_kg ? Number(target_weight_kg) : null,
            body_type: body_type || null,
            job_type: job_type || 'moderate',
            workout_frequency: Number(workout_frequency) || 3,
            sleep_hours: Number(sleep_hours) || 7,
            water_intake_liters: Number(water_intake_liters) || 2.5,
            goal: goal || 'maintenance',
            dietary_preference: dietary_preference || 'none',
            bmr: nutrition.bmr,
            tdee: nutrition.tdee,
            target_calories: nutrition.targetCalories,
            target_protein_g: nutrition.targetProtein,
            target_carbs_g: nutrition.targetCarbs,
            target_fat_g: nutrition.targetFat,
            profile_completed: true,
            updated_at: new Date().toISOString(),
        };

        const { data: profile, error } = await supabase
            .from('user_profiles')
            .upsert(profileData, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw error;

        // Auto-log starting weight
        if (weight_kg) {
            await supabase.from('weight_logs').upsert({
                user_id: user.userId, weight_kg,
                logged_date: new Date().toISOString().split('T')[0],
                notes: 'Profile setup',
            }, { onConflict: 'user_id,logged_date', ignoreDuplicates: true });
        }

        return jsonResponse({
            message: 'Profile saved!', profile,
            calculatedTargets: {
                bmr: nutrition.bmr, tdee: nutrition.tdee,
                calories: nutrition.targetCalories, protein: nutrition.targetProtein,
                carbs: nutrition.targetCarbs, fat: nutrition.targetFat,
            },
        }, 201);
    } catch (e: unknown) {
        if ((e as Error).message === 'No token provided') return authError();
        console.error('Profile save error:', (e as Error).message);
        return jsonResponse({ error: 'Failed to save profile.' }, 500);
    }
}
