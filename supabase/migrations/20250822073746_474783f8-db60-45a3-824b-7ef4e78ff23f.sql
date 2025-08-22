-- Add some sample data to existing profiles for testing
UPDATE public.profiles 
SET 
  bio = CASE username
    WHEN 'admin' THEN 'Administrator of Under Pines community. Love connecting people around outdoor adventures.'
    ELSE 'Nature enthusiast and outdoor adventurer. Always looking for the next great trail to explore.'
  END,
  hobbies = CASE username
    WHEN 'admin' THEN ARRAY['hiking', 'photography', 'camping', 'rock climbing']
    ELSE ARRAY['hiking', 'reading', 'cooking', 'gardening']
  END,
  interests = CASE username
    WHEN 'admin' THEN ARRAY['wilderness survival', 'environmental conservation', 'community building']
    ELSE ARRAY['nature photography', 'sustainable living', 'travel']
  END,
  places_lived = CASE username
    WHEN 'admin' THEN ARRAY['Portland, OR', 'Seattle, WA', 'Denver, CO']
    ELSE ARRAY['San Francisco, CA', 'Austin, TX']
  END
WHERE bio IS NULL;