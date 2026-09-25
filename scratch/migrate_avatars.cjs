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

async function migrateHugeAvatars() {
  console.log("Fetching profiles with huge avatars...");
  const { data: profiles, error } = await s
    .from('profiles')
    .select('id, display_name, avatar_url');

  if (error) {
    console.error("Fetch error:", error);
    return;
  }

  let migrated = 0;
  for (const p of profiles) {
    if (p.avatar_url && p.avatar_url.startsWith('data:image/')) {
      console.log(`Migrating avatar for: ${p.display_name} (${p.id}), length: ${p.avatar_url.length}`);
      
      const match = p.avatar_url.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (!match) {
        console.warn(`Could not parse data URL for ${p.display_name}`);
        continue;
      }

      const mimeType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
      const storagePath = `avatars/${p.id}.${ext}`;

      const { error: uploadErr } = await s.storage
        .from('Vibe Bucket')
        .upload(storagePath, buffer, {
          contentType: mimeType,
          upsert: true
        });

      if (uploadErr) {
        console.error(`Upload error for ${p.display_name}:`, uploadErr);
        continue;
      }

      const { data: pubData } = s.storage
        .from('Vibe Bucket')
        .getPublicUrl(storagePath);

      const publicUrl = pubData.publicUrl;
      console.log(`Uploaded to ${publicUrl}, updating profile...`);

      const { error: updateErr } = await s
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', p.id);

      if (updateErr) {
        console.error(`Update profile error for ${p.display_name}:`, updateErr);
      } else {
        migrated++;
        console.log(`Successfully migrated ${p.display_name}!`);
      }
    }
  }

  console.log(`Migration complete! Successfully migrated ${migrated} avatars.`);
}

migrateHugeAvatars();
