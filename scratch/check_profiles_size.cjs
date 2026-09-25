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
  const { data, error } = await s
    .from('profiles')
    .select('id, clerk_user_id, vibe_id, display_name, username, avatar_url, avatar_media_id, email, phone, rotaract_club, college, course_year, instagram_username, bio, interests, skills, hobbies, city, is_discoverable, xp, level_number, level_name, connections_count, posts_count, games_played_count, registration_id, profile_completed, created_at, updated_at')
    .order('xp', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error:', error);
    return;
  }
  const json = JSON.stringify(data);
  console.log('Count:', data.length);
  console.log('Total JSON length:', json.length, 'characters (~' + (json.length / 1024).toFixed(1) + ' KB)');
  
  // Check if any avatar_url has huge base64
  let hugeCount = 0;
  data.forEach(p => {
    if (p.avatar_url && p.avatar_url.length > 500) {
      console.log('Huge avatar for', p.display_name, 'length:', p.avatar_url.length);
      hugeCount++;
    }
  });
  console.log('Total huge avatars:', hugeCount);
}

run();
