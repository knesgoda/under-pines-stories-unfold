-- Alter posts table for media support
ALTER TABLE posts 
DROP CONSTRAINT IF EXISTS posts_body_check;

ALTER TABLE posts 
ADD CONSTRAINT posts_body_check CHECK (char_length(body) <= 2500);

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS media jsonb DEFAULT '[]'::jsonb;

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS has_media boolean GENERATED ALWAYS AS (jsonb_array_length(media) > 0) STORED;

-- Create media storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for media bucket
CREATE POLICY "Users can upload media to their own folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'media' AND 
  auth.uid()::text = (storage.foldername(name))[2] AND
  (storage.foldername(name))[1] = 'users'
);

CREATE POLICY "Users can update their own media" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'media' AND 
  auth.uid()::text = (storage.foldername(name))[2] AND
  (storage.foldername(name))[1] = 'users'
);

CREATE POLICY "Users can delete their own media" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'media' AND 
  auth.uid()::text = (storage.foldername(name))[2] AND
  (storage.foldername(name))[1] = 'users'
);

CREATE POLICY "Anyone can view media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'media');