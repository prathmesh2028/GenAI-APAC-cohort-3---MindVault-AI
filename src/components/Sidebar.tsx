import React from 'react';
import {
  LayoutDashboard,
  MessageSquarePlus,
  History,
  Sparkles,
  User,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Brain,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavTab } from '../types';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onToggleMobile,
}) => {
  const { user, logout } = useAuth();

  const navItems: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'New Conversation', icon: MessageSquarePlus },
    { id: 'history', label: 'Conversation History', icon: History },
    { id: 'reflection', label: 'Weekly Reflection', icon: Sparkles },
    { id: 'profile', label: 'Profile & Security', icon: User },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    if (isOpenMobile) onToggleMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onToggleMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-stone-200 bg-stone-900 text-stone-100 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between px-6 py-6 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-stone-100">MindVault AI</h1>
                <p className="text-xs text-stone-400">Personal AI Reflection Vault</p>
              </div>
            </div>
            <button
              id="close-mobile-sidebar-btn"
              onClick={onToggleMobile}
              className="p-1 text-stone-400 hover:text-stone-100 md:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-3 space-y-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}-btn`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex w-full items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 font-semibold ring-1 ring-amber-500/30'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-stone-100'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-stone-800 p-4">
          <div className="flex items-center justify-between rounded-xl bg-stone-800/80 p-3 ring-1 ring-stone-700/60">
            <div className="flex items-center gap-3 overflow-hidden">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="h-9 w-9 rounded-full ring-1 ring-stone-600 object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-semibold text-sm ring-1 ring-amber-500/30">
                  {user?.displayName ? user.displayName[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="truncate">
                <p className="truncate text-xs font-medium text-stone-200">
                  {user?.displayName || 'MindVault User'}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  <span className="truncate">Encrypted Session</span>
                </div>
              </div>
            </div>

            <button
              id="sidebar-logout-btn"
              onClick={logout}
              title="Sign Out"
              className="rounded-lg p-2 text-stone-400 hover:bg-stone-700 hover:text-rose-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
