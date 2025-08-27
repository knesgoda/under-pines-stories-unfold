import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'
import PeopleTypeahead from '@/components/search/PeopleTypeahead'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [initialQ, setInitialQ] = useState(q)

  useEffect(() => setInitialQ(q), [q])

  return (
    <div className="min-h-screen bg-background-dark">
      <div className="max-w-3xl mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-light mb-4 flex items-center gap-2">
            <SearchIcon className="h-6 w-6" />
            Search People
          </h1>
          <PeopleTypeahead />
        </div>

        {initialQ && (
          <div className="mb-6">
            <p className="text-sm text-text-light/70">
              Results for <span className="text-text-light font-medium">"{initialQ}"</span>
            </p>
          </div>
        )}

        {!initialQ && (
          <div className="text-center py-12">
            <SearchIcon className="h-12 w-12 text-text-light/30 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-text-light mb-2">
              Find people to connect with
            </h2>
            <p className="text-text-light/70">
              Search by username, display name, or interests to discover new connections.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}