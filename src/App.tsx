import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Plus, Sparkles, Brain, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ChatView } from './components/ChatView';
import { HistoryView } from './components/HistoryView';
import { ReflectionView } from './components/ReflectionView';
import { ProfileView } from './components/ProfileView';
import { AuthModal } from './components/AuthModal';
import { NavTab, Conversation, WeeklyReflection } from './types';
import { getUserConversations, getUserReflections } from './lib/conversations';

const MainApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load user's conversations and reflections when authenticated
  const loadUserData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [convs, refls] = await Promise.all([
        getUserConversations(user.uid),
        getUserReflections(user.uid),
      ]);
      setConversations(convs);
      setReflections(refls);
    } catch (err) {
      console.warn('Load user data warning:', err);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setConversations([]);
      setReflections([]);
      setActiveConversation(null);
    }
  }, [user, loadUserData]);

  // Handler to open conversation in Chat view
  const handleOpenConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    setCurrentTab('chat');
  };

  // Handler to start fresh conversation
  const handleStartNewChat = () => {
    setActiveConversation(null);
    setCurrentTab('chat');
  };

  // If initial auth check is loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900 text-stone-100">
        <div className="text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30 mx-auto animate-pulse">
            <Brain className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-stone-300">Initializing MindVault AI Vault...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated, gate all views behind the AuthModal
  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 antialiased flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'chat' && currentTab !== 'chat') {
            setActiveConversation(null);
          }
          setCurrentTab(tab);
        }}
        isOpenMobile={isMobileMenuOpen}
        onToggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Body Area */}
      <div className="flex-1 flex flex-col md:pl-72 transition-all min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-white/85 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 text-stone-600 hover:text-stone-900 md:hidden rounded-lg hover:bg-stone-100"
              aria-label="Toggle navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-semibold capitalize text-stone-800">
              {currentTab === 'chat'
                ? activeConversation
                  ? `Continuing: ${activeConversation.title}`
                  : 'New Conversation'
                : currentTab.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {currentTab !== 'chat' && (
              <button
                id="header-new-chat-btn"
                onClick={handleStartNewChat}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-stone-950 hover:bg-amber-400 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
            )}

            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
              <span className="hidden sm:block text-xs font-medium text-stone-600 truncate max-w-[150px]">
                {user.displayName || 'MindVault User'}
              </span>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User avatar'}
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-stone-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 text-xs font-bold ring-1 ring-amber-500/30">
                  {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Main Workspace Container */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {currentTab === 'dashboard' && (
                <DashboardView
                  conversations={conversations}
                  latestReflection={reflections[0] || null}
                  onNavigate={(tab) => {
                    if (tab === 'chat') setActiveConversation(null);
                    setCurrentTab(tab);
                  }}
                  onOpenConversation={handleOpenConversation}
                  loading={dataLoading}
                />
              )}

              {currentTab === 'chat' && (
                <ChatView
                  activeConversation={activeConversation}
                  onConversationSaved={loadUserData}
                  onResetToNew={() => setActiveConversation(null)}
                />
              )}

              {currentTab === 'history' && (
                <HistoryView
                  conversations={conversations}
                  onOpenConversation={handleOpenConversation}
                  onRefreshConversations={loadUserData}
                  onStartNewChat={handleStartNewChat}
                />
              )}

              {currentTab === 'reflection' && (
                <ReflectionView
                  conversations={conversations}
                  reflections={reflections}
                  onReflectionCreated={loadUserData}
                  onStartNewChat={handleStartNewChat}
                />
              )}

              {currentTab === 'profile' && <ProfileView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
