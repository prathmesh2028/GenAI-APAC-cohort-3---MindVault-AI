import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Lightbulb,
  Target,
  Compass,
  CheckCircle2,
  Calendar,
  Layers,
  BookOpen,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle,
  Trophy,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Quote,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Conversation, WeeklyReflection } from '../types';
import { saveWeeklyReflection } from '../lib/conversations';

interface ReflectionViewProps {
  conversations: Conversation[];
  reflections: WeeklyReflection[];
  onReflectionCreated: () => void;
  onStartNewChat: () => void;
}

export const ReflectionView: React.FC<ReflectionViewProps> = ({
  conversations,
  reflections,
  onReflectionCreated,
  onStartNewChat,
}) => {
  const { user, getIdToken } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedReflection, setSelectedReflection] = useState<WeeklyReflection | null>(
    reflections[0] || null
  );
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  // When reflections change, select latest if none selected
  React.useEffect(() => {
    if (reflections.length > 0) {
      if (!selectedReflection || !reflections.some((r) => r.id === selectedReflection.id)) {
        setSelectedReflection(reflections[0]);
      }
    }
  }, [reflections, selectedReflection]);

  const handleGenerateReflection = async () => {
    if (!user) {
      setErrorMsg('Please sign in to generate reflections.');
      return;
    }

    if (conversations.length === 0) {
      setErrorMsg('You need at least one saved conversation in your vault to generate a weekly reflection.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      // Send recent conversations to backend Gemini reflection engine
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversations: conversations.slice(0, 10).map((c) => ({
            title: c.title,
            summary: c.summary,
            topics: c.topics,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || "MindVault couldn't reach the AI service right now. Please try again in a moment."
        );
      }

      const reflectionData = await response.json();
      const reflectionId = 'refl-' + Date.now();
      const weekDate = new Date().toISOString().split('T')[0];

      await saveWeeklyReflection(user.uid, reflectionId, {
        weekStartDate: weekDate,
        topics: reflectionData.topics || [],
        learned: reflectionData.learned || '',
        patterns: reflectionData.patterns || '',
        nextSteps: reflectionData.nextSteps || [],
        motivationalInsight: reflectionData.motivationalInsight || '',
        conversationCount: Math.min(conversations.length, 10),
        wins: reflectionData.wins || [],
        challenges: reflectionData.challenges || [],
        thingsToRevisit: reflectionData.thingsToRevisit || [],
        keyThoughts: reflectionData.keyThoughts || '',
      });

      onReflectionCreated();
    } catch (err: any) {
      console.error('Reflection synthesis error:', err);
      setErrorMsg(err.message || "MindVault couldn't reach the AI service right now. Please try again in a moment.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleStep = (stepText: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepText]: !prev[stepText],
    }));
  };

  const active = selectedReflection || reflections[0] || null;

  // Format date range for reflection
  const getFormattedDateRange = (refl: WeeklyReflection) => {
    const createdDate = new Date(refl.createdAt);
    const startDate = new Date(createdDate.getTime() - 6 * 24 * 60 * 60 * 1000);
    return `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${createdDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="space-y-8">
      {/* Hero Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-500/25 mb-2.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Hero Feature • AI Weekly Reflection</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Weekly Reflection Hub
          </h2>
          <p className="text-sm text-stone-500 max-w-2xl mt-1">
            Synthesizes your private discussions into key takeaways, cognitive patterns, wins, challenges, and high-impact next steps.
          </p>
        </div>

        {/* Primary CTA */}
        <button
          id="generate-reflection-action-btn"
          onClick={handleGenerateReflection}
          disabled={isGenerating || conversations.length === 0}
          className="inline-flex items-center gap-2.5 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs shrink-0 self-start cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-stone-950" />
              <span>Analyzing Your Saved Vault...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>
                {reflections.length > 0 ? 'Regenerate Reflection' : 'Generate Weekly Reflection'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Error Message with Dismiss and Retry */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="font-semibold text-rose-900 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty State 1: No saved conversations exist at all */}
      {conversations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="mt-5 text-lg font-bold text-stone-900">
            Insufficient Journal Data to Synthesize
          </h3>
          <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
            MindVault AI strictly synthesizes your genuine user-authored sessions and reflections. Once you exchange and save at least one conversation with Gemini, your Weekly Reflection can be generated here.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={onStartNewChat}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-stone-950 hover:bg-amber-400 transition-colors cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Start Your First Reflection</span>
            </button>
          </div>
        </div>
      ) : !active ? (
        /* Empty State 2: Conversations exist but reflection has not yet been generated */
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-10 text-stone-100 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold">Ready to Synthesize Your Week</h3>
          <p className="text-sm text-stone-300 max-w-lg mx-auto leading-relaxed">
            You have <strong className="text-amber-400 font-semibold">{conversations.length} saved conversation{conversations.length > 1 ? 's' : ''}</strong> ready for synthesis. MindVault will detect emerging themes, mental patterns, wins, and 3 pragmatic next steps.
          </p>
          <button
            onClick={handleGenerateReflection}
            disabled={isGenerating}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-stone-950 hover:bg-amber-400 transition-colors cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating Executive Synthesis...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Weekly Reflection</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Active Reflection View */
        <div className="space-y-6">
          {/* Cycle Range & History Picker */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200">
            <div className="flex items-center gap-2 text-stone-900">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold">
                Reflection Range: {getFormattedDateRange(active)}
              </span>
              <span className="text-xs text-stone-500">
                ({active.conversationCount} sessions analyzed)
              </span>
            </div>

            {reflections.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider shrink-0 mr-1">
                  History:
                </span>
                {reflections.map((refl, idx) => (
                  <button
                    key={refl.id}
                    onClick={() => setSelectedReflection(refl)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                      refl.id === active.id
                        ? 'bg-stone-900 text-stone-100 font-semibold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {new Date(refl.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                    {idx === 0 && ' (Latest)'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Core Synthesis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Main In-Depth Narrative */}
            <div className="lg:col-span-2 space-y-6">
              {/* Section 1: Key Themes & What Stood Out This Week */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-stone-900">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                      <Lightbulb className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold">What Stood Out This Week</h4>
                      <p className="text-xs text-stone-500">
                        Synthesized learnings, core inquiries, and mental breakthroughs.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Topics Badges */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {active.topics.map((topic, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-amber-50/80 px-2.5 py-1 text-xs font-medium text-amber-900 border border-amber-200/80"
                    >
                      #{topic}
                    </span>
                  ))}
                </div>

                <div className="rounded-xl bg-stone-50 p-4 border border-stone-100 text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                  {active.learned}
                </div>
              </div>

              {/* Section 2: Patterns Worth Noticing (Cautious, non-clinical interpretation) */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2.5 text-stone-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold">Patterns Worth Noticing</h4>
                    <p className="text-xs text-stone-500">
                      Inferred cautiously from your journal content.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-sky-50/40 p-4 border border-sky-100/80 text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                  {active.patterns}
                </div>

                <p className="text-[11px] text-stone-400 italic">
                  * Note: Reflective patterns are inferred cautiously as conversational suggestions for self-reflection, not definitive medical or psychological diagnoses.
                </p>
              </div>

              {/* Section 3: Wins, Challenges, and Things to Revisit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Wins */}
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs uppercase tracking-wider">
                    <Trophy className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Wins & Clarifications</span>
                  </div>
                  {active.wins && active.wins.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-stone-700">
                      {active.wins.map((w, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-snug">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-stone-500 italic">Wins identified during weekly synthesis.</p>
                  )}
                </div>

                {/* Challenges */}
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/30 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-xs uppercase tracking-wider">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span>Challenges Explored</span>
                  </div>
                  {active.challenges && active.challenges.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-stone-700">
                      {active.challenges.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-snug">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-stone-500 italic">Hurdles and mental friction points explored.</p>
                  )}
                </div>

                {/* Things to Revisit */}
                <div className="rounded-xl border border-purple-200/80 bg-purple-50/30 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-purple-800 font-semibold text-xs uppercase tracking-wider">
                    <HelpCircle className="h-3.5 w-3.5 text-purple-600" />
                    <span>What to Revisit</span>
                  </div>
                  {active.thingsToRevisit && active.thingsToRevisit.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-stone-700">
                      {active.thingsToRevisit.map((r, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-snug">
                          <span className="text-purple-600 font-bold">→</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-stone-500 italic">Unresolved thesis questions or thoughts.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Hero Highlights & Suggested Next Steps */}
            <div className="space-y-6">
              {/* Card: One Thing to Carry Forward */}
              <div className="rounded-2xl border border-stone-800 bg-gradient-to-b from-stone-900 to-stone-950 p-6 text-stone-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <Quote className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    One Thing to Carry Forward
                  </span>
                </div>
                <blockquote className="text-sm italic text-amber-100/90 leading-relaxed">
                  "{active.motivationalInsight}"
                </blockquote>
                <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                  <span>AI Reflection Engine</span>
                  <span>{new Date(active.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Card: Suggested Next Steps */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 text-stone-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-800">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold">Suggested Next Steps</h4>
                    <p className="text-xs text-stone-500">
                      High-impact actions to carry into next week.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {active.nextSteps.map((step, idx) => {
                    const isDone = completedSteps[step];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleStep(step)}
                        className={`group flex items-start gap-3 rounded-xl border p-3.5 transition-all cursor-pointer ${
                          isDone
                            ? 'border-emerald-200 bg-emerald-50/60'
                            : 'border-stone-200 bg-stone-50/70 hover:border-amber-300'
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-semibold ${
                            isDone
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-stone-300 bg-white text-stone-700 group-hover:border-amber-500'
                          }`}
                        >
                          {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                        </div>
                        <p
                          className={`text-xs leading-relaxed ${
                            isDone ? 'line-through text-stone-400' : 'text-stone-800 font-medium'
                          }`}
                        >
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
