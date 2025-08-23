# Under Pines Beta Authentication

This document describes the beta authentication system for Under Pines that **does not require email verification**.

## Overview

During beta, users can create accounts with just a username and password. The system uses synthetic email addresses internally to work with Supabase Auth while providing a simple signup experience.

## How It Works

### Synthetic Email System
- User provides: username (e.g., "john_doe") and password
- System creates: synthetic email "john_doe@beta.underpines.local"
- Supabase Auth handles authentication using the synthetic email
- User never sees or interacts with the email address

### Routes

- `/beta-join` - Signup with username + password
- `/login` - Login with username + password  
- `/logout` - Clear session and redirect to login
- `/auth/upgrade` - Future email upgrade (scaffold only)

### Validation Rules

**Username Requirements:**
- 3-20 characters
- Letters, numbers, underscore only
- Cannot start/end with underscore
- Must be unique in the database
- Excludes reserved names (admin, api, etc.)

**Password Requirements:**
- Minimum 8 characters
- Must contain letters and numbers

### Database Schema

The `profiles` table stores user data:
```sql
profiles (
  id uuid primary key references auth.users(id),
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  hobbies text[],
  interests text[],
  places_lived text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

### Session Management

- Sessions persist across browser refresh
- Auto token refresh enabled
- "Remember me" functionality (always active)
- Route guards protect authenticated pages
- Unauthenticated users redirect to `/login` with return URL

## Configuration Required

### Supabase Dashboard Settings

1. **Disable Email Confirmation** (Critical!)
   - Go to Authentication → Email → turn OFF "Confirm email"
   - This allows immediate account creation without email verification

2. **URL Configuration**
   - Site URL: Set to your app's URL (e.g., Lovable preview URL)
   - Redirect URLs: Add your app's URL for authentication redirects

### RLS Policies

The system uses existing Row Level Security policies:
- `profiles`: Users can SELECT all profiles, UPDATE only their own
- `posts/comments/likes`: Follow existing feed MVP policies

## Error Handling

User-friendly messages for common scenarios:
- "That handle is taken" → username already exists
- "Wrong username or password" → invalid credentials  
- "Use at least 8 characters with letters and numbers" → weak password
- "Too many attempts. Try again in a minute" → rate limiting

## Post-Beta Migration Plan

### Phase 1: Email Upgrade (Optional)
Users can optionally add email to their account via `/auth/upgrade`:
1. User provides real email address
2. System calls `supabase.auth.updateUser({ email })`
3. Confirmation email sent
4. Original username/password still works

### Phase 2: Email Required (Future)
When transitioning out of beta:
1. Re-enable "Confirm email" in Supabase
2. Require email for new signups
3. Existing users continue with current flow
4. Optionally migrate synthetic emails to real ones

## Development Notes

### Key Files
- `src/contexts/AuthContext.tsx` - Main auth logic with synthetic email handling
- `src/lib/validation.ts` - Username/password validation utilities
- `src/components/auth/RouteGuard.tsx` - Route protection component
- `src/pages/BetaJoin.tsx` - Signup page
- `src/pages/Login.tsx` - Login page

### Testing
- Create accounts with various usernames
- Test username validation edge cases
- Verify session persistence after refresh
- Check route guards work properly
- Test error messages for failed scenarios

## Security Considerations

✅ **Secure:**
- Usernames are publicly visible (by design)
- Passwords handled by Supabase Auth
- RLS policies protect user data
- Session management via Supabase

⚠️ **Beta Limitations:**
- No email recovery (users must remember username/password)
- No email notifications
- Synthetic emails could theoretically conflict with real ones (extremely unlikely)

## Troubleshooting

**Users can't create accounts:**
- Check that "Confirm email" is disabled in Supabase
- Verify URL configuration in Authentication settings

**Session not persisting:**
- Supabase client includes `persistSession: true` by default
- Check browser localStorage for supabase auth tokens

**Username already taken errors:**
- Verify profile creation happens after successful auth
- Check for case-sensitive username conflicts