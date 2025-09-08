import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import type { ProfileWithRelation } from '@/lib/profiles'
import { useEffect, useState } from 'react'
import { listHighlights, type Highlight } from '@/services/profiles'

type Props = {
  profile: ProfileWithRelation
  isOwnProfile: boolean
  onEdit?: () => void
}

export function ProfileHeader({ profile, isOwnProfile }: Props) {
  const coverUrl = profile.profile_cover_url || '/placeholder.svg'
  const [highlights, setHighlights] = useState<Highlight[]>([])
  useEffect(() => {
    listHighlights(profile.id).then(setHighlights)
  }, [profile.id])
  return (
    <div className="relative rounded-lg overflow-hidden mb-6 border border-emerald-800/40">
      <div className="h-48 md:h-64 w-full bg-emerald-900/30">
        <img src={coverUrl} alt="Cover" className="w-full h-full object-cover opacity-80" />
      </div>
      <div className="absolute -bottom-8 left-6 flex items-end gap-4">
        <div className="h-24 w-24 md:h-28 md:w-28 rounded-full ring-2 ring-emerald-600 bg-emerald-900/60 backdrop-blur overflow-hidden shadow-lg">
          <img src={profile.avatar_url || '/placeholder.svg'} alt={profile.display_name || profile.username} className="w-full h-full object-cover object-center" />
        </div>
        <div className="pb-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-emerald-50">{profile.display_name || profile.username}</h1>
          <p className="text-emerald-200/80">@{profile.username}</p>
        </div>
      </div>
      <div className="absolute top-3 right-3">
        {isOwnProfile ? (
          <Link to="/settings/profile">
            <Button variant="secondary" className="gap-2 bg-emerald-300 text-emerald-950 hover:bg-emerald-200">
              <Settings className="h-4 w-4" /> Edit Profile
            </Button>
          </Link>
        ) : null}
      </div>
      <div className="pt-10" />
      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="px-4 pb-4 flex items-center gap-3 overflow-x-auto">
          {highlights.map(h => (
            <div key={h.id} className="flex-shrink-0 w-20">
              <div className="w-20 h-20 rounded-full overflow-hidden border border-emerald-800/40 bg-emerald-900/40">
                <img src={h.cover_url || '/placeholder.svg'} alt={h.title} className="w-full h-full object-cover" />
              </div>
              <div className="mt-1 text-center text-xs text-emerald-200 truncate">{h.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


