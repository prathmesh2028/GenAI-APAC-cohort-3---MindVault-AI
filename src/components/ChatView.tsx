import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Sparkles,
  Save,
  RotateCcw,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  RefreshCw,
  Edit3,
  ShieldCheck,
  Compass,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ChatMessage, Conversation } from '../types';
import { saveConversation } from '../lib/conversations';

interface ChatViewProps {
  activeConversation: Conversation | null;
  onConversationSaved: () => void;
  onResetToNew: () => void;
}

const STARTER_PROMPTS = [
  {
    title: 'Reflect on my week',
    prompt: 'Help me reflect on my week: what went well, what felt heavy, and what lessons emerged?',
    icon: Compass,
  },
  {
    title: 'Turn thoughts into a plan',
    prompt: 'Turn my scattered thoughts into a clear, actionable plan with priorities.',
    icon: Lightbulb,
  },
  {
    title: 'Stuck on a decision',
    prompt: "I'm feeling stuck on a decision. Help me analyze the tradeoffs, biases, and next step.",
    icon: Sparkles,
  },
  {
    title: 'Understand what I’m thinking',
    prompt: 'Help me understand what I’m thinking: ask me thoughtful questions to clarify my mental model.',
    icon: Bot,
  },
  {
    title: 'Summarize recent learnings',
    prompt: 'Summarize what I’ve learned recently and highlight the core principles to retain.',
    icon: Compass,
  },
];

export const ChatView: React.FC<ChatViewProps> = ({
  activeConversation,
  onConversationSaved,
  onResetToNew,
}) => {
  const { user, getIdToken } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (activeConversation) {
      return activeConversation.messages;
    }
    return [
      {
        id: 'welcome-msg',
        role: 'model',
        text: "Welcome to your private reflection vault. What would you like to explore, clarify, or brainstorm today?",
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState<string>(activeConversation?.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // When activeConversation changes from outside (e.g., reopened from history)
  useEffect(() => {
    if (activeConversation) {
      setMessages(activeConversation.messages);
      setCustomTitle(activeConversation.title);
      setErrorMsg(null);
      setSaveSuccessNotice(null);
      setLastFailedMessage(null);
    } else {
      setCustomTitle('');
      setIsEditingTitle(false);
    }
  }, [activeConversation]);

  // Dynamic thinking step animation
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setThinkingStep((prev) => (prev + 1) % 3);
      }, 1500);
    } else {
      setThinkingStep(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSendMessage = async (explicitText?: string) => {
    const textToSend = (explicitText || input).trim();
    if (!textToSend || isGenerating) return;

    setErrorMsg(null);
    setSaveSuccessNotice(null);
    setLastFailedMessage(null);

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    if (!explicitText) setInput('');
    setIsGenerating(true);

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      // Exclude initial welcome placeholder
      const messagesToSend = newHistory.filter(
        (m, index) => !(index === 0 && m.id === 'welcome-msg')
      );

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: messagesToSend.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "MindVault couldn't reach the AI service right now. Please try again in a moment.");
      }

      const data = await response.json();
      const modelReply: ChatMessage = {
        id: 'msg-model-' + Date.now(),
        role: 'model',
        text: data.response || 'No response generated.',
        timestamp: new Date().toISOString(),
      };

      setMessages([...newHistory, modelReply]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const friendlyMsg =
        err.message || "MindVault couldn't reach the AI service right now. Please try again in a moment.";
      setErrorMsg(friendlyMsg);
      setLastFailedMessage(textToSend);
    } finally {
      setIsGenerating(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      // Remove last user message if it failed
      setMessages((prev) => prev.slice(0, -1));
      handleSendMessage(lastFailedMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveToVault = async () => {
    if (!user) {
      setErrorMsg('Please sign in to save your conversation.');
      return;
    }

    const userMessages = messages.filter((m) => m.role === 'user');
    if (userMessages.length === 0) {
      setErrorMsg('Please write at least one thought or message before saving.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccessNotice(null);

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      // Step 1: Request server-side summarization & title generation
      const sumResponse = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      if (!sumResponse.ok) {
        throw new Error("MindVault couldn't summarize your conversation right now. Please try again in a moment.");
      }

      const summaryData = await sumResponse.json();
      const finalTitle = customTitle.trim() || summaryData.title || 'MindVault Session';

      // Step 2: Store directly in Cloud Firestore under users/{userId}/conversations/{id}
      const convId = activeConversation?.id || 'conv-' + Date.now();
      await saveConversation(user.uid, convId, {
        title: finalTitle,
        summary: summaryData.summary || 'Summary generated via MindVault AI.',
        messages,
        topics: summaryData.topics || ['Reflection'],
        isNew: !activeConversation,
      });

      setCustomTitle(finalTitle);
      setSaveSuccessNotice(`Saved successfully to Vault as "${finalTitle}"`);
      onConversationSaved();
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMsg(err.message || "Unable to save to your Vault. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const userMessagesCount = messages.filter((m) => m.role === 'user').length;
  const isFreshConversation = userMessagesCount === 0;

  const thinkingLabels = [
    'Synthesizing contextual thoughts...',
    'Evaluating mental patterns & tradeoffs...',
    'Formulating clear, scannable response...',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
      {/* Top Conversation Header & Controls */}
      <div className="flex flex-wrap items-center justify-between border-b border-stone-200 px-6 py-3.5 bg-stone-50/80 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/25">
            <Bot className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  placeholder="Name this conversation..."
                  autoFocus
                  className="text-sm font-semibold text-stone-900 border border-amber-400 rounded-md px-1.5 py-0.5 bg-white focus:outline-none"
                />
              ) : (
                <h3 className="text-sm font-semibold text-stone-900 truncate">
                  {customTitle || (activeConversation ? activeConversation.title : 'New Reflection Session')}
                </h3>
              )}
              {activeConversation && !isEditingTitle && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  title="Rename title"
                  className="text-stone-400 hover:text-stone-600 p-0.5"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-stone-500">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <Lock className="h-2.5 w-2.5" />
                <span>Private Vault Session</span>
              </span>
              <span>•</span>
              <span>
                {activeConversation
                  ? `Saved ${new Date(activeConversation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Multi-turn Gemini 3.8'}
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="chat-save-btn"
            onClick={handleSaveToVault}
            disabled={isSaving || userMessagesCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-semibold text-stone-100 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                <span>Saving to Vault...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-amber-400" />
                <span>Save to Vault</span>
              </>
            )}
          </button>

          <button
            id="chat-new-btn"
            onClick={() => {
              onResetToNew();
              setMessages([
                {
                  id: 'welcome-msg',
                  role: 'model',
                  text: "Welcome to your private reflection vault. What would you like to explore, clarify, or brainstorm today?",
                  timestamp: new Date().toISOString(),
                },
              ]);
            }}
            title="Start fresh conversation"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-stone-500" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Notifications / Banners */}
      {saveSuccessNotice && (
        <div
          id="chat-save-success-banner"
          className="mx-6 mt-3 flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800 border border-emerald-200 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{saveSuccessNotice}</span>
          </div>
          <button
            onClick={() => setSaveSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 font-medium cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          id="chat-error-banner"
          className="mx-6 mt-3 flex items-center justify-between rounded-lg bg-rose-50 px-4 py-2.5 text-xs text-rose-800 border border-rose-200 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <div className="flex items-center gap-2">
            {lastFailedMessage && (
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 font-medium text-rose-900 hover:bg-rose-200 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry</span>
              </button>
            )}
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-700 hover:text-rose-950 font-medium cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Message Stream Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Starter Prompts when conversation is fresh */}
        {isFreshConversation && (
          <div className="py-4 space-y-4 max-w-2xl mx-auto">
            <div className="text-center space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
                Thought Starters
              </span>
              <p className="text-xs text-stone-500 mt-2">
                Click any prompt below to begin your guided reflection:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {STARTER_PROMPTS.map((starter, i) => {
                const Icon = starter.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(starter.prompt)}
                    className="flex items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-left hover:border-amber-400 hover:bg-amber-50/40 transition-all cursor-pointer group"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-stone-200 text-stone-600 group-hover:text-amber-600 group-hover:border-amber-300 transition-colors">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-stone-800 group-hover:text-amber-900 transition-colors">
                        {starter.title}
                      </p>
                      <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                        "{starter.prompt}"
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Render Chat Messages */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${
                  isUser
                    ? 'bg-amber-500 text-stone-950 font-bold text-xs ring-amber-400'
                    : 'bg-stone-900 text-amber-400 ring-stone-800'
                }`}
              >
                {isUser ? (
                  user?.displayName ? user.displayName[0].toUpperCase() : <UserIcon className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>

              {/* Message Bubble Container */}
              <div className={`group relative max-w-2xl ${isUser ? 'text-right' : 'text-left'}`}>
                <div
                  className={`rounded-2xl px-5 py-3.5 text-sm shadow-2xs leading-relaxed ${
                    isUser
                      ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-xs'
                      : 'bg-stone-100 text-stone-900 rounded-tl-xs border border-stone-200/60'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="prose prose-stone prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-stone-900 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-stone-900 prose-pre:bg-stone-900 prose-pre:text-stone-100 prose-pre:rounded-xl">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Footer details: time + copy action */}
                <div
                  className={`mt-1.5 flex items-center gap-2 text-[11px] text-stone-400 px-1 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    onClick={() => handleCopyMessage(msg.id, msg.text)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-stone-700 cursor-pointer"
                    title="Copy message"
                  >
                    {copiedId === msg.id ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Polished "AI is thinking..." loading state */}
        {isGenerating && (
          <div className="flex items-start gap-3.5 animate-in fade-in duration-150">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-900 text-amber-400 ring-1 ring-stone-800">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-xs bg-stone-100 px-5 py-3.5 text-sm text-stone-700 flex flex-col gap-2 shadow-2xs border border-stone-200/80">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5 items-center">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-xs font-medium text-stone-700">
                  {thinkingLabels[thinkingStep]}
                </span>
              </div>
              <div className="w-44 h-1 bg-stone-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer with Privacy Trust Indicator */}
      <div className="border-t border-stone-200 p-4 bg-stone-50/60 space-y-2">
        <div className="flex items-end gap-3 rounded-xl border border-stone-300 bg-white p-2.5 shadow-2xs focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
          <textarea
            ref={textareaRef}
            id="chat-textarea-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder="Ask a question, journal your thoughts, explore a thesis... (Enter to send, Shift+Enter for new line)"
            rows={2}
            className="flex-1 resize-none bg-transparent px-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden disabled:opacity-50"
          />

          <button
            id="chat-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isGenerating}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
          <span className="flex items-center gap-1 text-stone-500">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            <span>Private Vault • Isolated to your authenticated UID</span>
          </span>
          <span className="hidden sm:inline">Press Enter to send, Shift+Enter for line break</span>
        </div>
      </div>
    </div>
  );
};
