import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getAuthUser, authError, jsonResponse } from '@/lib/api-auth';

// POST /api/auth/sync — called after new user registers
export async function POST(req: NextRequest) {
    try {
        const user = getAuthUser(req);
        const { name } = await req.json();
        const supabase = createAdminClient();

        await supabase
            .from('user_profiles')
            .upsert({ user_id: user.userId }, { onConflict: 'user_id', ignoreDuplicates: true });

        return jsonResponse({ message: 'User synced.', userId: user.userId });
    } catch (e: unknown) {
        if ((e as Error).message === 'No token provided') return authError();
        return jsonResponse({ error: 'Sync failed.' }, 500);
    }
}
