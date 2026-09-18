import { createClient } from '@supabase/supabase-js'

let _supabase: any = null

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqbhvarahkdqlrtnxuwb.supabase.co'
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_nqxBgCGT5nXq1Kc7d1tyZg_zRTaBmOu'
    _supabase = createClient(url, key, { auth: { autoRefreshToken: true, persistSession: true } })
  }
  return _supabase
}
