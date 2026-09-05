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
    if (reflections.length > 0 && !selectedReflection) {
      setSelectedReflection(reflections[0]);
    }
  }, [reflections, selectedReflection]);

  const handleGenerateReflection = async () => {
    if (!user) {
      setErrorMsg('Please sign in to generate reflections.');
      return;
    }

    if (conversations.length === 0) {
      setErrorMsg('You need at least one saved conversation to generate a weekly reflection.');
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
          errData.error || 'Gemini is temporarily unavailable. Please try again.'
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
      });

      onReflectionCreated();
    } catch (err: any) {
      console.error('Reflection synthesis error:', err);
      setErrorMsg(err.message || 'Unable to generate weekly reflection. Please try again.');
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

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-500/20 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>AI Knowledge & Personal Growth Engine</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            AI Weekly Reflection
          </h2>
          <p className="text-sm text-stone-500">
            Synthesizes your private discussions into key takeaways, cognitive patterns, and 3 actionable next steps.
          </p>
        </div>

        <button
          id="generate-reflection-action-btn"
          onClick={handleGenerateReflection}
          disabled={isGenerating || conversations.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs shrink-0 self-start cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-stone-950" />
              <span>Analyzing Your Conversations...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>{reflections.length > 0 ? 'Regenerate Reflection' : 'Generate This Week’s Reflection'}</span>
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-semibold text-rose-900">
            Dismiss
          </button>
        </div>
      )}

      {/* If No Conversations exist */}
      {conversations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <BookOpen className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-stone-900">
            No saved conversations found to analyze
          </h3>
          <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
            The AI Weekly Reflection strictly evaluates your own saved discussions. Chat with Gemini on topics you are exploring, save the conversations, and MindVault will craft your personalized synthesis.
          </p>
          <button
            onClick={onStartNewChat}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-stone-950 hover:bg-amber-400 transition-colors cursor-pointer"
          >
            <span>Start First Conversation</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : !active ? (
        /* If conversations exist but no reflection generated yet */
        <div className="rounded-2xl border border-stone-200 bg-gradient-to-b from-stone-900 to-stone-950 p-10 text-stone-100 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="mt-5 text-xl font-bold">Ready to synthesize your week</h3>
          <p className="mt-2 text-sm text-stone-300 max-w-lg mx-auto leading-relaxed">
            You have <strong className="text-amber-400">{conversations.length}</strong> saved conversation{conversations.length > 1 ? 's' : ''} in your private vault. Click below to extract key learnings, identify emerging themes, and receive 3 personalized action steps.
          </p>
          <button
            onClick={handleGenerateReflection}
            disabled={isGenerating}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-stone-950 hover:bg-amber-400 transition-colors cursor-pointer"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Generate AI Reflection Now</span>
          </button>
        </div>
      ) : (
        /* Render Selected Reflection */
        <div className="space-y-6">
          {/* Historical Reflection Selector (if multiple exist) */}
          {reflections.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider shrink-0">
                Cycle:
              </span>
              {reflections.map((refl, idx) => (
                <button
                  key={refl.id}
                  onClick={() => setSelectedReflection(refl)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
                    refl.id === active.id
                      ? 'bg-stone-900 text-stone-100 font-semibold shadow-2xs'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Week of {new Date(refl.createdAt).toLocaleDateString()}
                  {idx === 0 && ' (Latest)'}
                </button>
              ))}
            </div>
          )}

          {/* Core Synthesis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Columns: Pillars 1, 2, 3 */}
            <div className="md:col-span-2 space-y-6">
              {/* Pillar 1: Main Topics Discussed */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs">
                <div className="flex items-center gap-2.5 text-stone-900 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h4 className="text-base font-semibold">1. Main Topics Discussed</h4>
                </div>
                <p className="text-xs text-stone-500 mb-3">
                  Key disciplines, domains, and inquiries explored throughout your conversations this cycle.
                </p>
                <div className="flex flex-wrap gap-2">
                  {active.topics.map((topic, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-800 border border-stone-200"
                    >
                      #{topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pillar 2: What You Learned */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs">
                <div className="flex items-center gap-2.5 text-stone-900 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <h4 className="text-base font-semibold">2. What You Learned</h4>
                </div>
                <div className="rounded-xl bg-stone-50 p-4 border border-stone-100 text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                  {active.learned}
                </div>
              </div>

              {/* Pillar 3: Recurring Interests & Patterns */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs">
                <div className="flex items-center gap-2.5 text-stone-900 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
                    <Compass className="h-4 w-4" />
                  </div>
                  <h4 className="text-base font-semibold">3. Recurring Interests & Patterns</h4>
                </div>
                <div className="rounded-xl bg-stone-50 p-4 border border-stone-100 text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                  {active.patterns}
                </div>
              </div>
            </div>

            {/* Right 1 Column: Pillars 4 & 5 */}
            <div className="space-y-6">
              {/* Pillar 4: Recommended Next Steps */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs">
                <div className="flex items-center gap-2.5 text-stone-900 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-800">
                    <Target className="h-4 w-4" />
                  </div>
                  <h4 className="text-base font-semibold">4. Recommended Next Steps</h4>
                </div>
                <p className="text-xs text-stone-500 mb-4">
                  Three high-leverage actions derived from your insights. Click to mark complete.
                </p>

                <div className="space-y-3">
                  {active.nextSteps.map((step, idx) => {
                    const isDone = completedSteps[step];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleStep(step)}
                        className={`group flex items-start gap-3 rounded-xl border p-3.5 transition-all cursor-pointer ${
                          isDone
                            ? 'border-emerald-200 bg-emerald-50/50'
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

              {/* Pillar 5: Motivational AI Insight */}
              <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-900 to-stone-950 p-6 text-stone-100 shadow-xs">
                <div className="flex items-center gap-2 text-amber-400 mb-3">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    5. AI Insight & Motivation
                  </span>
                </div>
                <blockquote className="text-sm italic text-stone-200 leading-relaxed">
                  "{active.motivationalInsight}"
                </blockquote>
                <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                  <span>Synthesized from {active.conversationCount} conversations</span>
                  <span>{new Date(active.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
