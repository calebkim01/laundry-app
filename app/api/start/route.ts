import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { Machine } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { machine, user_name, user_phone, duration_minutes } = await req.json()

  if (!machine || !user_name || !user_phone || !duration_minutes) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Check if machine is already in use
  const { data: existing } = await supabase
    .from('laundry_sessions')
    .select('id')
    .eq('machine', machine as Machine)
    .is('completed_at', null)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Machine already in use' }, { status: 409 })
  }

  const estimated_end_at = new Date(
    Date.now() + duration_minutes * 60 * 1000
  ).toISOString()

  const { data, error } = await supabase
    .from('laundry_sessions')
    .insert({ machine, user_name, user_phone, estimated_end_at })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
