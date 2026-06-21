import MachineCard from '@/components/MachineCard'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-1 text-center">🧺 세탁실</h1>
        <p className="text-gray-500 text-center mb-8 text-sm">실시간 사용 현황</p>

        <div className="flex flex-col sm:flex-row gap-4">
          <MachineCard machine="washer" />
          <MachineCard machine="dryer" />
        </div>
      </div>
    </main>
  )
}
