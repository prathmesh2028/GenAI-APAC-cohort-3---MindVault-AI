import React from 'react';
import {
  MessageSquarePlus,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  Lock,
  Flame,
  CheckCircle2,
  Clock,
  Compass,
  TrendingUp,
  Tag,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Conversation, WeeklyReflection, NavTab } from '../types';
import { formatRelativeTime, calculateReflectionStreak, extractMindPatterns } from '../lib/insights';

interface DashboardViewProps {
  conversations: Conversation[];
  latestReflection: WeeklyReflection | null;
  reflections?: WeeklyReflection[];
  onNavigate: (tab: NavTab) => void;
  onOpenConversation: (conv: Conversation) => void;
  loading: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  conversations,
  latestReflection,
  reflections = [],
  onNavigate,
  onOpenConversation,
  loading,
}) => {
  const { user } = useAuth();
  const userName = user?.displayName ? user.displayName.split(' ')[0] : 'Explorer';

  // Compute metrics
  const totalReflections = reflections.length > 0 ? reflections.length : latestReflection ? 1 : 0;
  const recentActivityDate = conversations[0]?.updatedAt || latestReflection?.createdAt || '';
  const recentActivityStr = formatRelativeTime(recentActivityDate);
  const streak = calculateReflectionStreak(conversations, reflections.length > 0 ? reflections : latestReflection ? [latestReflection] : []);
  const mindPatterns = extractMindPatterns(conversations);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Learning':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Career':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Projects':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Goals':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Decisions':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Personal Growth':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Challenges':
        return 'bg-stone-100 text-stone-700 border-stone-300';
      default:
        return 'bg-stone-50 text-stone-600 border-stone-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome & Command Center Banner */}
      <div
        id="dashboard-welcome-banner"
        className="relative overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 px-7 py-8 text-stone-100 shadow-sm"
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-400/20">
                <Lock className="h-3 w-3" />
                <span>Private Vault • Account UID Isolated</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-stone-800 px-3 py-1 text-xs font-medium text-stone-300 ring-1 ring-stone-700">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span>Encrypted Session</span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-100">
              Welcome to your Vault, {userName}
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed">
              Your private sanctuary for multi-turn inquiry, cognitive clarity, and weekly AI reflection.
              All thoughts remain strictly bound to your authenticated credentials.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="dashboard-start-reflection-btn"
              onClick={() => onNavigate('reflection')}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-stone-950 shadow-sm hover:bg-amber-400 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-stone-900"
            >
              <Sparkles className="h-4 w-4" />
              <span>Start a New Reflection</span>
            </button>

            <button
              id="dashboard-start-chat-btn"
              onClick={() => onNavigate('chat')}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-700 bg-stone-800/90 px-4 py-3 text-sm font-medium text-stone-200 hover:bg-stone-700 hover:text-white transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              <MessageSquarePlus className="h-4 w-4 text-amber-400" />
              <span>New Conversation</span>
            </button>
          </div>
        </div>

        {/* Decorative subtle ambient backdrop glow */}
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* 4 Summary Cards: Command Center Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Total Conversations */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs hover:border-stone-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Total Conversations
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-stone-900">{conversations.length}</p>
          <p className="mt-1 text-xs text-stone-500 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Stored privately</span>
          </p>
        </div>

        {/* Metric 2: Reflections Generated */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs hover:border-stone-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Reflections Generated
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-stone-900">{totalReflections}</p>
          <p className="mt-1 text-xs text-stone-500">
            {latestReflection ? 'Latest cycle active' : 'Ready to generate'}
          </p>
        </div>

        {/* Metric 3: Recent Activity */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs hover:border-stone-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Recent Activity
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-stone-900 truncate">
            {recentActivityStr}
          </p>
          <p className="mt-1 text-xs text-stone-500">Last vault synchronization</p>
        </div>

        {/* Metric 4: Current Reflection Streak */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs hover:border-stone-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Reflection Streak
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-stone-900 flex items-center gap-1.5">
            <span>{streak.count}</span>
            <span className="text-sm font-normal text-stone-500">{streak.unit}</span>
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {streak.count > 0 ? 'Consistent thinking habit' : 'Reflect today to start'}
          </p>
        </div>
      </div>

      {/* Mind Patterns Section (Personal Insight System) */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <span>Mind Patterns</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Recurring focus areas and cognitive themes detected strictly across your stored conversations.
            </p>
          </div>
          <div className="text-[11px] text-stone-400 font-medium">
            Based on {conversations.length} saved sessions
          </div>
        </div>

        {mindPatterns.length === 0 ? (
          <div className="rounded-xl bg-stone-50 border border-stone-200/80 p-5 text-center">
            <p className="text-xs text-stone-600">
              No recurring patterns detected yet. Save your conversations in MindVault, and your cognitive themes (Learning, Career, Projects, Goals, Decisions) will crystallize here automatically.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5 pt-1">
            {mindPatterns.map((pattern, idx) => (
              <div
                key={idx}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium ${getCategoryColor(
                  pattern.category
                )}`}
              >
                <Tag className="h-3 w-3 opacity-70" />
                <span>{pattern.name}</span>
                <span className="rounded-full bg-white/70 px-1.5 py-0.2 text-[10px] font-semibold text-stone-800">
                  {pattern.count}x
                </span>
                <span className="text-[10px] opacity-70">({pattern.category})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Split: Continue Thinking (Recent Conversations) + Your Mind This Week (Hero Reflection) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Continue Thinking */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-stone-900">Continue Thinking</h3>
              <p className="text-xs text-stone-500">Pick up where you left off in your private dialogues.</p>
            </div>
            {conversations.length > 0 && (
              <button
                id="view-all-history-btn"
                onClick={() => onNavigate('history')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View all history ({conversations.length})</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-stone-200 bg-white">
              <div className="text-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto" />
                <p className="mt-2 text-xs text-stone-500">Loading your private vault...</p>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            /* Empty State */
            <div
              id="dashboard-empty-conversations"
              className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/70 p-8 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20">
                <MessageSquarePlus className="h-6 w-6" />
              </div>
              <h4 className="mt-4 text-base font-semibold text-stone-900">Your Vault is ready for its first thought</h4>
              <p className="mt-1.5 text-sm text-stone-500 max-w-md mx-auto">
                Discuss an architecture, reflect on an ambiguous decision, or break down a complex problem. Click "Save to Vault" when finished to generate intelligent summaries and weekly insights.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {[
                  'Help me reflect on my week',
                  'Turn my thoughts into a clear plan',
                  'I’m feeling stuck on a decision',
                  'Summarize what I’ve learned recently',
                ].map((promptIdea, idx) => (
                  <button
                    key={idx}
                    onClick={() => onNavigate('chat')}
                    className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 hover:border-amber-400 hover:bg-amber-50/50 transition-colors cursor-pointer"
                  >
                    "{promptIdea}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.slice(0, 4).map((conv) => (
                <div
                  key={conv.id}
                  id={`recent-conv-${conv.id}`}
                  onClick={() => onOpenConversation(conv)}
                  className="group rounded-xl border border-stone-200 bg-white p-4.5 transition-all hover:border-amber-300 hover:shadow-xs cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-stone-900 group-hover:text-amber-700 transition-colors truncate">
                          {conv.title}
                        </h4>
                      </div>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {conv.summary || (conv.messages[1] ? conv.messages[1].text : 'No summary recorded.')}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-stone-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                    <span className="flex items-center gap-1 text-stone-500 font-medium">
                      <Calendar className="h-3 w-3 text-stone-400" />
                      {formatRelativeTime(conv.updatedAt)}
                    </span>
                    <span>•</span>
                    <span>{conv.messages.length} messages</span>
                    {conv.topics && conv.topics.length > 0 && (
                      <div className="flex items-center gap-1 ml-auto flex-wrap">
                        {conv.topics.slice(0, 3).map((topic, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-stone-100 px-2 py-0.5 font-medium text-stone-600 text-[10px]"
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: "Your Mind This Week" (Hero Reflection Preview) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-stone-900">Your Mind This Week</h3>
            <button
              id="open-reflection-tab-btn"
              onClick={() => onNavigate('reflection')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer"
            >
              Reflection Hub →
            </button>
          </div>

          <div
            id="dashboard-reflection-card"
            className="rounded-2xl border border-stone-800 bg-stone-900 p-6 text-stone-100 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300 ring-1 ring-amber-400/20">
                <Sparkles className="h-3 w-3" />
                <span>Executive Synthesis</span>
              </div>
              <span className="text-[11px] text-stone-400">
                {latestReflection
                  ? new Date(latestReflection.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Pending'}
              </span>
            </div>

            {latestReflection ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                    What Stood Out This Week
                  </p>
                  <p className="mt-1 text-xs text-stone-300 line-clamp-3 leading-relaxed">
                    {latestReflection.learned}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                    One Thing to Carry Forward
                  </p>
                  <p className="mt-1 text-xs text-amber-200/90 italic line-clamp-3 leading-relaxed bg-stone-800/80 p-2.5 rounded-lg border border-stone-700/60">
                    "{latestReflection.motivationalInsight}"
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-800">
                  <p className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-2">
                    Suggested Next Steps
                  </p>
                  <ul className="space-y-1.5 text-xs text-stone-300">
                    {latestReflection.nextSteps.slice(0, 2).map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
                          {idx + 1}
                        </span>
                        <span className="line-clamp-1">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  id="read-full-reflection-btn"
                  onClick={() => onNavigate('reflection')}
                  className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-semibold text-stone-950 hover:bg-amber-400 transition-colors cursor-pointer shadow-xs"
                >
                  View Full Weekly Reflection
                </button>
              </div>
            ) : (
              <div className="space-y-4 py-2 text-center">
                <p className="text-xs text-stone-300 leading-relaxed">
                  MindVault synthesizes your saved sessions into key takeaways, cognitive patterns, and 3 high-impact next steps.
                </p>
                <button
                  id="generate-first-reflection-btn"
                  onClick={() => onNavigate('reflection')}
                  className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-semibold text-stone-950 hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  Generate First Reflection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
