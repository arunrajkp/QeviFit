/**
 * QeviDiet – Supabase Schema Setup Script
 * Uses Supabase REST API to run the DDL via the pg_exec or rpc approach
 * 
 * Run: node scripts/setupSupabase.js
 */
require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jvmrhxixaiuynjelaxkn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) { console.error('❌ Missing SUPABASE_ANON_KEY in .env'); process.exit(1); }

// Split the schema SQL into individual statements
const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

// Use Supabase's built-in /sql endpoint (only works with service_role key or via Supabase CLI)
// Alternatively, we use node-postgres with Supabase's connection string
async function runSQL(sql) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ query: sql });
        const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);

        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Length': Buffer.byteLength(body),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

console.log('\n🗄️  QeviDiet – Supabase Schema Setup');
console.log('=====================================');
console.log(`📡 Supabase: ${SUPABASE_URL}`);
console.log('\n⚠️  IMPORTANT: The schema must be run directly in the Supabase SQL Editor.');
console.log('   The Supabase anon key does not have permission to run DDL statements.');
console.log('   Service Role Key is required for direct SQL execution via REST API.\n');
console.log('📋 STEPS TO APPLY THE SCHEMA:');
console.log('   1. Go to: https://supabase.com/dashboard/project/jvmrhxixaiuynjelaxkn');
console.log('   2. Click on "SQL Editor" in the left sidebar');
console.log('   3. Click "New Query"');
console.log('   4. Copy the contents of: backend/scripts/schema.sql');
console.log('   5. Paste into the SQL Editor and click "Run"');
console.log('   6. Verify the output shows all tables created\n');
console.log(`📄 Schema file path: ${path.join(__dirname, 'schema.sql')}`);
console.log('\n✅ Once schema is applied, restart the backend server and try registering.\n');
