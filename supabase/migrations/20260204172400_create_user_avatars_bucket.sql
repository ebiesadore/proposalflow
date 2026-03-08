-- Create user avatars bucket for profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-avatars',
    'user-avatars',
    false,  -- Private bucket
    2097152, -- 2MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- RLS: Users can manage their own avatar files
CREATE POLICY "users_manage_own_avatars" 
ON storage.objects
FOR ALL 
TO authenticated
USING (bucket_id = 'user-avatars' AND owner = auth.uid())
WITH CHECK (bucket_id = 'user-avatars' AND owner = auth.uid());