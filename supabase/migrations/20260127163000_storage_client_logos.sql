-- Client Logos Storage Bucket Migration
-- Creates private bucket for client logo uploads

-- Create private bucket for client logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'client-logos',
    'client-logos',
    false,  -- PRIVATE bucket
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can manage their own client logos
CREATE POLICY "users_manage_client_logos" 
ON storage.objects
FOR ALL 
TO authenticated
USING (bucket_id = 'client-logos' AND owner = auth.uid())
WITH CHECK (bucket_id = 'client-logos' AND owner = auth.uid());