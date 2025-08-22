-- Add sample profile data to showcase the profile features
UPDATE public.profiles 
SET 
  bio = 'Outdoor enthusiast and coffee lover. Always looking for the next adventure under the pines. 🌲☕',
  hobbies = ARRAY['hiking', 'photography', 'coffee roasting', 'camping'],
  interests = ARRAY['outdoor adventures', 'sustainability', 'craft coffee', 'nature photography'],
  places_lived = ARRAY['Portland, OR', 'Denver, CO', 'Seattle, WA']
WHERE username = 'kevin.nesgoda'
AND (bio IS NULL OR bio = '');

-- Create a sample user profile if it doesn't exist (for demo purposes)
INSERT INTO public.profiles (id, username, display_name, bio, hobbies, interests, places_lived)
VALUES (
  gen_random_uuid(),
  'sam_hiker',
  'Sam Johnson',
  'Weekend warrior who loves exploring trails and sharing stories around the campfire. Always planning the next outdoor adventure!',
  ARRAY['rock climbing', 'backpacking', 'trail running', 'kayaking'],
  ARRAY['mountaineering', 'wilderness survival', 'outdoor gear', 'trail maps'],
  ARRAY['Boulder, CO', 'Moab, UT', 'Bend, OR', 'Asheville, NC']
)
ON CONFLICT (username) DO NOTHING;