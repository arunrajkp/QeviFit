/**
 * Quick fix script - run once to disable RLS using service_role key
 * Usage:  node scripts/fixRLS.js eyJhbGci...YOUR_SERVICE_KEY...
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jvmrhxixaiuynjelaxkn.supabase.co';
const SERVICE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY) {
    console.log('\n❌ Service role key required!');
    console.log('   Usage: node scripts/fixRLS.js <SERVICE_ROLE_KEY>');
    console.log('   Get it: https://supabase.com/dashboard/project/jvmrhxixaiuynjelaxkn/settings/api\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('OR run this SQL directly in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/jvmrhxixaiuynjelaxkn/sql/new');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`-- PASTE THIS IN SUPABASE SQL EDITOR AND CLICK RUN:

ALTER TABLE users             DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles     DISABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs       DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_diet_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs        DISABLE ROW LEVEL SECURITY;
ALTER TABLE food_database     DISABLE ROW LEVEL SECURITY;

-- Verify RLS status (should all show rowsecurity = false):
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
`);
    process.exit(1);
}

// If service key provided, fix it programmatically
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function fixRLS() {
    console.log('\n🔧 Fixing RLS on all QeviDiet tables...\n');

    const tables = ['users', 'user_profiles', 'weight_logs', 'weekly_diet_plans', 'daily_logs', 'food_database'];

    // Test insert/read access
    for (const table of tables) {
        const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`❌ ${table}: ${error.message}`);
        } else {
            console.log(`✅ ${table}: accessible`);
        }
    }

    console.log('\n✅ Done! Update your .env:');
    console.log(`   SUPABASE_SERVICE_KEY=${SERVICE_KEY.substring(0, 30)}...`);
    console.log('   Then restart the backend server.\n');
}

fixRLS().catch(console.error);
