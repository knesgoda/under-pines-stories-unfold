import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmberParticle } from './EmberParticle';
import { EmberViewer } from './EmberViewer';
import { Ember, getUserEmbers } from '@/services/embers';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles } from 'lucide-react';

export function EmberStrip() {
  const [embers, setEmbers] = useState<Ember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmber, setSelectedEmber] = useState<Ember | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const { user } = useAuth();

  const fetchEmbers = async () => {
    if (!user) return;
    
    setLoading(true);
    const fetchedEmbers = await getUserEmbers(12);
    setEmbers(fetchedEmbers);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmbers();
    
    // Refresh every 5 minutes to catch new embers and remove expired ones
    const interval = setInterval(fetchEmbers, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  const handleEmberClick = (ember: Ember) => {
    const index = embers.findIndex(e => e.id === ember.id);
    setViewerIndex(index);
    setSelectedEmber(ember);
  };

  const closeViewer = () => {
    setSelectedEmber(null);
  };

  const unviewedCount = embers.filter(ember => !ember.is_viewed).length;

  if (!user) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-background/90 via-background/95 to-background/90 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <div className="flex items-center gap-2 mr-4">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-foreground/80">Embers</span>
            {unviewedCount > 0 && (
              <span className="px-2 py-1 bg-amber-500 text-amber-950 text-xs font-bold rounded-full">
                {unviewedCount}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-3 py-2">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-full bg-muted animate-pulse">
                    <div className="w-6 h-6 bg-muted-foreground/20 rounded-full" />
                    <div className="w-2 h-2 bg-muted-foreground/20 rounded-full" />
                  </div>
                ))
              ) : embers.length > 0 ? (
                <AnimatePresence>
                  {embers.map((ember, index) => (
                    <motion.div
                      key={ember.id}
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        x: Math.sin(Date.now() / 2000 + index) * 5, // Gentle float
                      }}
                      exit={{ opacity: 0, scale: 0.5, y: -20 }}
                      transition={{ 
                        duration: 0.5,
                        delay: index * 0.1,
                        x: {
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                      }}
                    >
                      <EmberParticle
                        ember={ember}
                        onClick={handleEmberClick}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                // Empty state
                <motion.div
                  className="flex items-center gap-2 text-muted-foreground text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="w-3 h-3 rounded-full bg-amber-500/30"
                    animate={{
                      opacity: [0.3, 0.8, 0.3],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <span>No new embers — create a post to spark one</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind fixed strip */}
      <div className="h-16" />

      {/* Ember Viewer Modal */}
      {selectedEmber && (
        <EmberViewer
          embers={embers}
          initialIndex={viewerIndex}
          onClose={closeViewer}
          onEmberViewed={(emberId) => {
            setEmbers(prev => prev.map(e => 
              e.id === emberId ? { ...e, is_viewed: true } : e
            ));
          }}
        />
      )}
    </>
  );
}