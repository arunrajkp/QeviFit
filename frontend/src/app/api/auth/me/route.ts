import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getAuthUser, authError, jsonResponse } from '@/lib/api-auth';

// GET /api/auth/me
export async function GET(req: NextRequest) {
    try {
        const user = getAuthUser(req);
        const supabase = createAdminClient();

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('profile_completed')
            .eq('user_id', user.userId)
            .maybeSingle();

        return jsonResponse({
            user: {
                id: user.userId,
                email: user.email,
                profileCompleted: profile?.profile_completed || false,
            },
        });
    } catch {
        return authError();
    }
}
