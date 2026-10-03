import React, { useState } from 'react';
import { X, Sparkles, Mail, Lock, User, MapPin, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types/wardrobe';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('New York');
  const [gender, setGender] = useState<'women' | 'men' | 'unisex' | 'all'>('women');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const endpoint = mode === 'signin' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'signin'
          ? { email, password }
          : { email, password, name, city, gender };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      // Prompt user or use prompt-less quick sign in
      const defaultGoogleEmail = email.trim() || 'me.google@gmail.com';
      const googleName = name.trim() || 'Google User';

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: defaultGoogleEmail,
          name: googleName,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleName)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Google Sign-in failed');
      }

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Sign-In failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      {/* iOS style bottom sheet on mobile, centered modal on desktop */}
      <div className="w-full sm:max-w-md bg-white/95 backdrop-blur-2xl rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-white/80 relative max-h-[92vh] overflow-y-auto">
        {/* iOS sheet grabber handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden"></div>

        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-[#d4f84d] flex items-center justify-center text-[#182a0d] shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#15230e] tracking-tight font-display">
                {mode === 'signin' ? 'Welcome Back' : 'Create Your Closet'}
              </h2>
              <p className="text-[11px] text-[#556b46]">
                Save your real clothes, outfits & search history
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iOS Segment Control */}
        <div className="flex items-center bg-[#edf3e3] p-1 rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'signin'
                ? 'bg-white text-[#192711] shadow-xs'
                : 'text-[#4e643f] hover:text-[#172510]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-white text-[#192711] shadow-xs'
                : 'text-[#4e643f] hover:text-[#172510]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Sign-in Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-gray-50 text-[#1b2b11] font-bold text-xs border border-gray-200 shadow-xs flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.98] mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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

        <div className="flex items-center gap-3 my-3">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            or manual email
          </span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* Manual Email & Password Form */}
        <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="font-bold text-[#203115] block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-[#f8faf4] pl-9 pr-3 py-2.5 rounded-xl border border-[#d6eab9] focus:outline-none focus:ring-2 focus:ring-[#9fe61c]"
                  required={mode === 'signup'}
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-[#203115] block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#f8faf4] pl-9 pr-3 py-2.5 rounded-xl border border-[#d6eab9] focus:outline-none focus:ring-2 focus:ring-[#9fe61c]"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#203115] block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#f8faf4] pl-9 pr-3 py-2.5 rounded-xl border border-[#d6eab9] focus:outline-none focus:ring-2 focus:ring-[#9fe61c]"
                required
                minLength={4}
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-[#203115] block mb-1">Style Fit</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-[#f8faf4] p-2.5 rounded-xl border border-[#d6eab9]"
                >
                  <option value="women">Women's</option>
                  <option value="men">Men's</option>
                  <option value="unisex">Unisex</option>
                  <option value="all">Eclectic</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#203115] block mb-1">City (Weather)</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New York"
                  className="w-full bg-[#f8faf4] p-2.5 rounded-xl border border-[#d6eab9]"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl font-bold text-xs bg-[#1a2911] hover:bg-[#283f18] text-[#d4f84d] transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
            >
              <span>{isLoading ? 'Processing...' : mode === 'signin' ? 'Sign In to Wardrobe' : 'Create Personal Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <p className="text-[10px] text-center text-[#617650] mt-4">
          All your uploaded clothes, combinations, and wear counts are private to your account.
        </p>
      </div>
    </div>
  );
};
