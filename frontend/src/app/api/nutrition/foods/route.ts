import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getAuthUser, authError, jsonResponse } from '@/lib/api-auth';

// GET /api/nutrition/foods?category=protein
export async function GET(req: NextRequest) {
    try {
        const user = getAuthUser(req);
        const supabase = createAdminClient();
        const category = req.nextUrl.searchParams.get('category');

        let query = supabase
            .from('food_database')
            .select('id, name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g')
            .order('name', { ascending: true })
            .limit(100);

        if (category) query = query.eq('category', category.toLowerCase()) as typeof query;

        const { data: foods, error } = await query;
        if (error) throw error;
        return jsonResponse({ foods: foods || [] });
    } catch (e: unknown) {
        if ((e as Error).message === 'No token provided') return authError();
        return jsonResponse({ error: 'Failed to fetch foods.' }, 500);
    }
}
