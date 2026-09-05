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
  Hash,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ChatMessage, Conversation } from '../types';
import { saveConversation } from '../lib/conversations';

interface ChatViewProps {
  activeConversation: Conversation | null;
  onConversationSaved: () => void;
  onResetToNew: () => void;
}

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
        text: "Hello! I am MindVault AI, your private thinking and reflection partner. What would you like to explore, learn, brainstorm, or reflect upon today?",
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // When activeConversation changes from outside (e.g., reopened from history)
  useEffect(() => {
    if (activeConversation) {
      setMessages(activeConversation.messages);
      setErrorMsg(null);
      setSaveSuccessNotice(null);
    }
  }, [activeConversation]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;

    setErrorMsg(null);
    setSaveSuccessNotice(null);

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsGenerating(true);

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      // Prepare payload for backend multi-turn API
      // Exclude initial welcoming message if it's the stock placeholder
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
        throw new Error(data.error || 'Gemini is temporarily unavailable. Please try again.');
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
      setErrorMsg(err.message || 'Gemini is temporarily unavailable. Please try again.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
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

    // Must have at least one user message
    const userMessages = messages.filter((m) => m.role === 'user');
    if (userMessages.length === 0) {
      setErrorMsg('Please exchange at least one message before saving.');
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
        throw new Error('Unable to summarize conversation. Please try again.');
      }

      const summaryData = await sumResponse.json();

      // Step 2: Store directly in Cloud Firestore under users/{userId}/conversations/{id}
      const convId = activeConversation?.id || 'conv-' + Date.now();
      await saveConversation(user.uid, convId, {
        title: summaryData.title || 'MindVault Session',
        summary: summaryData.summary || 'Summary generated via MindVault AI.',
        messages,
        topics: summaryData.topics || ['Reflection'],
        isNew: !activeConversation,
      });

      setSaveSuccessNotice(`Saved successfully as "${summaryData.title}"`);
      onConversationSaved();
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMsg('Unable to save your conversation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
      {/* Top Conversation Header & Controls */}
      <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50/70">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">
              {activeConversation ? activeConversation.title : 'New Discussion & Reflection'}
            </h3>
            <p className="text-xs text-stone-500">
              {activeConversation
                ? `Last saved ${new Date(activeConversation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Interactive multi-turn session with Gemini'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="chat-save-btn"
            onClick={handleSaveToVault}
            disabled={isSaving || messages.filter((m) => m.role === 'user').length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-semibold text-stone-100 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                <span>Summarizing...</span>
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
            onClick={onResetToNew}
            title="Start fresh conversation"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-stone-500" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Notifications / Banners */}
      {saveSuccessNotice && (
        <div
          id="chat-save-success-banner"
          className="mx-6 mt-3 flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800 border border-emerald-200"
        >
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
          <button
            onClick={() => setSaveSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          id="chat-error-banner"
          className="mx-6 mt-3 flex items-center justify-between rounded-lg bg-rose-50 px-4 py-2.5 text-xs text-rose-800 border border-rose-200"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-700 hover:text-rose-950 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Message Stream Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
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
                    ? 'bg-amber-600 text-white ring-amber-700'
                    : 'bg-stone-900 text-amber-400 ring-stone-800'
                }`}
              >
                {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Bubble Container */}
              <div className={`group relative max-w-2xl ${isUser ? 'text-right' : 'text-left'}`}>
                <div
                  className={`rounded-2xl px-5 py-3.5 text-sm shadow-2xs leading-relaxed ${
                    isUser
                      ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-xs'
                      : 'bg-stone-100 text-stone-900 rounded-tl-xs'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="prose prose-stone prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-stone-900 prose-pre:text-stone-100 prose-pre:rounded-xl">
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
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-stone-700"
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

        {/* Typing indicator */}
        {isGenerating && (
          <div className="flex items-start gap-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-900 text-amber-400 ring-1 ring-stone-800">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-xs bg-stone-100 px-5 py-3 text-sm text-stone-600 flex items-center gap-2 shadow-2xs">
              <div className="flex gap-1.5 items-center">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-xs text-stone-500 ml-1">MindVault AI is synthesizing thoughts...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="border-t border-stone-200 p-4 bg-stone-50/50">
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
            onClick={handleSendMessage}
            disabled={!input.trim() || isGenerating}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-stone-400">
          MindVault AI is powered by Gemini. All conversations are stored privately under your authenticated Firebase UID.
        </p>
      </div>
    </div>
  );
};
