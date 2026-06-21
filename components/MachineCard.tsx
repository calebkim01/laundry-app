'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, LaundrySession, Machine } from '@/lib/supabase'
import StartModal from './StartModal'

interface Props {
  machine: Machine
}

function formatTimeLeft(estimatedEnd: string): string {
  const diff = new Date(estimatedEnd).getTime() - Date.now()
  if (diff <= 0) return '완료 대기 중'
  const mins = Math.floor(diff / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  return `${mins}분 ${secs}초 남음`
}

export default function MachineCard({ machine }: Props) {
  const [session, setSession] = useState<LaundrySession | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [completing, setCompleting] = useState(false)

  const label = machine === 'washer' ? '세탁기' : '건조기'
  const emoji = machine === 'washer' ? '👕' : '🌀'

  const fetchSession = useCallback(async () => {
    const { data } = await supabase
      .from('laundry_sessions')
      .select('*')
      .eq('machine', machine)
      .is('completed_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    setSession(data ?? null)
    setLoading(false)
  }, [machine])

  useEffect(() => {
    fetchSession()

    const channel = supabase
      .channel(`machine-${machine}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'laundry_sessions', filter: `machine=eq.${machine}` },
        () => fetchSession()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [machine, fetchSession])

  // Countdown timer
  useEffect(() => {
    if (!session) return
    const update = () => setTimeLeft(formatTimeLeft(session.estimated_end_at))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [session])

  async function handleComplete() {
    if (!session) return
    setCompleting(true)
    await fetch('/api/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: session.id }),
    })
    setCompleting(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md flex-1 min-w-[260px] animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    )
  }

  const inUse = !!session

  return (
    <>
      <div
        className={`bg-white rounded-2xl p-6 shadow-md flex-1 min-w-[260px] border-2 transition-colors ${
          inUse ? 'border-red-200' : 'border-green-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{emoji}</span>
          <h2 className="text-lg font-bold text-gray-800">{label}</h2>
        </div>

        <div
          className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-4 ${
            inUse ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
          }`}
        >
          {inUse ? '사용 중' : '비어있어요'}
        </div>

        {inUse && session ? (
          <div className="flex flex-col gap-3">
            <div className="text-gray-700">
              <span className="font-semibold text-gray-900">{session.user_name}</span>님 사용 중
            </div>
            <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              ⏱ {timeLeft}
            </div>
            <button
              onClick={handleComplete}
              disabled={completing}
              className="w-full py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {completing ? '처리 중...' : '완료했어요 ✓'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
          >
            시작하기
          </button>
        )}
      </div>

      {showModal && (
        <StartModal
          machine={machine}
          onClose={() => setShowModal(false)}
          onStarted={fetchSession}
        />
      )}
    </>
  )
}
