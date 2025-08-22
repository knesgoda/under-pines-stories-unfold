import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface InterestCardProps {
  title: string
  image: string
  description?: string
  memberCount?: string
  className?: string
  onClick?: () => void
}

export function InterestCard({ 
  title, 
  image, 
  description, 
  memberCount, 
  className, 
  onClick 
}: InterestCardProps) {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden cursor-pointer group",
        "hover:scale-105 hover:shadow-glow transition-all duration-300",
        "bg-gradient-to-br from-bg-panel to-bg-panel/80",
        className
      )}
      onClick={onClick}
    >
      <div className="aspect-[4/3] relative">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover rounded-t-md"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/60 via-transparent to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-semibold text-text-light mb-1">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-text-light/80 line-clamp-2">
              {description}
            </p>
          )}
          {memberCount && (
            <p className="text-xs text-accent-glow mt-2">
              {memberCount}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}