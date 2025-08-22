import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

const SUPABASE_URL = "https://rxlrwephzfsmzspyjsdd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bHJ3ZXBoemZzbXpzcHlqc2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTU1NjUsImV4cCI6MjA3MTM3MTU2NX0.PZj0637CTCnwZOjNxHoAqODFELA7BBrnLj_KkqNidA4";

export function createServerSupabaseClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}