const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : (fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '');
const lines = env.split('\n');
const envVars = {};
lines.forEach(l => {
  const parts = l.split('=');
  if (parts.length >= 2) envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('No Supabase credentials found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// PRESERVED REAL USERS:
// 1. Thejaswin P (admin) -> user_3IPRABXFgggQPbAhALyCDcxBASV
// 2. Aarcha -> user_3JcycUsnjNKfrWDy26jw8N2EIHZ
const PROTECTED_CLERK_IDS = [
  'user_3IPRABXFgggQPbAhALyCDcxBASV',
  'user_3JcycUsnjNKfrWDy26jw8N2EIHZ',
];

async function purgeTestData() {
  console.log('--- 🧹 STARTING VIBE 2026 TEST DATA PURGE ---');

  // 1. Fetch all profiles to identify test accounts
  const { data: allProfiles, error: pErr } = await supabase.from('profiles').select('*');
  if (pErr) {
    console.error('Failed to query profiles:', pErr.message);
    process.exit(1);
  }

  const testProfiles = allProfiles.filter((p) => {
    if (PROTECTED_CLERK_IDS.includes(p.clerk_user_id)) return false;
    // Identify test/dummy patterns
    const isTestClerk = p.clerk_user_id?.startsWith('test-user-') || p.clerk_user_id?.startsWith('usr-reg-');
    const isVikramTest = p.display_name === 'Vikram Sen' && p.clerk_user_id?.startsWith('test-');
    const isDummyAttendee = p.display_name === 'VIBE Attendee' && !p.phone;
    const isDuplicateAarcha = p.display_name === 'Aarcha U' && p.clerk_user_id?.startsWith('usr-reg-');

    return isTestClerk || isVikramTest || isDummyAttendee || isDuplicateAarcha;
  });

  console.log(`Found ${allProfiles.length} total profiles.`);
  console.log(`Identified ${testProfiles.length} test/demo profiles to delete.`);
  console.log(`Preserving ${allProfiles.length - testProfiles.length} real accounts:`, 
    allProfiles.filter(p => !testProfiles.includes(p)).map(p => `${p.display_name} (${p.vibe_id})`)
  );

  const testProfileIds = testProfiles.map((p) => p.id);

  if (testProfileIds.length === 0) {
    console.log('No test profiles found. Database is already clean!');
    return;
  }

  // 2. Delete test experience completions
  const { error: compErr } = await supabase
    .from('experience_completions')
    .delete()
    .in('profile_id', testProfileIds);
  if (compErr) console.warn('Completions delete note:', compErr.message);
  else console.log('✓ Cleaned test experience completions.');

  // 3. Delete test wallet transactions
  const { error: txErr } = await supabase
    .from('wallet_transactions')
    .delete()
    .in('profile_id', testProfileIds);
  if (txErr) console.warn('Transactions delete note:', txErr.message);
  else console.log('✓ Cleaned test wallet transactions.');

  // 4. Delete test wallets
  const { error: walErr } = await supabase
    .from('wallets')
    .delete()
    .in('profile_id', testProfileIds);
  if (walErr) console.warn('Wallets delete note:', walErr.message);
  else console.log('✓ Cleaned test wallets.');

  // 5. Delete test event members
  const { error: emErr } = await supabase
    .from('event_members')
    .delete()
    .in('profile_id', testProfileIds);
  if (emErr) console.warn('Event members delete note:', emErr.message);
  else console.log('✓ Cleaned test event members.');

  // 6. Delete test profiles
  const { error: profErr } = await supabase
    .from('profiles')
    .delete()
    .in('id', testProfileIds);
  if (profErr) {
    console.error('Profiles delete failed:', profErr.message);
  } else {
    console.log(`✓ Successfully deleted ${testProfileIds.length} test profiles.`);
  }

  // 7. Verify remaining database state
  const { data: remainingProfiles } = await supabase.from('profiles').select('id, vibe_id, display_name, clerk_user_id');
  const { data: remainingWallets } = await supabase.from('wallets').select('id, balance, profile_id');
  const { data: remainingComps } = await supabase.from('experience_completions').select('id');

  console.log('\n--- 📊 CLEAN DATABASE STATUS ---');
  console.log('Remaining Real Profiles:', remainingProfiles?.length);
  remainingProfiles?.forEach(p => console.log(`  • ${p.display_name} | VIBE: ${p.vibe_id} | Clerk: ${p.clerk_user_id}`));
  console.log('Remaining Wallets:', remainingWallets?.length);
  console.log('Remaining Experience Completions:', remainingComps?.length);
  console.log('--- 🧹 PURGE COMPLETE ---');
}

purgeTestData().catch(err => {
  console.error('Fatal purge error:', err);
  process.exit(1);
});
