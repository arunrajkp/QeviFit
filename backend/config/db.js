const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://jvmrhxixaiuynjelaxkn.supabase.co';

// Use service_role key (bypasses RLS) → preferred for backend
// Fallback to anon key if service key not set yet
const supabaseKey =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

const keyType = process.env.SUPABASE_SERVICE_KEY ? 'service_role' : 'anon';

if (!supabaseKey) {
    console.error('❌ No Supabase key found in .env (SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY)');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
    db: { schema: 'public' },
    global: {
        headers: {
            // Tell PostgREST to use service role so RLS is bypassed
            'X-Client-Info': 'qevidiet-backend/1.0',
        },
    },
});

// Connectivity test
supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .then(({ error }) => {
        if (error && error.code !== 'PGRST116') {
            if (error.message.includes('row-level security')) {
                console.warn('⚠️  RLS is blocking access. Add SUPABASE_SERVICE_KEY to .env');
                console.warn('   Get it from: https://supabase.com/dashboard/project/jvmrhxixaiuynjelaxkn/settings/api');
            } else if (error.message.includes("table 'public.users'")) {
                console.warn('⚠️  Tables not found. Run backend/scripts/schema.sql in Supabase SQL Editor');
            } else {
                console.warn('⚠️  Supabase note:', error.message);
            }
        } else {
            console.log(`✅ Supabase connected [${keyType} key] → ${supabaseUrl}`);
        }
    });

module.exports = supabase;
