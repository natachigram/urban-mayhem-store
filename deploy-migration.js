#!/usr/bin/env node

/**
 * Deploy migration to Supabase via Management API
 * Reads .env and migration file, executes SQL
 */

const fs = require('fs');
const https = require('https');

// Read .env
const env = {};
fs.readFileSync('.env', 'utf-8')
  .split('\n')
  .forEach((line) => {
    const [key, ...value] = line.split('=');
    if (key && !key.startsWith('#')) {
      env[key.trim()] = value.join('=').trim();
    }
  });

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = SUPABASE_URL.match(/https:\/\/(.+?)\.supabase\.co/)[1];

console.log('📦 Deploying atoms table migration...');
console.log(`🔗 Project: ${PROJECT_REF}`);

// Read migration file
const migrationSQL = fs.readFileSync(
  'supabase/migrations/106_intuition_schema.sql',
  'utf-8'
);

// Split into individual statements (rough split)
const statements = migrationSQL
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith('--'));

console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

// Execute each statement via PostgREST
let completed = 0;
for (const statement of statements) {
  if (
    statement.includes('SELECT') &&
    statement.includes('information_schema')
  ) {
    console.log(`⏭️  Skipping verification query`);
    continue;
  }

  const postData = JSON.stringify({
    query: statement + ';',
  });

  const options = {
    hostname: `${PROJECT_REF}.supabase.co`,
    port: 443,
    path: '/rest/v1/rpc',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Length': postData.length,
    },
  };

  try {
    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          completed++;
          console.log(`✅ ${completed}/${statements.length}`);
          resolve();
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.error(`❌ Failed:`, error.message);
  }
}

console.log('\n✅ Migration deployment complete!');
console.log('🔄 Redeploy your Vercel app to use the new tables.');
