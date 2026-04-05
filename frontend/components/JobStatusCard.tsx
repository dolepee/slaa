export function JobStatusCard({ jobId }: { jobId: number }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Job #{jobId}</h3>
          <p className="text-sm text-gray-500 mt-1">Connect wallet to view details</p>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
          USDC
        </span>
      </div>
    </div>
  )
}
