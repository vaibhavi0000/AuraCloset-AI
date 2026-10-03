import React from 'react';
import { Sparkles, Sun, CloudRain, Cloud, User, Plus, Compass } from 'lucide-react';
import { UserProfile, LiveWeatherData } from '../types/wardrobe';

interface NavbarProps {
  user: UserProfile;
  weather: LiveWeatherData;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenScanner: () => void;
  onRefreshWeather: () => Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  weather,
  onOpenProfile,
  onOpenAuth,
  onOpenScanner,
  onRefreshWeather,
}) => {
  const getWeatherIcon = (cond: string) => {
    const c = cond.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className="w-4 h-4 text-emerald-600 shrink-0" />;
    if (c.includes('cloud') || c.includes('overcast')) return <Cloud className="w-4 h-4 text-amber-600 shrink-0" />;
    return <Sun className="w-4 h-4 text-amber-500 shrink-0" />;
  };

  const isUserSignedIn = Boolean(user.email && user.email.includes('@'));

  return (
    <header className="sticky top-0 z-30 w-full px-3 sm:px-6 pt-2.5 pb-2 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-[#d4f84d] flex items-center justify-center shadow-xs border border-[#b8ef28] shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#1b2b10]" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#172412] font-display">
                AuraCloset
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 rounded-full bg-[#e8f7ba] text-[#2c4017] border border-[#d2f47c]">
                AI
              </span>
            </div>
            <p className="text-[10px] text-[#556947] hidden md:block">Digital Wardrobe & Stylist</p>
          </div>
        </div>

        {/* Center / Real-time Live Weather Pill */}
        <div className="flex items-center shrink min-w-0">
          <button
            onClick={onRefreshWeather}
            title="Tap to refresh live GPS location & weather"
            className="glass-pill px-2.5 sm:px-3 py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 hover:bg-white transition-all text-xs font-medium text-[#223318] active:scale-95 shadow-xs max-w-[170px] sm:max-w-none"
          >
            {getWeatherIcon(weather.condition)}
            <span className="font-black text-[#142010] shrink-0">{weather.temp}°C</span>
            <span className="text-[#556d47] truncate text-[11px] sm:text-xs">
              {weather.city}
            </span>
            <Compass className="w-3.5 h-3.5 text-[#557143] shrink-0" />
          </button>
        </div>

        {/* Right Action Icons (Profile Avatar is ALWAYS visible on all screen sizes!) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Add Item Desktop Pill */}
          <button
            onClick={onOpenScanner}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1b2b10] hover:bg-[#283f18] text-[#f7faf2] text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 text-[#d4f84d]" />
            <span>Add Item</span>
          </button>

          {/* Profile Avatar Button — ALWAYS VISIBLE ON MOBILE & DESKTOP */}
          <button
            onClick={onOpenProfile}
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full glass-pill flex items-center justify-center overflow-hidden border border-white/90 shadow-xs hover:scale-105 active:scale-95 transition-all relative focus:outline-none focus:ring-2 focus:ring-[#d4f84d]"
            title={isUserSignedIn ? `${user.name} - Profile & Settings` : 'Profile & Account'}
            aria-label="Profile and Settings"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || 'User profile'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : isUserSignedIn && user.name ? (
              <span className="font-extrabold text-xs text-[#203216]">
                {user.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User className="w-4 h-4 text-[#2b3e1f]" />
            )}

            {/* Indicator badge if signed in or active */}
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${
                isUserSignedIn ? 'bg-[#9ee81c]' : 'bg-gray-300'
              }`}
            ></span>
          </button>
        </div>
      </div>
    </header>
  );
};
