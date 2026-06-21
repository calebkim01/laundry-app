import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { id } = await req.json()

  if (!id) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('laundry_sessions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', id)
    .is('completed_at', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
