import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { startConversation } from '@/lib/dm';

type Relation =
  | 'self'
  | 'none'
  | 'requested'     // you requested them
  | 'following'     // you follow them
  | 'follows_you'   // they follow you
  | 'mutual';       // both follow

type Props = {
  profileUserId: string;           // target user id
  relation: Relation;
  isPrivate: boolean;              // target privacy
  requestId?: string | null;       // if there is an open request you created or received
  isIncomingRequest?: boolean;     // true if requestId is someone requesting YOU
  onRelationChange?: (r: Relation, reqId?: string | null) => void;
};

// --- API helpers -------------------------------------------------------------

async function apiFollow(userId: string) {
  const { data, error } = await supabase.functions.invoke('follow', {
    body: { userId }
  });
  if (error) throw error;
  return data as { state: 'following' | 'requested'; requestId?: string };
}

async function apiUnfollow(userId: string) {
  const { error } = await supabase.functions.invoke('unfollow', {
    body: { userId }
  });
  if (error) throw error;
}

async function apiReqAccept(requestId: string) {
  const { error } = await supabase.functions.invoke('follow-requests/accept', {
    body: { requestId }
  });
  if (error) throw error;
}

async function apiReqDecline(requestId: string) {
  const { error } = await supabase.functions.invoke('follow-requests/decline', {
    body: { requestId }
  });
  if (error) throw error;
}

async function apiReqCancel(requestId: string) {
  const { error } = await supabase.functions.invoke('follow-requests/cancel', {
    body: { requestId }
  });
  if (error) throw error;
}

// --- UI component ------------------------------------------------------------

export default function ProfileCTA({
  profileUserId,
  relation: initialRelation,
  isPrivate,
  requestId: initialReqId,
  isIncomingRequest = false,
  onRelationChange,
}: Props) {
  const [relation, setRelation] = useState<Relation>(initialRelation);
  const [requestId, setRequestId] = useState<string | null>(initialReqId ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isSelf = relation === 'self';
  const isMutual = relation === 'mutual';

  function updateState(r: Relation, reqId: string | null = null) {
    setRelation(r);
    setRequestId(reqId);
    onRelationChange?.(r, reqId);
  }

  // State machine: relation + isPrivate -> primary label and action set
  function primaryLabel(): string {
    if (isSelf) return 'Edit Profile';
    if (relation === 'mutual') return 'Friends';
    if (relation === 'following') return 'Following';
    if (relation === 'requested') return 'Requested';
    if (relation === 'follows_you') return isPrivate ? 'Request' : 'Follow back';
    // relation === 'none'
    return isPrivate ? 'Request' : 'Follow';
  }

  // Primary button click
  async function onPrimary() {
    if (isSelf) {
      // route to settings
      window.location.href = '/profile-settings';
      return;
    }

    try {
      setSubmitting(true);

      // Accept incoming request quickly from the CTA if shown on your own profile view of them
      if (relation === 'follows_you' && isPrivate) {
        // private target but they already follow you; primary should be Request
        const res = await apiFollow(profileUserId);
        if (res.state === 'following') updateState('mutual');
        else updateState('requested', res.requestId ?? null);
        return;
      }

      if (relation === 'none') {
        const res = await apiFollow(profileUserId);
        if (res.state === 'following') updateState('following');
        else updateState('requested', res.requestId ?? null);
        return;
      }

      if (relation === 'requested') {
        // open menu to cancel
        setMenuOpen((v) => !v);
        return;
      }

      if (relation === 'following') {
        // open menu to unfollow
        setMenuOpen((v) => !v);
        return;
      }

      if (relation === 'mutual') {
        // open menu to unfollow
        setMenuOpen((v) => !v);
        return;
      }
    } catch (e) {
      console.error('[profile-cta] primary error', e);
      alert('Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Menu actions
  async function doUnfollow() {
    try {
      setSubmitting(true);
      // optimistic
      const prev = relation;
      updateState(prev === 'mutual' ? 'follows_you' : 'none');
      await apiUnfollow(profileUserId);
    } catch (e) {
      console.error('[profile-cta] unfollow error', e);
      alert('Could not unfollow.');
    } finally {
      setSubmitting(false);
      setMenuOpen(false);
    }
  }

  async function doCancelRequest() {
    if (!requestId) return;
    try {
      setSubmitting(true);
      updateState('none', null);
      await apiReqCancel(requestId);
    } catch (e) {
      console.error('[profile-cta] cancel request error', e);
      alert('Could not cancel request.');
      // ignore rollback for simplicity
    } finally {
      setSubmitting(false);
      setMenuOpen(false);
    }
  }

  // For incoming requests when viewing your own inbox or a request banner on profile
  async function acceptIncoming() {
    if (!requestId) return;
    try {
      setSubmitting(true);
      await apiReqAccept(requestId);
      // If they requested to follow you, they now follow you.
      // If you also follow them, this becomes mutual elsewhere.
      // Here, treat as "follows_you" unless you already follow them.
      updateState(relation === 'following' ? 'mutual' : 'follows_you', null);
    } catch (e) {
      console.error('[profile-cta] accept error', e);
      alert('Could not accept request.');
    } finally {
      setSubmitting(false);
    }
  }

  async function declineIncoming() {
    if (!requestId) return;
    try {
      setSubmitting(true);
      await apiReqDecline(requestId);
      updateState('none', null);
    } catch (e) {
      console.error('[profile-cta] decline error', e);
      alert('Could not decline request.');
    } finally {
      setSubmitting(false);
    }
  }

  // Handle DM button click
  const handleSendMessage = async () => {
    try {
      setSubmitting(true);
      const { conversationId } = await startConversation(profileUserId);
      navigate(`/messages/${conversationId}`);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Could not start conversation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render ---------------------------------------------------------------

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* Primary CTA */}
      <button
        disabled={submitting}
        onClick={onPrimary}
        className={`px-4 h-10 rounded-md text-sm font-medium transition-colors
          ${isSelf ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' :
            relation === 'none' ? 'bg-primary text-primary-foreground hover:bg-primary/90' :
            relation === 'requested' ? 'bg-secondary text-secondary-foreground' :
            relation === 'following' || relation === 'mutual' ? 'bg-muted text-muted-foreground hover:bg-muted/80' :
            'bg-primary text-primary-foreground hover:bg-primary/90'}
        `}
      >
        {primaryLabel()}
      </button>

      {/* DM button for mutual followers */}
      {isMutual && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendMessage}
          disabled={submitting}
          className="gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          Message
        </Button>
      )}

      {/* Incoming request controls if applicable */}
      {isIncomingRequest && requestId && (
        <div className="inline-flex gap-2">
          <button
            disabled={submitting}
            onClick={acceptIncoming}
            className="px-3 h-10 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
          >
            Accept
          </button>
          <button
            disabled={submitting}
            onClick={declineIncoming}
            className="px-3 h-10 rounded-md bg-muted text-muted-foreground text-sm hover:bg-muted/80"
          >
            Decline
          </button>
        </div>
      )}

      {/* Dropdown for states that need secondary action */}
      {menuOpen && (
        <div
          className="absolute z-10 top-11 left-0 w-44 rounded-md bg-popover text-popover-foreground shadow-lg border"
          onMouseLeave={() => setMenuOpen(false)}
        >
          {relation === 'following' || relation === 'mutual' ? (
            <button
              className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground"
              onClick={doUnfollow}
              disabled={submitting}
            >
              Unfollow
            </button>
          ) : null}

          {relation === 'requested' ? (
            <button
              className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground"
              onClick={doCancelRequest}
              disabled={submitting}
            >
              Cancel request
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}