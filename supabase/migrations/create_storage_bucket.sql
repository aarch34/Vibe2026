-- Create a new public storage bucket called "vibe-storage"
INSERT INTO storage.buckets (id, name, public)
VALUES ('vibe-storage', 'vibe-storage', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all files in vibe-storage
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'vibe-storage' );

-- Allow authenticated users to upload files
CREATE POLICY "Auth Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'vibe-storage' );

-- Allow admin/service_role full access (implicitly granted to service_role, but explicit is good)
CREATE POLICY "Admin Full Access"
ON storage.objects
FOR ALL
TO service_role
USING ( bucket_id = 'vibe-storage' )
WITH CHECK ( bucket_id = 'vibe-storage' );
