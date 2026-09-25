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

async function testUpload() {
  const dummyBuffer = Buffer.from('test image content');
  const fileName = `avatars/test-upload-${Date.now()}.txt`;
  const { data, error } = await s.storage
    .from('Vibe Bucket')
    .upload(fileName, dummyBuffer, {
      contentType: 'text/plain',
      upsert: true
    });
  console.log('Upload error:', error);
  console.log('Upload data:', data);

  const { data: publicData } = s.storage
    .from('Vibe Bucket')
    .getPublicUrl(fileName);
  console.log('Public URL:', publicData.publicUrl);
}

testUpload();
