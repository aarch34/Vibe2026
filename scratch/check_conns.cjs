const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\r\n]+)/);

if (!urlMatch || !keyMatch) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supa = createClient(urlMatch[1], keyMatch[1]);

async function check() {
  const { data: profs } = await supa.from('profiles').select('id, display_name, email, username, instagram_id, instagram_username');
  console.log('Profiles count:', profs ? profs.length : 0);
  console.log('Profiles:', profs);

  const { data: conns } = await supa.from('connections').select('*');
  console.log('Connections count:', conns ? conns.length : 0);
  console.log('Connections:', conns);

  const { data: reqs } = await supa.from('connection_requests').select('*');
  console.log('Connection Requests count:', reqs ? reqs.length : 0);
  console.log('Connection Requests:', reqs);
}

check();
