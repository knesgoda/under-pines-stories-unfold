import { useState } from 'react'
import { Play } from 'lucide-react'
import { MediaLightbox } from './MediaLightbox'
import { VideoPlayer } from './VideoPlayer'
import { type MediaItem } from '@/lib/media'

interface MediaGridProps {
  media: MediaItem[]
  className?: string
}

export function MediaGrid({ media, className = '' }: MediaGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)

  if (media.length === 0) return null

  const firstItem = media[0]
  
  // Video display
  if (firstItem.type === 'video') {
    return (
      <>
        <div className={`relative rounded-lg overflow-hidden bg-card-foreground/5 ${className}`}>
          <div className="aspect-video relative group cursor-pointer" onClick={() => setShowVideoPlayer(true)}>
            <img
              src={firstItem.poster_url}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-100 group-hover:opacity-80 transition-opacity">
              <div className="bg-black/70 rounded-full p-4">
                <Play className="h-8 w-8 text-white fill-white" />
              </div>
            </div>
            {firstItem.duration && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {Math.floor(firstItem.duration / 60)}:{Math.floor(firstItem.duration % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        </div>
        
        {showVideoPlayer && (
          <VideoPlayer
            src={firstItem.url}
            poster={firstItem.poster_url}
            onClose={() => setShowVideoPlayer(false)}
          />
        )}
      </>
    )
  }

  // Image display
  const images = media.filter(item => item.type === 'image')
  
  if (images.length === 1) {
    return (
      <>
        <div className={`rounded-lg overflow-hidden bg-card-foreground/5 ${className}`}>
          <img
            src={images[0].url}
            alt={images[0].alt_text || 'Image'}
            className="w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => setLightboxIndex(0)}
            loading="lazy"
          />
        </div>
        
        {lightboxIndex !== null && (
          <MediaLightbox
            images={images}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </>
    )
  }

  // Multiple images grid
  const gridCols = images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
  const displayImages = images.slice(0, 4)
  const remainingCount = images.length - 4

  return (
    <>
      <div className={`grid ${gridCols} gap-1 rounded-lg overflow-hidden bg-card-foreground/5 ${className}`}>
        {displayImages.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square cursor-pointer group"
            onClick={() => setLightboxIndex(index)}
          >
            <img
              src={image.url}
              alt={image.alt_text || `Image ${index + 1}`}
              className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
              loading="lazy"
            />
            
            {index === 3 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-xl font-semibold">
                  +{remainingCount}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {lightboxIndex !== null && (
        <MediaLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  )
}