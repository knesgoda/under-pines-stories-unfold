// lib/push/send.ts
// npm i web-push
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://underpines.app';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[push] Missing SUPABASE_SERVICE_ROLE_KEY — push sending will be disabled.');
}

webpush.setVapidDetails(`mailto:hello@underpines.app`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const admin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

type PushPayload = {
  title: string;
  body: string;
  deeplink?: string;
  icon?: string;
};

function withinQuietHours(now: Date, start?: string | null, end?: string | null): boolean {
  if (!start || !end) return false;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  // quiet may wrap past midnight
  return s <= e ? (mins >= s && mins <= e) : (mins >= s || mins <= e);
}

export async function sendPush(userId: string, payload: PushPayload, category?: 'follow'|'requests'|'comments'|'likes'|'dms') {
  if (!admin || !SUPABASE_SERVICE_ROLE_KEY) return;

  // read settings
  const { data: settings } = await admin
    .from('user_notification_settings')
    .select('push_follow, push_requests, push_comments, push_likes, push_dms, quiet_start, quiet_end')
    .eq('user_id', userId)
    .maybeSingle();

  // category toggle
  if (settings) {
    const allow =
      (category === 'follow'   && settings.push_follow)   ||
      (category === 'requests' && settings.push_requests) ||
      (category === 'comments' && settings.push_comments) ||
      (category === 'likes'    && settings.push_likes)    ||
      (category === 'dms'      && settings.push_dms);
    if (category && allow === false) return;
    const now = new Date();
    if (withinQuietHours(now, settings.quiet_start, settings.quiet_end)) return;
  }

  // subscriptions
  const { data: subs } = await admin
    .from('user_push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (!subs || subs.length === 0) return;

  const notification = {
    title: payload.title,
    body: payload.body,
    icon: payload.icon || `${APP_ORIGIN}/icons/icon-192.png`,
    data: { deeplink: payload.deeplink || APP_ORIGIN },
  };

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } } as any,
          JSON.stringify(notification),
          { TTL: 60 }
        );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        // prune expired endpoints
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await admin.from('user_push_subscriptions').delete().eq('id', s.id);
        } else {
          console.error('[push] send error', err?.statusCode || err?.message);
        }
      }
    })
  );
}

