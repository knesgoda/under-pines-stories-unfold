# Production Readiness Checklist

Use this issue to track tasks for hardening Under Pines for production.

## 1. Security & Privacy
- [ ] RLS audit: enable RLS and sane policies on every public table.
- [ ] Review security-definer functions and ensure each sets a safe `search_path` and validates auth/ownership.
- [ ] Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and rotate VAPID and anon keys.
- [ ] Re-enable email confirmation, add password reset, consider TOTP 2FA, and configure SMTP with SPF/DKIM/DMARC.
- [ ] For POST/PUT/DELETE routes, enforce same-origin and JSON content type.
- [ ] Rate-limit write endpoints.
- [ ] Add strict security headers (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy).
- [ ] Throttle signups and new-posts with CAPTCHA and cooldowns.

## 2. Reliability & Scalability
- [ ] Enable automated DB backups and test restores; mirror storage off-site.
- [ ] One migration per change, forward-only; plan for rollbacks via feature flags.
- [ ] Add missing indexes and set a global `statement_timeout`.
- [ ] Use connection pooling and avoid N+1 queries.
- [ ] Serve media via CDN with long cache-control; schedule GC for orphans.
- [ ] Schedule jobs for pruning old previews, deleting stale requests, and compacting analytics.

## 3. Observability & Ops
- [ ] Add Sentry to frontend and API routes.
- [ ] Log non-200 API responses with structured data (user_id, route, latency, code).
- [ ] Provide `/api/health` and set up external uptime monitoring and alerts.
- [ ] Implement feature flags to disable signups, posting, DMs, push, and enable read-only mode.
- [ ] Define SLOs and surface them on an admin dashboard.

## 4. Compliance & Policy
- [ ] Publish Privacy Policy and Terms of Service in footer, signup, and settings.
- [ ] Implement `/api/me/export` and `/api/me/delete` for data rights; soft-delete then purge media.
- [ ] Add age gating or block users under 13.
- [ ] Write content policy and DMCA process with a takedown contact.

## 5. Performance & UX
- [ ] Monitor Next.js bundle size and code-split heavy pages.
- [ ] Cache API GETs (SWR, ETag) and increase CDN TTLs where stable.
- [ ] Ensure accessibility: keyboard nav, focus rings, alt text, color contrast.
- [ ] Test PWA on iOS including push permission and notification click-through.

## 6. Testing
- [ ] Add unit tests for utils and helpers.
- [ ] Add integration tests for API routes with local Postgres or Supabase preview project.
- [ ] Add E2E tests for critical flows (signup, posts, follows, DMs, notifications, etc.).
- [ ] Load test with 200–1k concurrent users and monitor DB and latency.

## 7. Final Production Setup
- [ ] Configure custom domain with HTTPS and redirects.
- [ ] Configure email sender domain with SPF/DKIM/DMARC and re-enable confirmation.
- [ ] Separate prod/stage/dev environments and Supabase projects.
- [ ] Rotate all keys and secure dashboard access with SSO/2FA.
- [ ] Verify all tables have RLS enabled.
- [ ] Run restore drill and media GC.
- [ ] Ensure Sentry and uptime monitors show green for 24–48h.
- [ ] Test feature flags (READ_ONLY, DISABLE_DMS, DISABLE_SIGNUPS).
- [ ] Publish legal pages and monitor report/takedown mailbox.
- [ ] Lighthouse score: Performance ≥85, A11y ≥90 on key pages.

## Quick Hardening Snippets
See repo `scripts/preflight.js` for RLS and SECURITY DEFINER checks.
