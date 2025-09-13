import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
        className="relative w-full max-w-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 500 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-100/80 to-orange-100/80 dark:from-amber-900/50 dark:to-orange-900/50">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-amber-400 dark:border-amber-500">
              <AvatarImage src={currentEmber.author_avatar_url} alt={currentEmber.author_display_name} />
              <AvatarFallback className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 font-semibold">
                {(currentEmber.author_display_name || currentEmber.author_username)?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-base text-amber-900 dark:text-amber-100">{currentEmber.author_display_name || currentEmber.author_username}</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                {formatTimeRemaining(currentEmber.expires_at)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-200/50 dark:bg-amber-800/50 px-2 py-1 rounded-full">
              {currentIndex + 1} of {embers.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-amber-200/50 dark:hover:bg-amber-800/50 text-amber-700 dark:text-amber-300"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px] bg-gradient-to-b from-amber-25/30 to-orange-25/30 dark:from-amber-950/20 dark:to-orange-950/20">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <motion.div
                className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : postContent ? (
            <div className="space-y-6">
              <div className="bg-white/70 dark:bg-amber-950/30 rounded-xl p-5 border border-amber-200/50 dark:border-amber-700/50 shadow-sm">
                <p className="text-lg leading-relaxed text-amber-900 dark:text-amber-100 font-medium whitespace-pre-wrap">
                  {postContent.body}
                </p>
              </div>
              
              {postContent.media && Array.isArray(postContent.media) && postContent.media.length > 0 && (
                <div className="grid gap-3">
                  {postContent.media.map((item: any, index: number) => (
                    <div key={index} className="rounded-xl overflow-hidden border border-amber-200/50 dark:border-amber-700/50 shadow-md">
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.alt_text || 'Post image'}
                          className="w-full h-auto max-h-80 object-cover"
                        />
                      ) : item.type === 'video' ? (
                        <video
                          src={item.url}
                          poster={item.poster_url}
                          controls
                          className="w-full h-auto max-h-80"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-lg font-medium text-amber-800 dark:text-amber-200">Content not found</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">This ember may have expired or been removed</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        {embers.length > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/30 dark:to-orange-900/30">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              className="flex items-center gap-2 border-amber-300 dark:border-amber-700 bg-white/50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              className="flex items-center gap-2 border-amber-300 dark:border-amber-700 bg-white/50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Ember indicator dots */}
        <div className="flex justify-center gap-2 pb-6 bg-gradient-to-t from-amber-50 to-transparent dark:from-amber-950/30">
          {embers.map((_, index) => (
            <motion.button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-amber-500 shadow-lg shadow-amber-500/50 ring-2 ring-amber-300' 
                  : embers[index].is_viewed 
                    ? 'bg-green-400 shadow-md' 
                    : 'bg-amber-300 dark:bg-amber-700 hover:bg-amber-400 dark:hover:bg-amber-600'
              }`}
              onClick={() => setCurrentIndex(index)}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.8 }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}