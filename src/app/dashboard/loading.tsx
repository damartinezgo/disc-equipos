export default function DashboardLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-[#F7F8FA] to-white">
      <div className="flex flex-col items-center">
        <img
          src="/logo-rizoma.svg"
          alt="Rizoma Logo"
          className="mb-8 h-20 w-auto"
        />
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1F4E79] border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500 font-medium">Preparando tu experiencia…</p>
      </div>
    </main>
  )
}
