# Under Pines - Beta Auth (Email+Password, No Confirm) + Reliable Media Posts

## Overview

This implementation provides a complete authentication system using real email addresses and reliable media post handling with a two-phase save approach.

## Part A: Email Authentication (No Confirmation)

### Features
- **Real Email Authentication**: Users sign up and sign in with their actual email addresses
- **No Email Confirmation**: During beta, email confirmation is disabled for immediate access
- **Session Persistence**: Sessions persist across browser refresh and reopening
- **Profile Management**: User profiles are created automatically on first sign-in

### Pages
- `/signup` - Create new account with email + password
- `/login` - Sign in with email + password  
- `/logout` - Sign out and redirect to login
- `/auth/upgrade` - (Scaffold) Future upgrade to add email confirmation

### Configuration Requirements

**Supabase Dashboard Settings (REQUIRED):**
1. **Authentication → Email → Confirm email**: Set to **OFF** during beta
2. **Authentication → URL Configuration**: 
   - Site URL: Your Lovable project URL
   - Redirect URLs: Add your project URL

## Part B: Reliable Media Posts (Two-Phase Save)

### Two-Phase Approach
1. **Phase 1**: Create draft post → get post_id
2. **Phase 2**: Upload media to storage using post_id in path
3. **Phase 3**: Publish post with media metadata

### Database Functions Added
- `create_draft_post()` - Creates draft post, returns ID
- `publish_post(id, text, media)` - Publishes draft with media

### Storage Structure
```
Bucket: media (public read, authenticated write)
Path: users/{user_id}/posts/{post_id}/
Files:
  - Images: img_0_sm.webp, img_0_md.webp, img_0_orig.webp
  - Videos: vid_0.mp4, vid_0_poster.jpg
```

This implementation ensures reliable media persistence while providing a smooth authentication experience during beta testing.