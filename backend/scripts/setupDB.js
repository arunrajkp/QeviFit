require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'qevidiet',
});

async function setupDB() {
    try {
        const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        console.log('🔧 Setting up QeviDiet database...');
        await pool.query(schemaSQL);
        console.log('✅ Database schema created successfully!');
        console.log('✅ Food database seeded with common foods!');
        console.log('\n🎉 QeviDiet database setup complete!');
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

setupDB();
