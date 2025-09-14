import Pantry from '@/components/game/Pantry'
import CraftPanel from '@/components/game/CraftPanel'
import CampfireCircle from '@/components/game/CampfireCircle'

export default function Camp(){
  return (
    <div className="p-4 space-y-4">
      <CampfireCircle />
      <Pantry />
      <CraftPanel />
    </div>
  )
}
