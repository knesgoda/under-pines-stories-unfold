import React from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';

interface NewPostsBannerProps {
  count: number;
  onShowNewPosts: () => void;
  onDismiss: () => void;
  className?: string;
}

export function NewPostsBanner({ 
  count, 
  onShowNewPosts, 
  onDismiss, 
  className = '' 
}: NewPostsBannerProps) {
  return (
    <div className={`sticky top-4 z-10 ${className}`}>
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-emerald-950 rounded-2xl shadow-lg border border-amber-400/20 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-950/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">
                {count} new {count === 1 ? 'post' : 'posts'}
              </p>
              <p className="text-xs opacity-80">
                Click to see what's new
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onShowNewPosts}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/20 hover:bg-emerald-950/30 rounded-lg text-sm font-medium transition-colors"
            >
              <ArrowDown className="h-4 w-4" />
              Show
            </button>
            
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg hover:bg-emerald-950/20 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
