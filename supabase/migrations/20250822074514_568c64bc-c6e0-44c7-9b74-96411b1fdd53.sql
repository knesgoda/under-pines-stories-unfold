-- Add sample profile data to the existing user
UPDATE public.profiles 
SET 
  bio = 'Outdoor enthusiast and coffee lover. Always looking for the next adventure under the pines. 🌲☕',
  hobbies = ARRAY['hiking', 'photography', 'coffee roasting', 'camping'],
  interests = ARRAY['outdoor adventures', 'sustainability', 'craft coffee', 'nature photography'],
  places_lived = ARRAY['Portland, OR', 'Denver, CO', 'Seattle, WA']
WHERE username LIKE '%kevin%' OR username LIKE '%nesgoda%'
AND (bio IS NULL OR bio = '' OR array_length(hobbies, 1) IS NULL);