import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: sessions, error } = await supabase
    .from('laundry_sessions')
    .select('*')
    .lte('estimated_end_at', new Date().toISOString())
    .is('completed_at', null)
    .is('notified_at', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const machineLabel: Record<string, string> = {
    washer: '세탁기',
    dryer: '건조기',
  }

  const results = await Promise.allSettled(
    (sessions ?? []).map(async (session) => {
      const label = machineLabel[session.machine] ?? session.machine
      await sendWhatsAppMessage(
        session.user_phone,
        `🧺 ${session.user_name}님, ${label} 완료됐어요! 빨래 꺼내주세요 😊`
      )
      await supabase
        .from('laundry_sessions')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', session.id)
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({ sent, failed })
}
