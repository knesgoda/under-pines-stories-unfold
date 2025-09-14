'use client';
import { useState } from 'react';
import GiftModal from './GiftModal';

export default function CampfireCircle() {
  const [showGiftModal, setShowGiftModal] = useState(false);

  return (
    <>
      <div className="rounded-lg border border-orange-500/20 bg-gradient-to-br from-orange-900/20 to-amber-900/20 p-4">
        <div className="text-center">
          <div className="text-6xl mb-2">🔥</div>
          <div className="text-lg font-semibold text-orange-200 mb-1">Main Campfire</div>
          <div className="text-sm text-orange-300/80 mb-4">
            The central gathering place where all campers can craft together
          </div>
          
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setShowGiftModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              🎁 Send Gift
            </button>
          </div>
          
          <div className="text-xs text-orange-400/60 mt-3">
            Use fire and ingredients to craft s'mores and hot dogs!
          </div>
        </div>
      </div>
      
      <GiftModal open={showGiftModal} onClose={() => setShowGiftModal(false)} />
    </>
  );
}