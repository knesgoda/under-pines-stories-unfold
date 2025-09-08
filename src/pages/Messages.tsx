import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { DMThreadList } from '@/components/dm/DMThreadList';
import { DMMessageList } from '@/components/dm/DMMessageList';
import { DMComposer } from '@/components/dm/DMComposer';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, MessageCircle, Users } from 'lucide-react';

export default function Messages() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-emerald-50 mb-4">Please sign in</h1>
          <p className="text-emerald-300">You need to be signed in to view messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-0 md:ml-60 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              {conversationId && (
                <Link
                  to="/messages"
                  className="p-2 rounded-full hover:bg-emerald-900/50 text-emerald-100/90 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              )}
              <h1 className="text-2xl font-bold text-emerald-50 flex items-center gap-2">
                <MessageCircle className="h-6 w-6" />
                Messages
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Threads List */}
            <div className={`${conversationId ? 'hidden lg:block' : ''}`}>
              <DMThreadList />
            </div>

            {/* Messages View */}
            {conversationId ? (
              <div className="lg:col-span-2 flex flex-col bg-emerald-950/50 border border-emerald-800/40 rounded-2xl overflow-hidden">
                {/* Messages Header */}
                <div className="p-4 border-b border-emerald-800/40 bg-emerald-950/70">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-800/50 flex items-center justify-center">
                      <Users className="h-4 w-4 text-emerald-300" />
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-emerald-50">
                        Conversation
                      </h2>
                      <p className="text-xs text-emerald-400/60">
                        Direct message
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages List */}
                <DMMessageList dmId={conversationId} />

                {/* Message Composer */}
                <DMComposer dmId={conversationId} />
              </div>
            ) : (
              <div className="lg:col-span-2 flex items-center justify-center bg-emerald-950/50 border border-emerald-800/40 rounded-2xl">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-emerald-400/50 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-emerald-50 mb-2">
                    Select a conversation
                  </h2>
                  <p className="text-emerald-300/70">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}