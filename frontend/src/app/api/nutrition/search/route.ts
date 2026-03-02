import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getAuthUser, authError, jsonResponse } from '@/lib/api-auth';

// GET /api/nutrition/search?q=chicken
export async function GET(req: NextRequest) {
    try {
        const user = getAuthUser(req);
        const supabase = createAdminClient();
        const q = req.nextUrl.searchParams.get('q');
        if (!q || q.trim().length < 1) return jsonResponse({ error: 'Query q is required.' }, 400);

        const { data: foods, error } = await supabase
            .from('food_database')
            .select('id, name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g')
            .ilike('name', `%${q.trim()}%`)
            .order('name', { ascending: true })
            .limit(20);

        if (error) throw error;
        return jsonResponse({ foods: foods || [], query: q });
    } catch (e: unknown) {
        if ((e as Error).message === 'No token provided') return authError();
        return jsonResponse({ error: 'Food search failed.' }, 500);
    }
}
