// app/api/unfurl/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const BYTES_CAP = 1_000_000; // 1MB
const FETCH_TIMEOUT = 5000;

function supabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookies().get(name)?.value,
        set() {},
        remove() {},
      },
    }
  );
}

function isHttpUrl(u: string) {
  try {
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch { return false; }
}

function parseMeta(html: string) {
  // lightweight OG/Twitter extractor
  const get = (prop: string) => {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
    const m = html.match(re);
    return m?.[1] || '';
  };
  const title = get('og:title') || get('twitter:title') || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '');
  const description = get('og:description') || get('twitter:description') || '';
  const image = get('og:image') || get('twitter:image') || '';
  const site = get('og:site_name') || get('twitter:site') || '';
  return { title: title.trim(), description: description.trim(), image_url: image.trim(), site_name: site.trim() };
}

async function fetchWithCaps(url: string) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'UnderPinesBot/1.0 (+https://underpines.app)',
        'accept': 'text/html,application/xhtml+xml',
      },
      cache: 'no-store',
    });
    const reader = res.body?.getReader();
    let received = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          received += value.byteLength;
          if (received > BYTES_CAP) throw new Error('too_large');
          chunks.push(value);
        }
      }
    }
    const html = Buffer.concat(chunks).toString('utf8');
    return { ok: true, status: res.status, html };
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: Request) {
  const { url } = await req.json().catch(() => ({}));
  if (!url || typeof url !== 'string' || !isHttpUrl(url) || url.length > 2048) {
    return NextResponse.json({ error: 'bad_url' }, { status: 400 });
  }

  const sb = supabase();

  // cache hit?
  const { data: cached } = await sb
    .from('link_previews')
    .select('*')
    .eq('url', url)
    .maybeSingle();

  if (cached && cached.fetched_at && Date.now() - new Date(cached.fetched_at).getTime() < ONE_DAY_MS) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'public, max-age=300' } });
  }

  try {
    const res = await fetchWithCaps(url);
    const meta = res.ok ? parseMeta(res.html) : { title: '', description: '', image_url: '', site_name: '' };
    const row = {
      url,
      title: meta.title,
      description: meta.description,
      image_url: meta.image_url,
      site_name: meta.site_name,
      fetched_at: new Date().toISOString(),
      status: res.ok ? 200 : 500,
    };

    await sb.from('link_previews').upsert(row);
    return NextResponse.json(row, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '';
    const row = {
      url,
      title: '',
      description: '',
      image_url: '',
      site_name: '',
      fetched_at: new Date().toISOString(),
      status: message === 'too_large' ? 413 : 408,
    };
    await sb.from('link_previews').upsert(row);
    return NextResponse.json(row, { headers: { 'Cache-Control': 'public, max-age=120' } });
  }
}

