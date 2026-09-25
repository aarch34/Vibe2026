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
  // Simulate what delta-sync sees for a profile that just registered (last 5 minutes)
  const since5min = new Date(Date.now() - 5 * 60000).toISOString();
  const since1h = new Date(Date.now() - 3600000).toISOString();
  
  console.log('--- Checking profiles updated in last 5 mins ---');
  const { data: recent5min, error: err5 } = await s
    .from('profiles')
    .select('id, display_name, is_discoverable, created_at, updated_at')
    .or(`updated_at.gt.${since5min},created_at.gt.${since5min}`)
    .order('updated_at', { ascending: false });
  
  console.log('Error:', err5);
  console.log('Profiles in last 5min:', recent5min?.length);
  recent5min?.forEach(p => {
    console.log(` - ${p.display_name}: is_discoverable=${p.is_discoverable}, created=${p.created_at}, updated=${p.updated_at}`);
  });

  console.log('\n--- Checking profiles updated in last 1hr ---');
  const { data: recent1h, error: err1h } = await s
    .from('profiles')
    .select('id, display_name, is_discoverable, created_at, updated_at')
    .or(`updated_at.gt.${since1h},created_at.gt.${since1h}`)
    .order('updated_at', { ascending: false });
  
  console.log('Error:', err1h);
  console.log('Profiles in last 1hr:', recent1h?.length);
  recent1h?.forEach(p => {
    console.log(` - ${p.display_name}: is_discoverable=${p.is_discoverable}, created=${p.created_at?.slice(0,19)}, updated=${p.updated_at?.slice(0,19)}`);
  });
  
  console.log('\n--- Checking NOT discoverable profiles ---');
  const { data: notDisc, error: errND } = await s
    .from('profiles')
    .select('id, display_name, is_discoverable')
    .eq('is_discoverable', false);
  
  console.log('Not discoverable:', notDisc?.length, notDisc?.map(p => p.display_name));
}

run();
