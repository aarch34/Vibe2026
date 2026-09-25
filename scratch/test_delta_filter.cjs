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
  // Simulate the exact delta-sync query used by the discover API
  // This uses the Supabase .or() filter format
  const since = '2026-09-25T08:00:00.000Z'; // simulating lastSync from a user who synced 2h ago
  
  console.log(`Testing delta query with since=${since}`);
  const { data, error } = await s
    .from('profiles')
    .select('id, display_name, is_discoverable, created_at, updated_at')
    .or(`updated_at.gt.${since},created_at.gt.${since}`)
    .order('updated_at', { ascending: false })
    .limit(50);
  
  console.log('Error:', error);
  console.log('Total rows returned by Supabase query:', data?.length);
  console.log('\nRows after is_discoverable filter:');
  data?.forEach(row => {
    const passes = row.is_discoverable !== false;
    console.log(` [${passes ? 'SHOW' : 'HIDE'}] ${row.display_name} - is_discoverable=${row.is_discoverable}`);
  });
}

run();
