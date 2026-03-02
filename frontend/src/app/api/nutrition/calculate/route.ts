import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getAuthUser, authError, jsonResponse } from '@/lib/api-auth';

// POST /api/nutrition/calculate
export async function POST(req: NextRequest) {
    try {
        const user = getAuthUser(req);
        const supabase = createAdminClient();
        const { food_id, quantity_g } = await req.json();

        if (!food_id || !quantity_g) return jsonResponse({ error: 'food_id and quantity_g are required.' }, 400);

        const { data: food, error } = await supabase
            .from('food_database')
            .select('*')
            .eq('id', food_id)
            .maybeSingle();

        if (error || !food) return jsonResponse({ error: 'Food not found.' }, 404);

        const factor = quantity_g / 100;
        return jsonResponse({
            food_name: food.name,
            quantity_g,
            calories: parseFloat((food.calories_per_100g * factor).toFixed(2)),
            protein_g: parseFloat((food.protein_per_100g * factor).toFixed(2)),
            carbs_g: parseFloat((food.carbs_per_100g * factor).toFixed(2)),
            fat_g: parseFloat((food.fat_per_100g * factor).toFixed(2)),
            fiber_g: parseFloat((food.fiber_per_100g * factor).toFixed(2)),
        });
    } catch (e: unknown) {
        if ((e as Error).message === 'No token provided') return authError();
        return jsonResponse({ error: 'Calculation failed.' }, 500);
    }
}
