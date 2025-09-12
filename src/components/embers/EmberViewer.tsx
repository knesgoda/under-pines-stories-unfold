import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Ember, markEmberViewed, formatTimeRemaining } from '@/services/embers';
import { supabase } from '@/integrations/supabase/client';

interface EmberViewerProps {
  embers: Ember[];
  initialIndex: number;
  onClose: () => void;
  onEmberViewed: (emberId: string) => void;
}

interface PostContent {
  id: string;
  body: string;
  created_at: string;
  media: any;
  author: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export function EmberViewer({ embers, initialIndex, onClose, onEmberViewed }: EmberViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [postContent, setPostContent] = useState<PostContent | null>(null);
  const [loading, setLoading] = useState(true);

  const currentEmber = embers[currentIndex];

  // Fetch post content for current ember
  useEffect(() => {
    const fetchPostContent = async () => {
      if (!currentEmber || currentEmber.content_type !== 'post') return;

      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          body,
          created_at,
          media,
          author:profiles!posts_author_id_fkey(
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('id', currentEmber.content_ref)
        .single();

      if (error) {
        console.error('Error fetching post content:', error);
      } else {
        setPostContent(data);
      }
      setLoading(false);
    };

    fetchPostContent();
  }, [currentEmber]);

  // Mark ember as viewed when opened
  useEffect(() => {
    const markViewed = async () => {
      if (currentEmber && !currentEmber.is_viewed) {
        const success = await markEmberViewed(currentEmber.id);
        if (success) {
          onEmberViewed(currentEmber.id);
        }
      }
    };

    markViewed();
  }, [currentEmber, onEmberViewed]);

  const goToPrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : embers.length - 1);
  };

  const goToNext = () => {
    setCurrentIndex(prev => prev < embers.length - 1 ? prev + 1 : 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  const handleBurstAnimation = () => {
    // This could trigger a burst animation in the strip
    // For now, just close after a short delay
    setTimeout(onClose, 300);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <motion.div
        className="relative w-full max-w-lg bg-card border border-border rounded-lg overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 500 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border border-amber-500/50">
              <AvatarImage src={currentEmber.author_avatar_url} alt={currentEmber.author_display_name} />
              <AvatarFallback className="bg-amber-500/20 text-amber-100">
                {(currentEmber.author_display_name || currentEmber.author_username)?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{currentEmber.author_display_name || currentEmber.author_username}</p>
              <p className="text-xs text-muted-foreground">{formatTimeRemaining(currentEmber.expires_at)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1} of {embers.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <motion.div
                className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : postContent ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed">{postContent.body}</p>
              
              {postContent.media && Array.isArray(postContent.media) && postContent.media.length > 0 && (
                <div className="grid gap-2">
                  {postContent.media.map((item: any, index: number) => (
                    <div key={index} className="rounded-lg overflow-hidden">
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.alt_text || 'Post image'}
                          className="w-full h-auto max-h-64 object-cover"
                        />
                      ) : item.type === 'video' ? (
                        <video
                          src={item.url}
                          poster={item.poster_url}
                          controls
                          className="w-full h-auto max-h-64"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Content not found
            </div>
          )}
        </div>

        {/* Navigation */}
        {embers.length > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Ember indicator dots */}
        <div className="flex justify-center gap-1 pb-4">
          {embers.map((_, index) => (
            <motion.button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex 
                  ? 'bg-amber-500' 
                  : embers[index].is_viewed 
                    ? 'bg-green-500/50' 
                    : 'bg-muted-foreground/30'
              }`}
              onClick={() => setCurrentIndex(index)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}