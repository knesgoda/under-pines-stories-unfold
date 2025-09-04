import * as React from "react";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { toZonedTime, format } from 'date-fns-tz';
import {
  MoreHorizontal,
  MessageCircle,
  Share2,
  Bookmark,
  Images,
  Film,
} from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { sharePost, type Post } from '@/lib/posts';
import PostReactions from '@/components/reactions/PostReactions';
import { CommentModal } from '@/components/comments/CommentModal';
import { supabase } from '@/integrations/supabase/client';
import { renderRichText } from '@/lib/renderRichText';

type MediaItem =
  | { type: "image"; url: string; alt?: string }
  | { type: "video"; url: string; poster?: string; alt?: string };

interface PostCardProps {
  post: Post;
}


export function PostCard({ post }: PostCardProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [open, setOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  const createdAt = new Date(post.created_at);
  const zonedTime = toZonedTime(createdAt, 'America/Los_Angeles');
  const relativeTime = formatDistanceToNow(createdAt, { addSuffix: true });
  const absoluteTime = format(zonedTime, 'MMM d, yyyy \'at\' h:mm a zzz', { 
    timeZone: 'America/Los_Angeles' 
  });

  // Load comment count
  useEffect(() => {
    const loadCommentCount = async () => {
      try {
        const { count, error } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)
          .eq('is_deleted', false);
        
        if (!error && count !== null) {
          setCommentCount(count);
        }
      } catch (error) {
        console.error('Error loading comment count:', error);
      }
    };

    loadCommentCount();
  }, [post.id]);

  // Convert post media to MediaItem format
  const mediaItems: MediaItem[] = post.media?.map(item => ({
    type: item.type,
    url: item.url,
    alt: item.alt_text,
    ...(item.type === 'video' && { poster: item.poster_url })
  })) || [];


  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      await sharePost(post.id);
      toast({
        title: "Post shared!",
        description: "Your post has been shared successfully.",
      });
    } catch (error) {
      console.error('Error sharing post:', error);
      toast({
        title: "Error",
        description: "Failed to share post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCommentChange = () => {
    // Reload comment count when comments change
    const loadCommentCount = async () => {
      try {
        const { count, error } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)
          .eq('is_deleted', false);
        
        if (!error && count !== null) {
          setCommentCount(count);
        }
      } catch (error) {
        console.error('Error loading comment count:', error);
      }
    };
    loadCommentCount();
  };

  return (
    <>
      <article
        className="
          group relative
          rounded-3xl p-0.5
          transition-transform duration-200
          hover:translate-y-[-1px]
        "
        aria-label={`Post by ${post.profiles.display_name || post.profiles.username}`}
      >
        {/* Glow rim */}
        <div
          className="
            pointer-events-none absolute inset-0 rounded-3xl
            bg-gradient-to-br from-emerald-500/20 via-amber-300/10 to-emerald-800/20
            opacity-40 blur-xl
          "
        />
        {/* Card body */}
        <div
          className="
            relative rounded-[1.35rem]
            border border-emerald-800/40
            bg-emerald-950/40
            backdrop-blur-md
            shadow-[0_8px_30px_rgba(0,0,0,0.35)]
            text-emerald-50
          "
        >
          {/* Header */}
          <header className="flex items-start gap-3 px-4 pt-4">
            <div className="relative">
              <Link to={`/${post.profiles.username}`}>
                <img
                  src={post.profiles.avatar_url || '/placeholder.svg'}
                  alt={post.profiles.display_name || post.profiles.username}
                  className="
                    h-10 w-10 rounded-full object-cover
                    ring-2 ring-emerald-600/40
                  "
                />
              </Link>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500/90 ring-2 ring-emerald-900" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  to={`/${post.profiles.username}`}
                  className="truncate text-[15px] font-semibold hover:underline text-emerald-50"
                >
                  {post.profiles.display_name || post.profiles.username}
                </Link>
                <span className="truncate text-sm text-emerald-200/70">
                  @{post.profiles.username}
                </span>
                <span className="text-sm text-emerald-200/50">•</span>
                <time 
                  className="text-sm text-emerald-200/70 cursor-help" 
                  title={absoluteTime}
                >
                  {relativeTime}
                </time>
              </div>
            </div>

            <button
              className="
                inline-flex h-8 w-8 items-center justify-center rounded-full
                text-emerald-100/80 hover:bg-emerald-900/50 hover:text-white
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
              "
              aria-label="Post menu"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </header>

          {/* Body text */}
          {post.body ? (
            <div className="px-4 pt-2 text-[15px] leading-6 text-emerald-50/95">
              {renderRichText(post.body)}
            </div>
          ) : null}

          {/* Media */}
          {mediaItems.length > 0 ? (
            <div className="px-4 pt-3">
              <MediaGrid media={mediaItems} />
            </div>
          ) : null}

          {/* Divider */}
          <div className="mx-4 my-3 h-px bg-emerald-800/40" />

          {/* Actions */}
          <footer className="flex items-center gap-2 px-2 pb-2">
            {/* Reactions - using existing PostReactions component */}
            <div className="flex items-center">
              <PostReactions postId={post.id} />
            </div>

            <button
              onClick={() => setOpen(true)}
              className="
                inline-flex items-center gap-2 rounded-full px-3 py-2
                text-sm text-emerald-100/90
                hover:bg-emerald-900/50 hover:text-white
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
              "
            >
              <MessageCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Comment</span>
              {commentCount > 0 && (
                <span className="ml-1 text-emerald-200/70">
                  {shortNumber(commentCount)}
                </span>
              )}
            </button>

            <button
              onClick={handleShare}
              disabled={isSharing}
              className="
                inline-flex items-center gap-2 rounded-full px-3 py-2
                text-sm text-emerald-100/90
                hover:bg-emerald-900/50 hover:text-white
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Share2 className="h-5 w-5" />
              <span className="hidden sm:inline">Share</span>
              {post.share_count > 0 && (
                <span className="ml-1 text-emerald-200/70">
                  {shortNumber(post.share_count)}
                </span>
              )}
            </button>

            <div className="ml-auto">
              <button
                className="
                  inline-flex items-center gap-2 rounded-full px-3 py-2
                  text-sm text-emerald-100/90
                  hover:bg-emerald-900/50 hover:text-white
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
                "
                aria-pressed={false}
                title="Save"
              >
                <Bookmark className="h-5 w-5" />
                <span className="hidden sm:inline">Save</span>
              </button>
            </div>
          </footer>
        </div>
      </article>

      {/* Comment Modal */}
      <CommentModal
        open={open}
        onClose={() => setOpen(false)}
        postId={post.id}
        onCommentChange={handleCommentChange}
      />
    </>
  );
}

/* ============== helpers ============== */

function shortNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

/* ============== subcomponents ============== */

function MediaGrid({ media }: { media: MediaItem[] }) {
  const count = media.length;

  if (count === 1) {
    const m = media[0];
    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-800/40 bg-black/30">
        {m.type === "image" ? (
          <img className="max-h-[540px] w-full object-cover" src={m.url} alt={m.alt || ""} />
        ) : (
          <VideoPoster item={m} />
        )}
        <MediaBadge item={m} />
      </div>
    );
  }

  // 2–4 grid
  return (
    <div
      className="
        grid gap-2
        overflow-hidden rounded-2xl border border-emerald-800/40
        bg-black/30
        "
      style={{
        gridTemplateColumns: count === 2 ? "1fr 1fr" : "1fr 1fr",
        gridTemplateRows: count === 2 ? "auto" : "180px 180px",
      }}
    >
      {media.slice(0, 4).map((m, i) => (
        <div key={i} className="relative">
          {m.type === "image" ? (
            <img
              className="h-full w-full object-cover"
              src={m.url}
              alt={m.alt || ""}
            />
          ) : (
            <VideoPoster item={m} />
          )}
          <MediaBadge item={m} />
        </div>
      ))}
    </div>
  );
}

function MediaBadge({ item }: { item: MediaItem }) {
  if (item.type === "image") {
    return (
      <div className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-900/70 px-2 py-1 text-xs text-white backdrop-blur">
        <Images className="h-4 w-4" /> Photo
      </div>
    );
  }
  return (
    <div className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-900/70 px-2 py-1 text-xs text-white backdrop-blur">
      <Film className="h-4 w-4" /> Video
    </div>
  );
}

function VideoPoster({ item }: { item: Extract<MediaItem, { type: "video" }> }) {
  return (
    <div className="relative">
      <img
        src={item.poster || "/placeholder.svg"}
        alt={item.alt || "Video"}
        className="max-h-[540px] w-full object-cover opacity-90"
      />
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-black/50">
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
