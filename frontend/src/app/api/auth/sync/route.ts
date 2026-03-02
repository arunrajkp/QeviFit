import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getAuthUser, authError, jsonResponse } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser(req);
        const supabase = createAdminClient();
        const body = await req.json().catch(() => ({}));
        const name = body.name || '';

        await supabase
            .from('user_profiles')
            .upsert({ user_id: user.userId }, { onConflict: 'user_id', ignoreDuplicates: true });

        return jsonResponse({ message: 'User synced.', userId: user.userId });
    } catch (e: unknown) {
        if ((e as Error).message === 'No token provided') return authError();
        if ((e as Error).message?.includes('Invalid')) return authError('Invalid token');
        return jsonResponse({ error: 'Sync failed.' }, 500);
    }
}
