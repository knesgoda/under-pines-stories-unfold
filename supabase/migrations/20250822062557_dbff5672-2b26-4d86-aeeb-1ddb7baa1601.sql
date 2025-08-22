-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_active timestamp with time zone DEFAULT now();

-- Update existing users to have default values for new columns
UPDATE public.profiles 
SET 
  interests = '{}',
  is_private = false,
  last_active = now()
WHERE interests IS NULL OR is_private IS NULL OR last_active IS NULL;