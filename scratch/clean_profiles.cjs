const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\r\n]+)/);

const supa = createClient(urlMatch[1], keyMatch[1]);

async function clean() {
  console.log("Cleaning Supabase profiles...");

  // 1. Update Aarcha U's active profile (edb89b61) to have clean username 'aarch.h' and instagram_username 'aarch.h'
  const { error: err1 } = await supa
    .from('profiles')
    .update({
      username: 'aarch.h',
      instagram_id: 'aarch.h',
      instagram_username: 'aarch.h',
    })
    .eq('id', 'edb89b61-8334-4d06-b8c4-30dc0cbd9e03');
  console.log("Updated Aarcha U profile:", err1 ? err1.message : "Success");

  // 2. Remove the duplicate inactive test profile fe7c8194
  const { error: err2 } = await supa
    .from('profiles')
    .delete()
    .eq('id', 'fe7c8194-25a1-4000-8ffe-da0c256fbf7f');
  console.log("Deleted old duplicate Aarcha profile:", err2 ? err2.message : "Success");

  // 3. Remove placeholder profiles with no name or details
  const { data: placeholders } = await supa
    .from('profiles')
    .select('id, display_name, email')
    .eq('display_name', 'VIBE Attendee')
    .is('email', null);

  if (placeholders && placeholders.length > 0) {
    console.log(`Found ${placeholders.length} orphan placeholder profiles, removing...`);
    for (const ph of placeholders) {
      await supa.from('profiles').delete().eq('id', ph.id);
    }
  }

  const { data: finalProfiles } = await supa.from('profiles').select('id, display_name, email, username, instagram_id');
  console.log("Final Profiles in Supabase:", finalProfiles);
}

clean();
