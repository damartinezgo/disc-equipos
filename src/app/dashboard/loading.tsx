import { Suspense } from 'react'

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#F7F8FA] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 h-10 w-3/4 rounded-lg bg-gray-200 animate-pulse" />
        <div className="mb-6 h-5 w-1/3 rounded-lg bg-gray-200 animate-pulse" />

        <div className="mb-6 flex flex-wrap gap-3">
          <div className="h-10 w-full max-w-xs rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-10 w-40 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-10 w-40 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-10 w-40 rounded-lg bg-gray-200 animate-pulse" />
        </div>

        <div className="h-96 w-full rounded-2xl bg-gray-200 animate-pulse" />
      </div>
    </main>
  )
}
