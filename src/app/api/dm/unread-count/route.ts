import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const sb = createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return NextResponse.json({ count: 0 });
  
  // Placeholder for DM unread count - return 0 for now since DM feature isn't fully implemented
  return NextResponse.json({ count: 0 });
}
