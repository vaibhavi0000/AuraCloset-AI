import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  CheckCircle2,
  Share2,
  Thermometer,
  ShieldCheck,
  Flame,
  ArrowRight,
  MapPin,
  Compass,
  History,
  Camera,
  Layers,
} from 'lucide-react';
import { WardrobeItem, OutfitRecommendation, UserProfile, SearchHistoryItem, LiveWeatherData } from '../types/wardrobe';
import { triggerConfetti, getCostPerWear } from '../utils/helpers';

interface TodayOutfitViewProps {
  items: WardrobeItem[];
  user: UserProfile;
  weather: LiveWeatherData;
  searchHistory: SearchHistoryItem[];
  onLogWear: (itemIds: string[], occasion: string) => Promise<void>;
  onOpenShareModal: (outfit: OutfitRecommendation) => void;
  onNavigateToWardrobe: () => void;
  onOpenScanner: () => void;
  onRefreshLiveGps: () => Promise<void>;
  onSaveSearchQuery: (query: string, type: 'wardrobe' | 'stylist') => Promise<void>;
  onOpenLocation?: () => void;
}

export const TodayOutfitView: React.FC<TodayOutfitViewProps> = ({
  items,
  user,
  weather,
  searchHistory,
  onLogWear,
  onOpenShareModal,
  onNavigateToWardrobe,
  onOpenScanner,
  onRefreshLiveGps,
  onSaveSearchQuery,
  onOpenLocation,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isWearing, setIsWearing] = useState(false);
  const [justWornSuccess, setJustWornSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const availableItems = items.filter((i) => i.isAvailable);

  // Proactive outfit generation on mount or weather change
  useEffect(() => {
    if (availableItems.length >= 2 && recommendations.length === 0) {
      handleGetRecommendations(
        `Suggest my daily outfit for ${weather.city} at ${weather.temp}°C (${weather.condition})`
      );
    }
  }, [availableItems.length, weather.city, weather.temp]);

  const handleGetRecommendations = async (userPrompt: string) => {
    if (!userPrompt.trim()) return;
    setIsLoading(true);
    setJustWornSuccess(false);

    try {
      await onSaveSearchQuery(userPrompt.trim(), 'stylist');

      const response = await fetch('/api/recommend-outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userPrompt,
          weather,
          userProfile: user,
        }),
      });

      const data = await response.json();
      if (data.success && data.outfits && data.outfits.length > 0) {
        setRecommendations(data.outfits);
        setSelectedIndex(0);
      }
    } catch (err) {
      console.error('Failed to get recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWearCurrentOutfit = async () => {
    const currentOutfit = recommendations[selectedIndex];
    if (!currentOutfit || currentOutfit.items.length === 0) return;

    setIsWearing(true);
    try {
      const itemIds = currentOutfit.items.map((i) => i.id);
      await onLogWear(itemIds, currentOutfit.occasion || 'Daily Outfit');
      triggerConfetti();
      setJustWornSuccess(true);
      setTimeout(() => setJustWornSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsWearing(false);
    }
  };

  const handleGpsClick = async () => {
    setIsLocating(true);
    try {
      await onRefreshLiveGps();
    } catch (err) {
      console.error('GPS error:', err);
    } finally {
      setIsLocating(false);
    }
  };

  const currentOutfit = recommendations[selectedIndex];

  // Quick suggestion chips
  const samplePrompts = [
    { label: 'Party Tonight 🪩', prompt: "I'm going to a party, what should I wear?" },
    { label: 'College Fest 🎨', prompt: 'Suggest something trendy and vibrant for a college fest' },
    { label: 'Rainy Day 🌧️', prompt: "It's rainy today, suggest a weather-ready outfit" },
    { label: 'Office Presentation 💼', prompt: 'Sharp, confident smart casual for work' },
    { label: 'Weekend Casual ☕', prompt: 'Relaxed, effortless weekend brunch ensemble' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-28 pt-2 animate-fadeIn">
      {/* Title & Screen Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172312] font-display">
              Today's outfit
            </h1>
            <span className="w-2.5 h-2.5 rounded-full bg-[#9ee81c] animate-pulse"></span>
          </div>
          <p className="text-xs text-[#556947] mt-0.5">
            Personalized live styling reasoned by Gemini AI & real-time weather
          </p>
        </div>

        <button
          onClick={() => handleGetRecommendations(query || 'Give me a fresh spontaneous outfit mix')}
          disabled={isLoading || availableItems.length < 2}
          className="glass-pill p-2.5 rounded-full hover:bg-white text-[#253816] transition-all hover:rotate-180 duration-500 disabled:opacity-40 shadow-xs"
          title="Shuffle recommendation"
        >
          <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* --- SLEEK AURA AI STYLIST BAR ON TOP (REQUESTED IN PROMPT) --- */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-3xl mb-4 space-y-2.5 border border-white/80 shadow-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGetRecommendations(query);
          }}
          className="relative flex items-center"
        >
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            <Sparkles className="w-4 h-4 text-[#73a817]" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Aura AI Stylist (e.g. party tonight, college fest, rainy day look)..."
            className="w-full bg-white/95 text-[#192711] placeholder-[#718762] text-xs sm:text-sm pl-10 pr-12 py-3 rounded-2xl border border-[#d6eab9] focus:outline-none focus:ring-2 focus:ring-[#9fe61c] transition-all shadow-inner"
          />

          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-2 p-2 rounded-xl bg-[#1b2b10] hover:bg-[#294218] text-[#d4f84d] disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
            title="Ask AI Stylist"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Suggestion Pills & Recent Search History */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {searchHistory && searchHistory.length > 0 && (
            <div className="flex items-center gap-1 shrink-0 pr-2 border-r border-[#deecd0]">
              <History className="w-3 h-3 text-[#587249]" />
              {searchHistory.slice(0, 3).map((sh) => (
                <button
                  key={sh.id}
                  type="button"
                  onClick={() => {
                    setQuery(sh.query);
                    handleGetRecommendations(sh.query);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 hover:bg-white text-[#2a3c1e] border border-[#d6eab7] truncate max-w-[110px]"
                >
                  {sh.query}
                </button>
              ))}
            </div>
          )}

          <span className="text-[10px] font-bold text-[#5c724c] shrink-0 uppercase tracking-wider">
            Try:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(p.prompt);
                handleGetRecommendations(p.prompt);
              }}
              className="shrink-0 text-xs px-3 py-1 rounded-full bg-white/80 hover:bg-white text-[#2a3c1e] border border-[#d6eab7] hover:border-[#a3df29] transition-all font-medium"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Widgets Row: Live GPS Weather + Confidence Score */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Weather Card */}
        <div className="glass-panel p-3.5 rounded-3xl flex items-center justify-between relative overflow-hidden">
          <div
            onClick={onOpenLocation}
            className="space-y-0.5 cursor-pointer hover:opacity-85 transition-opacity"
            title="Tap to change city or detect location"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#637952]">
                Live Weather
              </span>
              {weather.isLiveGps ? (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#d4f84d] text-[#1b2b10]">
                  GPS Live
                </span>
              ) : (
                <span className="text-[9px] font-semibold text-[#5a714a] underline">
                  Change
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-[#15230f] tracking-tight">
              {weather.temp}°C
            </div>
            <div className="text-[11px] text-[#4f643e] truncate max-w-[120px]">
              {weather.condition} • {weather.city}
            </div>
          </div>

          <button
            onClick={handleGpsClick}
            disabled={isLocating}
            className="w-10 h-10 rounded-2xl bg-[#edf5e1] hover:bg-[#e2f0d1] border border-[#d6eab9] flex items-center justify-center text-[#283d19] transition-all hover:scale-105 active:scale-95 shadow-xs shrink-0"
            title="Auto-detect current GPS location"
          >
            <Compass className={`w-5 h-5 ${isLocating ? 'animate-spin text-[#6ea513]' : ''}`} />
          </button>
        </div>

        {/* Confidence Score Card */}
        <div className="glass-panel p-3.5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#637952]">
              Style Confidence
            </span>
            <ShieldCheck className="w-4 h-4 text-[#2f461d]" />
          </div>
          <div className="my-1 flex items-baseline justify-between">
            <span className="text-xs font-bold text-[#2d431c]">
              {currentOutfit ? `${currentOutfit.vibe}` : 'Optimal'}
            </span>
            <span className="text-xl font-black text-[#15230f]">
              {currentOutfit?.compatibilityScore || 93}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#e3eed3] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#b7ea28] to-[#6da51a] rounded-full transition-all duration-700"
              style={{ width: `${currentOutfit?.compatibilityScore || 93}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content State */}
      {availableItems.length === 0 ? (
        /* Empty Wardrobe State */
        <div className="glass-panel rounded-3xl p-8 sm:p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#d4f84d]/40 border-2 border-[#b5ea28] flex items-center justify-center mx-auto text-[#182a0e]">
            <Camera className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#172312] font-display">
              No Clothes Added Yet
            </h3>
            <p className="text-xs text-[#526643] max-w-sm mx-auto mt-1">
              Photograph or scan your real clothes to unlock personalized daily outfit recommendations.
            </p>
          </div>
          <button
            onClick={onOpenScanner}
            className="px-6 py-2.5 rounded-full bg-[#1b2b10] hover:bg-[#283f18] text-[#d4f84d] text-xs font-bold inline-flex items-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Camera className="w-4 h-4 text-[#d4f84d]" />
            <span>Add Your First Clothing Piece</span>
          </button>
        </div>
      ) : isLoading ? (
        /* Loading animation */
        <div className="glass-panel rounded-3xl p-10 min-h-[360px] flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-[#d4f84d]/40 flex items-center justify-center animate-ping"></div>
            <div className="w-16 h-16 rounded-full bg-[#d4f84d] flex items-center justify-center absolute inset-0 shadow-md">
              <Sparkles className="w-7 h-7 text-[#1b2a11] animate-spin" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1a2912]">Styling look with Gemini...</h3>
            <p className="text-xs text-[#526643] max-w-sm mt-1">
              Analyzing real items, color harmony, and {weather.temp}°C live weather in {weather.city}.
            </p>
          </div>
        </div>
      ) : currentOutfit && currentOutfit.items.length > 0 ? (
        /* Outfit Collage */
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#d4f84d] text-[#1c2c11]">
                  Option {selectedIndex + 1} of {recommendations.length}
                </span>
                <h2 className="text-lg font-extrabold text-[#172412] mt-1 font-display">
                  {currentOutfit.title}
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-[#e4efd4] p-1 rounded-full">
                  {recommendations.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
                        selectedIndex === idx
                          ? 'bg-[#1b2b11] text-[#f7faf2] shadow-sm'
                          : 'text-[#415632] hover:text-[#18260f]'
                      }`}
                    >
                      Look {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => onOpenShareModal(currentOutfit)}
                  className="glass-pill p-2 rounded-full hover:bg-white text-[#2a3c1d] transition-all"
                  title="Share story card"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Collage Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {currentOutfit.items.map((item) => {
                const costPerWear = getCostPerWear(item.pricePaid, item.timesWorn);
                return (
                  <div
                    key={item.id}
                    className="group relative bg-white/80 rounded-2xl p-2.5 border border-white/90 shadow-sm flex flex-col justify-between"
                  >
                    <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-[#f0f4e9] mb-2 flex items-center justify-center">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#223318]">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block"
                          style={{ backgroundColor: item.primaryColor?.hex || '#888' }}
                        ></span>
                        <span>{item.category}</span>
                      </div>

                      <div className="absolute bottom-2 right-2 bg-black/65 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                        ${costPerWear}/w
                      </div>
                    </div>

                    <div className="px-1">
                      <h4 className="text-xs font-bold text-[#1b2b11] truncate">{item.name}</h4>
                      <p className="text-[11px] text-[#556947] truncate mt-0.5">
                        {item.fabric} • {item.fitStyle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stylist Rationale */}
            <div className="mt-4 p-3.5 rounded-2xl bg-[#eff6e4]/90 border border-[#d6eab6] space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#233516]">
                <Sparkles className="w-3.5 h-3.5 text-[#72a714]" />
                <span>AI Stylist Rationale</span>
              </div>
              <p className="text-xs text-[#2b3e1f] leading-relaxed">
                {currentOutfit.reasoning}
              </p>
            </div>

            {/* Wear Action */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#deecd0]">
              <div className="text-xs text-[#526842] flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Wearing this updates your cost-per-wear and calendar log.</span>
              </div>

              <button
                onClick={handleWearCurrentOutfit}
                disabled={isWearing}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                  justWornSuccess
                    ? 'bg-[#294218] text-[#d4f84d]'
                    : 'bg-[#1a2911] hover:bg-[#283f18] text-[#f7faf2] hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {justWornSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#d4f84d]" />
                    <span>Logged to History! ✨</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#d4f84d]" />
                    <span>Wear this outfit today</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-[#243618]">
            No outfits generated yet.
          </p>
          <button
            onClick={() => handleGetRecommendations("Casual everyday outfit")}
            className="px-5 py-2.5 rounded-full bg-[#1b2b10] text-[#f5f8ef] text-xs font-bold"
          >
            Generate Outfit with Gemini
          </button>
        </div>
      )}
    </div>
  );
};
