import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type Machine = 'washer' | 'dryer'

export interface LaundrySession {
  id: string
  machine: Machine
  user_name: string
  user_phone: string
  started_at: string
  estimated_end_at: string
  completed_at: string | null
  notified_at: string | null
}

// Lazy singleton so the client is not instantiated at module evaluation time
let _supabase: SupabaseClient | null = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabase
}

// Convenience alias used in client components
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
