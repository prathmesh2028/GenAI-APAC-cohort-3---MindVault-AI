import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  MessageSquare,
  Trash2,
  ArrowRight,
  Sparkles,
  Tag,
  AlertTriangle,
  Loader2,
  ArrowUpDown,
  Lock,
  Clock,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Conversation } from '../types';
import { deleteConversation } from '../lib/conversations';
import { formatRelativeTime } from '../lib/insights';

interface HistoryViewProps {
  conversations: Conversation[];
  onOpenConversation: (conv: Conversation) => void;
  onRefreshConversations: () => void;
  onStartNewChat: () => void;
}

type SortOption = 'newest' | 'oldest' | 'messages';

export const HistoryView: React.FC<HistoryViewProps> = ({
  conversations,
  onOpenConversation,
  onRefreshConversations,
  onStartNewChat,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Extract all unique topics
  const allTopics = useMemo(() => {
    return Array.from(
      new Set(conversations.flatMap((c) => c.topics || []))
    ).filter(Boolean);
  }, [conversations]);

  // Filter & Sort
  const filteredAndSorted = useMemo(() => {
    const list = conversations.filter((conv) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        conv.title.toLowerCase().includes(q) ||
        conv.summary.toLowerCase().includes(q) ||
        conv.messages.some((m) => m.text.toLowerCase().includes(q));

      const matchesTopic = selectedTopic
        ? conv.topics?.includes(selectedTopic)
        : true;

      return matchesSearch && matchesTopic;
    });

    return list.sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortOption === 'oldest') {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      if (sortOption === 'messages') {
        return b.messages.length - a.messages.length;
      }
      return 0;
    });
  }, [conversations, searchQuery, selectedTopic, sortOption]);

  const handleDelete = async (convId: string) => {
    if (!user) return;
    setDeletingId(convId);
    try {
      await deleteConversation(user.uid, convId);
      setConfirmDeleteId(null);
      onRefreshConversations();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 mb-1">
            <Lock className="h-3 w-3 text-amber-600" />
            <span>Private User Records • Scoped to UID</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            Conversation History
          </h2>
          <p className="text-sm text-stone-500">
            Your private journal of multi-turn inquiries, thoughts, and Gemini dialogues ({conversations.length} saved).
          </p>
        </div>

        <button
          id="history-start-new-chat-btn"
          onClick={onStartNewChat}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-400 transition-colors shadow-2xs self-start cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            id="history-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across titles, summaries, and transcripts..."
            className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-700">
            <ArrowUpDown className="h-3.5 w-3.5 text-stone-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="messages">Most Messages</option>
            </select>
          </div>
        </div>
      </div>

      {/* Topic Pills Filter */}
      {allTopics.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            <span>Topics:</span>
          </span>
          <button
            onClick={() => setSelectedTopic(null)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0 cursor-pointer ${
              selectedTopic === null
                ? 'bg-stone-900 text-stone-100 font-semibold'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            All Topics
          </button>
          {allTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic === selectedTopic ? null : topic)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                selectedTopic === topic
                  ? 'bg-amber-500 text-stone-950 font-semibold'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              #{topic}
            </button>
          ))}
        </div>
      )}

      {/* Conversations Grid / List */}
      {filteredAndSorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-stone-900">
            {conversations.length === 0 ? 'No conversations saved yet' : 'No matching conversations found'}
          </h3>
          <p className="mt-1 text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
            {conversations.length === 0
              ? 'Start your first chat with Gemini and click "Save to Vault" to create an AI summary and record it here.'
              : 'Try clearing your search query or topic filter to view all archived sessions.'}
          </p>
          {conversations.length === 0 ? (
            <button
              onClick={onStartNewChat}
              className="mt-5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold text-stone-950 hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Start Conversation Now
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTopic(null);
              }}
              className="mt-4 text-xs font-semibold text-amber-700 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndSorted.map((conv) => (
            <div
              key={conv.id}
              id={`history-card-${conv.id}`}
              className="group relative flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h4
                    onClick={() => onOpenConversation(conv)}
                    className="text-base font-semibold text-stone-900 group-hover:text-amber-700 transition-colors cursor-pointer line-clamp-1"
                  >
                    {conv.title}
                  </h4>

                  <button
                    onClick={() => setConfirmDeleteId(conv.id)}
                    title="Delete conversation"
                    className="p-1 text-stone-400 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-2 text-xs text-stone-600 line-clamp-3 leading-relaxed">
                  {conv.summary || (conv.messages[1] ? conv.messages[1].text : 'No summary recorded.')}
                </p>

                {/* Topic Badges */}
                {conv.topics && conv.topics.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {conv.topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600"
                      >
                        <Tag className="h-2.5 w-2.5 text-stone-400" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-stone-400" />
                    {formatRelativeTime(conv.updatedAt)}
                  </span>
                  <span>•</span>
                  <span>{conv.messages.length} msgs</span>
                </div>

                <button
                  onClick={() => onOpenConversation(conv)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors cursor-pointer"
                >
                  <span>Reopen Dialogue</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Confirm Delete Overlay Dialog */}
              {confirmDeleteId === conv.id && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-stone-900/95 p-4 text-center text-stone-100 backdrop-blur-xs animate-in fade-in duration-150">
                  <AlertTriangle className="h-6 w-6 text-amber-400 mb-2" />
                  <p className="text-xs font-semibold">Permanently delete this conversation?</p>
                  <p className="text-[11px] text-stone-400 mt-1 max-w-xs">
                    This will remove the session from your Firestore vault and exclude it from future reflections.
                  </p>
                  <div className="mt-4 flex items-center gap-2.5">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(conv.id)}
                      disabled={deletingId === conv.id}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 flex items-center gap-1 cursor-pointer"
                    >
                      {deletingId === conv.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        'Delete Permanently'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
