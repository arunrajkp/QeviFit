/**
 * QeviDiet - Auto Schema Setup via Supabase REST SQL endpoint
 * Uses the service_role key (required for DDL)
 * Run: node scripts/runSchema.js <SERVICE_ROLE_KEY>
 * 
 * Get your service role key from:
 * https://supabase.com/dashboard/project/jvmrhxixaiuynjelaxkn/settings/api
 */
require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'jvmrhxixaiuynjelaxkn'; // project ref
const SERVICE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY) {
    console.error('\n❌ Usage: node scripts/runSchema.js <YOUR_SERVICE_ROLE_KEY>');
    console.error('   Get it from: https://supabase.com/dashboard/project/jvmrhxixaiuynjelaxkn/settings/api\n');
    process.exit(1);
}

const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

function postSQL(sql) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ query: sql });
        const options = {
            hostname: 'jvmrhxixaiuynjelaxkn.supabase.co',
            path: '/rest/v1/sql',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
            },
        };
        const req = https.request(options, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve({ status: res.statusCode, body: d }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// Alternative: Use the pg_dump/SQL endpoint
async function runViaMgmt() {
    const body = JSON.stringify({ query: sql });
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.supabase.com',
            path: `/v1/projects/${SUPABASE_URL}/database/query`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_KEY}`,
            },
        };
        const req = https.request(options, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve({ status: res.statusCode, body: d }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

(async () => {
    console.log('\n🚀 Running QeviDiet schema on Supabase...');
    try {
        const r = await runViaMgmt();
        if (r.status === 200 || r.status === 201) {
            console.log('✅ Schema applied successfully!');
            console.log(r.body);
        } else {
            console.log(`⚠️  Status ${r.status}:`, r.body);
        }
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
})();
