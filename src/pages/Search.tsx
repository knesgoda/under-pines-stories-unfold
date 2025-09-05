import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Hash, FileText, UserPlus, Check, X } from 'lucide-react';
import { searchUsers, searchHashtags, searchPostsFTS, type SearchResult, type PostSearchResult } from '@/services/search';
import { sendRequest, acceptRequest, declineRequest, getRelationshipStatus, type Relationship } from '@/services/relationships';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

type TabType = 'people' | 'tags' | 'posts';

export default function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('people');
  const [isLoading, setIsLoading] = useState(false);
  const [people, setPeople] = useState<SearchResult[]>([]);
  const [tags, setTags] = useState<SearchResult[]>([]);
  const [posts, setPosts] = useState<PostSearchResult[]>([]);
  const [relationships, setRelationships] = useState<Map<string, Relationship>>(new Map());

  const search = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setPeople([]);
      setTags([]);
      setPosts([]);
      return;
    }

    setIsLoading(true);
    try {
      const [peopleResults, tagsResults, postsResults] = await Promise.all([
        searchUsers(searchQuery),
        searchHashtags(searchQuery),
        searchPostsFTS(searchQuery)
      ]);

      setPeople(peopleResults);
      setTags(tagsResults);
      setPosts(postsResults);

      // Relationships are currently disabled
      setRelationships(new Map());
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, search]);

  const handleSendRequest = async (targetUserId: string) => {
    // Relationships are currently disabled
    return;
  };

  const handleAcceptRequest = async (userId: string) => {
    // Relationships are currently disabled
    return;
  };

  const handleDeclineRequest = async (userId: string) => {
    // Relationships are currently disabled
    return;
  };

  const getRelationshipButton = (person: SearchResult) => {
    if (!user || person.id === user.id) return null;

    const relationship = relationships.get(person.id);

    if (!relationship) {
      return (
        <button
          onClick={() => handleSendRequest(person.id)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-800 text-emerald-50 rounded-lg hover:bg-emerald-700 transition-colors text-sm"
        >
          <UserPlus className="h-4 w-4" />
          Add Friend
        </button>
      );
    }

    if (relationship.state === 'requested') {
      return (
        <span className="px-3 py-1.5 bg-emerald-900/50 text-emerald-300 rounded-lg text-sm">
          Request sent
        </span>
      );
    } else if (relationship.state === 'accepted') {
      return (
        <span className="px-3 py-1.5 bg-emerald-800/50 text-emerald-200 rounded-lg text-sm">
          Friends
        </span>
      );
    } else if (relationship.state === 'blocked') {
      return (
        <span className="px-3 py-1.5 bg-red-900/50 text-red-300 rounded-lg text-sm">
          Blocked
        </span>
      );
    }
    
    return null;
  };

  const tabs = [
    { id: 'people' as TabType, label: 'People', icon: Users, count: people.length },
    { id: 'tags' as TabType, label: 'Tags', icon: Hash, count: tags.length },
    { id: 'posts' as TabType, label: 'Posts', icon: FileText, count: posts.length }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-0 md:ml-60 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-emerald-50 mb-4">Search</h1>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-400" />
              <input
                type="text"
                placeholder="Search people, tags, or posts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-emerald-950/50 border border-emerald-800/40 rounded-2xl text-emerald-50 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
        </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-800 text-emerald-50'
                      : 'bg-emerald-900/50 text-emerald-300 hover:bg-emerald-900/70'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="px-2 py-0.5 bg-emerald-700/50 text-xs rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-4"></div>
                <p className="text-emerald-300">Searching...</p>
              </div>
            ) : !query.trim() ? (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-emerald-400/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-emerald-50 mb-2">Start searching</h3>
                <p className="text-emerald-300">Enter a query to search for people, tags, or posts.</p>
              </div>
            ) : (
              <>
                {/* People Tab */}
                {activeTab === 'people' && (
                  <div className="space-y-4">
                    {people.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-emerald-400/50 mx-auto mb-3" />
                        <p className="text-emerald-300">No people found</p>
                      </div>
                    ) : (
                      people.map((person) => (
                        <div
                          key={person.id}
                          className="flex items-center gap-4 p-4 bg-emerald-950/50 border border-emerald-800/30 rounded-2xl"
                        >
                          <img
                            src={person.avatarUrl || '/placeholder.svg'}
                            alt={person.label}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/@${person.label}`}
                              className="text-emerald-50 font-medium hover:text-emerald-300 transition-colors"
                            >
                              {person.label}
                            </Link>
                            {person.sub && (
                              <p className="text-sm text-emerald-300/70 truncate">
                                {person.sub}
                              </p>
                            )}
                          </div>
                          {getRelationshipButton(person)}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tags Tab */}
                {activeTab === 'tags' && (
                  <div className="space-y-4">
                    {tags.length === 0 ? (
                      <div className="text-center py-8">
                        <Hash className="h-12 w-12 text-emerald-400/50 mx-auto mb-3" />
                        <p className="text-emerald-300">No tags found</p>
                      </div>
                    ) : (
                      tags.map((tag) => (
                        <Link
                          key={tag.id}
                          to={`/tag/${tag.label}`}
                          className="flex items-center gap-4 p-4 bg-emerald-950/50 border border-emerald-800/30 rounded-2xl hover:bg-emerald-900/30 transition-colors"
                        >
                          <div className="h-12 w-12 rounded-full bg-emerald-800 flex items-center justify-center">
                            <Hash className="h-6 w-6 text-emerald-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-emerald-50 font-medium">
                              #{tag.label}
                            </h3>
                            {tag.sub && (
                              <p className="text-sm text-emerald-300/70">
                                {tag.sub}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))
                    )}
          </div>
        )}

                {/* Posts Tab */}
                {activeTab === 'posts' && (
                  <div className="space-y-4">
                    {posts.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-emerald-400/50 mx-auto mb-3" />
                        <p className="text-emerald-300">No posts found</p>
                      </div>
                    ) : (
                      posts.map((post) => (
                        <Link
                          key={post.id}
                          to={`/post/${post.id}`}
                          className="block p-4 bg-emerald-950/50 border border-emerald-800/30 rounded-2xl hover:bg-emerald-900/30 transition-colors"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <img
                              src={post.author.avatar_url || '/placeholder.svg'}
                              alt={post.author.username}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-emerald-50 font-medium">
                                {post.author.display_name || post.author.username}
                              </p>
                              <p className="text-sm text-emerald-300/70">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <p className="text-emerald-200 line-clamp-3">
                            {post.body || 'No content available'}
                          </p>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}