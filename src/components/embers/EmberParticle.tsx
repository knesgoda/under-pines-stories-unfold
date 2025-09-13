import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ember, getEmberBrightness, formatTimeRemaining } from '@/services/embers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface EmberParticleProps {
  ember: Ember;
  onClick: (ember: Ember) => void;
  style?: React.CSSProperties;
}

export function EmberParticle({ ember, onClick, style }: EmberParticleProps) {
  const [brightness, setBrightness] = useState(1);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateBrightness = () => {
      const newBrightness = getEmberBrightness(ember.created_at, ember.expires_at);
      setBrightness(newBrightness);
      setTimeLeft(formatTimeRemaining(ember.expires_at));
    };

    updateBrightness();
    const interval = setInterval(updateBrightness, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [ember.created_at, ember.expires_at]);

  const handleClick = () => {
    onClick(ember);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <motion.button
      className="relative flex items-center gap-3 p-3 rounded-full bg-gradient-to-r from-amber-400/30 to-orange-400/30 dark:from-amber-600/20 dark:to-orange-600/20 backdrop-blur-sm border-2 border-amber-400/50 dark:border-amber-500/40 hover:border-amber-500/70 dark:hover:border-amber-400/60 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-lg hover:shadow-amber-500/25"
      style={{
        ...style,
        opacity: brightness,
        filter: `brightness(${brightness})`,
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Ember from ${ember.author_display_name || ember.author_username}, ${timeLeft} remaining. Activate to open.`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        boxShadow: [
          `0 0 10px rgba(245, 158, 11, ${brightness * 0.5})`,
          `0 0 20px rgba(245, 158, 11, ${brightness * 0.3})`,
          `0 0 10px rgba(245, 158, 11, ${brightness * 0.5})`,
        ],
      }}
      transition={{
        boxShadow: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    >
      {/* Ember glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-300/40 to-orange-300/40 dark:from-amber-500/30 dark:to-orange-500/30"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Author avatar */}
      <Avatar className="h-8 w-8 border-2 border-amber-400 dark:border-amber-500 shadow-sm">
        <AvatarImage src={ember.author_avatar_url} alt={ember.author_display_name} />
        <AvatarFallback className="text-sm bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 font-semibold">
          {(ember.author_display_name || ember.author_username)?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Ember content indicator */}
      <motion.div
        className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 shadow-md"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Viewed indicator */}
      {ember.is_viewed && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-green-400 shadow-md" />
      )}

      {/* Time remaining tooltip */}
      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-amber-900/90 dark:bg-amber-100/90 text-amber-100 dark:text-amber-900 text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg border border-amber-600/50 dark:border-amber-300/50">
        {timeLeft}
      </div>
    </motion.button>
  );
}