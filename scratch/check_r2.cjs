const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line && line.includes('=')) {
    const [key, ...vals] = line.split('=');
    env[key.trim()] = vals.join('=').trim().replace(/^"/, '').replace(/"$/, '');
  }
});

console.log('R2_ACCESS_KEY_ID exists:', Boolean(env['R2_ACCESS_KEY_ID']));
console.log('CLOUDFLARE_ACCOUNT_ID exists:', Boolean(env['CLOUDFLARE_ACCOUNT_ID']));
console.log('R2_BUCKET_NAME:', env['R2_BUCKET_NAME']);
console.log('R2_PUBLIC_DEV_URL:', env['R2_PUBLIC_DEV_URL']);
