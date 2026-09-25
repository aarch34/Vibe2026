const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line && line.includes('=')) {
    const [key, ...vals] = line.split('=');
    env[key.trim()] = vals.join('=').trim().replace(/^"/, '').replace(/"$/, '');
  }
});

const s = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function run() {
  const res = await s
    .from('profiles')
    .select('id, display_name, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5);
  console.log('Top 5 profiles:', JSON.stringify(res.data, null, 2));
}

run();
