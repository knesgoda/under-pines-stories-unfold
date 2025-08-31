import Pantry from '@/components/game/Pantry'
import CraftPanel from '@/components/game/CraftPanel'

export default function Camp(){
  return (
    <div className="p-4 space-y-4">
      <Pantry />
      <CraftPanel />
    </div>
  )
}
