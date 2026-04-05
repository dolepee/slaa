export function AgentCard({ tokenId }: { tokenId: number }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Agent #{tokenId}</h3>
          <p className="text-sm text-gray-500">Connect wallet to view details</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
          ID #{tokenId}
        </span>
      </div>
    </div>
  )
}
