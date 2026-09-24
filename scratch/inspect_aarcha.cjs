const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\r\n]+)/);

const supa = createClient(urlMatch[1], keyMatch[1]);

async function inspectAarcha() {
  const { data } = await supa.from('profiles').select('id, clerk_user_id, vibe_id, display_name, email, username, instagram_id, instagram_username, created_at').ilike('display_name', '%Aarcha%');
  console.log('Aarcha profiles:', data);
}

inspectAarcha();

