import React from 'react';
import {
  MessageSquarePlus,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  Lock,
  Layers,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Conversation, WeeklyReflection, NavTab } from '../types';

interface DashboardViewProps {
  conversations: Conversation[];
  latestReflection: WeeklyReflection | null;
  onNavigate: (tab: NavTab) => void;
  onOpenConversation: (conv: Conversation) => void;
  loading: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  conversations,
  latestReflection,
  onNavigate,
  onOpenConversation,
  loading,
}) => {
  const { user } = useAuth();
  const userName = user?.displayName ? user.displayName.split(' ')[0] : 'Explorer';

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div
        id="dashboard-welcome-banner"
        className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-900 px-7 py-8 text-stone-100 shadow-xs"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-400/20">
              <Lock className="h-3 w-3" />
              <span>Zero-Knowledge Personal Vault</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-100">
              Welcome back, {userName}
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed">
              MindVault AI protects your deepest thoughts, inquiries, and reflections with
              multi-turn Gemini intelligence and client-isolated Cloud Firestore storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="dashboard-start-chat-btn"
              onClick={() => onNavigate('chat')}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-stone-950 shadow-xs hover:bg-amber-400 transition-all cursor-pointer"
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span>Start New Conversation</span>
            </button>
            <button
              id="dashboard-weekly-reflection-btn"
              onClick={() => onNavigate('reflection')}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-700 bg-stone-800/90 px-4 py-3 text-sm font-medium text-stone-200 hover:bg-stone-700 hover:text-white transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Weekly Reflection</span>
            </button>
          </div>
        </div>

        {/* Decorative subtle texture */}
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Saved Conversations
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-stone-900">{conversations.length}</p>
          <p className="mt-1 text-xs text-stone-500">Stored privately in Firestore</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Weekly Reflections
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-stone-900">
            {latestReflection ? 'Synthesized' : 'Pending'}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {latestReflection ? 'Updated for this cycle' : 'Ready to generate'}
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Security Protocol
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-xl font-bold text-stone-900 flex items-center gap-1.5">
            <span>UID Isolated</span>
          </p>
          <p className="mt-1 text-xs text-stone-500">Secret Manager & Auth enforced</p>
        </div>
      </div>

      {/* Main Content Split: Weekly Reflection Card + Recent Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Conversations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-stone-900">Recent Conversations</h3>
            {conversations.length > 0 && (
              <button
                id="view-all-history-btn"
                onClick={() => onNavigate('history')}
                className="text-xs font-medium text-stone-600 hover:text-stone-950 inline-flex items-center gap-1"
              >
                <span>View all ({conversations.length})</span>
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
              className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-8 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <MessageSquarePlus className="h-6 w-6" />
              </div>
              <h4 className="mt-4 text-base font-semibold text-stone-900">No saved conversations yet</h4>
              <p className="mt-1.5 text-sm text-stone-500 max-w-md mx-auto">
                Begin a conversation with Gemini. Brainstorm an architecture, reflect on an idea, or
                explore a topic. When saved, MindVault generates summaries and reflections.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {[
                  'Deep-dive into distributed systems',
                  'Journal about this week’s productivity blockers',
                  'Brainstorming novel AI application ideas',
                ].map((promptIdea, idx) => (
                  <button
                    key={idx}
                    onClick={() => onNavigate('chat')}
                    className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 hover:border-amber-400 hover:bg-amber-50/40 transition-colors"
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
                  className="group rounded-xl border border-stone-200 bg-white p-4 transition-all hover:border-amber-300 hover:shadow-sm cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-stone-900 group-hover:text-amber-700 transition-colors">
                        {conv.title}
                      </h4>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {conv.summary || (conv.messages[1] ? conv.messages[1].text : 'No summary recorded.')}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-stone-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-stone-400" />
                      {new Date(conv.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span>{conv.messages.length} messages</span>
                    {conv.topics && conv.topics.length > 0 && (
                      <div className="flex items-center gap-1 ml-auto">
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

        {/* Right 1 Col: Weekly Reflection Spotlight Card */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-stone-900">AI Weekly Reflection</h3>
            <button
              id="open-reflection-tab-btn"
              onClick={() => onNavigate('reflection')}
              className="text-xs font-medium text-amber-700 hover:text-amber-800"
            >
              Open Hub
            </button>
          </div>

          <div
            id="dashboard-reflection-card"
            className="rounded-2xl border border-stone-200 bg-gradient-to-b from-stone-900 to-stone-950 p-6 text-stone-100 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300 ring-1 ring-amber-400/20">
                <Sparkles className="h-3 w-3" />
                <span>Executive Synthesis</span>
              </div>
              <span className="text-[11px] text-stone-400">
                {latestReflection
                  ? new Date(latestReflection.createdAt).toLocaleDateString()
                  : 'Needs Generation'}
              </span>
            </div>

            {latestReflection ? (
              <div className="space-y-3.5">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">
                    Key Topics Analyzed
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {latestReflection.topics.map((t, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-stone-800 px-2 py-0.5 text-xs text-amber-200 font-medium border border-stone-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">
                    Motivational Insight
                  </p>
                  <p className="mt-1 text-xs text-stone-300 italic line-clamp-3 leading-relaxed">
                    "{latestReflection.motivationalInsight}"
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-800">
                  <p className="text-[11px] uppercase tracking-wider text-stone-400 font-medium mb-1.5">
                    Recommended Next Steps
                  </p>
                  <ul className="space-y-1 text-xs text-stone-300">
                    {latestReflection.nextSteps.slice(0, 2).map((step, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-semibold">{idx + 1}.</span>
                        <span className="line-clamp-1">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  id="read-full-reflection-btn"
                  onClick={() => onNavigate('reflection')}
                  className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-semibold text-stone-950 hover:bg-amber-400 transition-colors"
                >
                  View Full Reflection
                </button>
              </div>
            ) : (
              <div className="space-y-4 py-2 text-center">
                <p className="text-xs text-stone-300 leading-relaxed">
                  MindVault synthesizes your saved sessions into actionable knowledge, recurring patterns,
                  and 3 recommended next steps.
                </p>
                <button
                  id="generate-first-reflection-btn"
                  onClick={() => onNavigate('reflection')}
                  className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-semibold text-stone-950 hover:bg-amber-400 transition-colors"
                >
                  Generate Reflection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
