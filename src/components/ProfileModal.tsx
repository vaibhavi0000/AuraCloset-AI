import React, { useState } from 'react';
import { X, User, MapPin, Sparkles, RefreshCw, LogOut, Check, Compass, Shield } from 'lucide-react';
import { UserProfile } from '../types/wardrobe';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdateUser: (updated: Partial<UserProfile>) => Promise<void>;
  onResetData: () => Promise<void>;
  onLogout: () => void;
  onOpenAuth: () => void;
  onRequestGps: () => Promise<void>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  onClose,
  onUpdateUser,
  onResetData,
  onLogout,
  onOpenAuth,
  onRequestGps,
}) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [gender, setGender] = useState(user.gender);
  const [city, setCity] = useState(user.city);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateUser({ name, email, gender, city });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGpsSync = async () => {
    setIsGpsLoading(true);
    try {
      await onRequestGps();
    } catch (err) {
      console.error(err);
    } finally {
      setIsGpsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="glass-panel w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 shadow-2xl relative space-y-4 bg-white/95 max-h-[92vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3 sm:hidden"></div>

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#deecd0]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#d4f84d] flex items-center justify-center text-[#182a0e]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#172312] font-display">
                Wardrobe Profile
              </h3>
              <span className="text-[10px] text-[#556b46]">
                {user.provider === 'google' ? 'Google Account' : 'Personal Account'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-[#203115] block mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#f8faf4] p-2.5 rounded-xl border border-[#d6eab9]"
              required
            />
          </div>

          <div>
            <label className="font-bold text-[#203115] block mb-1">Account Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#f8faf4] p-2.5 rounded-xl border border-[#d6eab9]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-bold text-[#203115] block mb-1">
                Fit Presentation
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-[#f8faf4] p-2.5 rounded-xl border border-[#d6eab9]"
              >
                <option value="women">Women's styling</option>
                <option value="men">Men's styling</option>
                <option value="unisex">Unisex / Neutral</option>
                <option value="all">Eclectic / All</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#203115] block mb-1">
                City / Location
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New York"
                  className="flex-1 bg-[#f8faf4] p-2.5 rounded-xl border border-[#d6eab9]"
                />
                <button
                  type="button"
                  onClick={handleGpsSync}
                  disabled={isGpsLoading}
                  className="p-2.5 rounded-xl bg-[#edf5e1] border border-[#d6eab9] hover:bg-[#e1efd2] text-[#2c421b]"
                  title="Detect GPS live location"
                >
                  <Compass className={`w-4 h-4 ${isGpsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-[#486036]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-full font-bold text-xs bg-[#1a2911] hover:bg-[#283f18] text-[#d4f84d] transition-all shadow-sm flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[#d4f84d]" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Profile</span>
              )}
            </button>
          </div>
        </form>

        {/* Account Switcher / Sign Out */}
        <div className="pt-3 border-t border-[#deecd0] flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenAuth();
            }}
            className="text-xs font-bold text-[#2f4320] hover:underline"
          >
            Switch Account / Log In
          </button>

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="px-3 py-1.5 rounded-full text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Reset / Clear Wardrobe */}
        <div className="pt-2 border-t border-[#deecd0] flex items-center justify-between text-[11px] text-[#637952]">
          <span>Clear closet to 0 items:</span>
          <button
            onClick={async () => {
              if (confirm('Clear all items from your digital wardrobe?')) {
                await onResetData();
                onClose();
              }
            }}
            className="text-rose-600 hover:text-rose-800 font-bold"
          >
            Clear Closet
          </button>
        </div>
      </div>
    </div>
  );
};
