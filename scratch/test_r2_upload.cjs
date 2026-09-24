const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function testR2Upload() {
  const tmpFile = path.join(os.tmpdir(), `test-upload-${Date.now()}.txt`);
  fs.writeFileSync(tmpFile, "Cloudflare R2 storage upload test for VIBE 2026");

  const objectKey = `test/test-node-${Date.now()}.txt`;
  const bucket = "vibe2026-media";

  return new Promise((resolve, reject) => {
    execFile(
      'npx.cmd',
      ['wrangler', 'r2', 'object', 'put', `${bucket}/${objectKey}`, '--file', tmpFile, '--content-type', 'text/plain', '--remote'],
      { shell: true, timeout: 30000 },
      (err, stdout, stderr) => {
        try { fs.unlinkSync(tmpFile); } catch {}
        if (err) {
          console.error("Upload error:", stderr || err.message);
          reject(err);
        } else {
          console.log("Upload stdout:", stdout);
          const publicUrl = `https://pub-e9103c967e9241e0bfb1c3a609d92723.r2.dev/${objectKey}`;
          console.log("Public URL:", publicUrl);
          resolve(publicUrl);
        }
      }
    );
  });
}

testR2Upload();
