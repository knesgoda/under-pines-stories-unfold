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
      className="relative flex items-center gap-2 p-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 hover:border-amber-500/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
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
        className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400/30 to-orange-400/30"
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
      <Avatar className="h-6 w-6 border border-amber-500/50">
        <AvatarImage src={ember.author_avatar_url} alt={ember.author_display_name} />
        <AvatarFallback className="text-xs bg-amber-500/20 text-amber-100">
          {(ember.author_display_name || ember.author_username)?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Ember content indicator */}
      <motion.div
        className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
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
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-green-400" />
      )}

      {/* Time remaining tooltip */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {timeLeft}
      </div>
    </motion.button>
  );
}