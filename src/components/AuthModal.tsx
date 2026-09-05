import React from 'react';
import {
  Brain,
  ShieldCheck,
  Sparkles,
  Lock,
  MessageSquare,
  AlertCircle,
  Database,
  Key,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { signInWithGoogle, authError, clearAuthError } = useAuth();

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-stone-700/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30 mb-2">
            <Brain className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-100">
            MindVault AI
          </h1>
          <p className="text-sm text-stone-400 max-w-sm mx-auto">
            Secure, private, AI-powered personal knowledge and weekly reflection platform.
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-stone-800 bg-stone-900/95 p-8 shadow-xl backdrop-blur-md space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-stone-100">Sign in to your Vault</h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              Authenticate via Google to access your isolated Cloud Firestore documents and Gemini sessions.
            </p>
          </div>

          {authError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{authError}</p>
                <button
                  onClick={clearAuthError}
                  className="mt-1 font-semibold text-rose-200 underline hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            id="google-signin-btn"
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-stone-900 hover:bg-stone-100 transition-all shadow-md active:scale-[0.99] cursor-pointer"
          >
            {/* Google G Logo SVG */}
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Privacy & Security Bullets */}
          <div className="pt-4 border-t border-stone-800 space-y-2.5 text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Strict Firestore authorization by Firebase Auth UID</span>
            </div>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Zero client exposure of Gemini credentials</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Automated executive summaries & weekly reflections</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-stone-500">
          Hackathon Submission • Google Cloud Run & Secret Manager Ready
        </p>
      </div>
    </div>
  );
};
