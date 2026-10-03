import React, { useState } from 'react';
import {
  PieChart,
  Calendar as CalendarIcon,
  TrendingDown,
  Plane,
  Sparkles,
  ShoppingBag,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { WardrobeItem, OutfitLog, WardrobeAnalytics, PackingListPlan } from '../types/wardrobe';
import { calculateAnalytics, formatCurrency, getCostPerWear, triggerConfetti } from '../utils/helpers';

interface AnalyticsViewProps {
  items: WardrobeItem[];
  outfitLogs: OutfitLog[];
  onOpenScanner: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  items,
  outfitLogs,
  onOpenScanner,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'costperwear' | 'calendar' | 'packing'>('overview');
  const [packingDestination, setPackingDestination] = useState('Goa');
  const [packingDays, setPackingDays] = useState(4);
  const [packingVibe, setPackingVibe] = useState('Coastal Leisure & Evening Dining');
  const [isGeneratingPacking, setIsGeneratingPacking] = useState(false);
  const [packingPlan, setPackingPlan] = useState<PackingListPlan | null>(null);

  const analytics = calculateAnalytics(items);

  const handleGeneratePacking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingPacking(true);
    try {
      const res = await fetch('/api/generate-packing-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: packingDestination,
          days: packingDays,
          vibe: packingVibe,
        }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setPackingPlan(data.plan);
        triggerConfetti();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPacking(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-28 pt-2 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172312] font-display">
            Wardrobe Insights & Analytics
          </h1>
          <p className="text-xs text-[#556947] mt-0.5">
            Cost-per-wear tracking, sustainability score, outfit calendar, and AI packing
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-white/80 p-1 rounded-full border border-[#d6eab9] shadow-xs text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-[#1b2b10] text-[#f7faf2] shadow-xs'
                : 'text-[#476037] hover:text-[#18270f]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('costperwear')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all ${
              activeTab === 'costperwear'
                ? 'bg-[#1b2b10] text-[#f7faf2] shadow-xs'
                : 'text-[#476037] hover:text-[#18270f]'
            }`}
          >
            Cost-Per-Wear
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all ${
              activeTab === 'calendar'
                ? 'bg-[#1b2b10] text-[#f7faf2] shadow-xs'
                : 'text-[#476037] hover:text-[#18270f]'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('packing')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all ${
              activeTab === 'packing'
                ? 'bg-[#1b2b10] text-[#f7faf2] shadow-xs'
                : 'text-[#476037] hover:text-[#18270f]'
            }`}
          >
            AI Packing
          </button>
        </div>
      </div>

      {/* --- TAB 1: OVERVIEW & HEALTH METRICS --- */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-panel p-4 rounded-3xl">
              <span className="text-[11px] font-semibold uppercase text-[#5a734a] tracking-wider block">
                Total Wardrobe Value
              </span>
              <div className="text-2xl font-black text-[#15230f] mt-1 font-display">
                {formatCurrency(analytics.totalValue)}
              </div>
              <p className="text-[10px] text-[#637d53] mt-0.5">Across {analytics.totalItems} pieces</p>
            </div>

            <div className="glass-panel p-4 rounded-3xl">
              <span className="text-[11px] font-semibold uppercase text-[#5a734a] tracking-wider block">
                Avg Cost Per Wear
              </span>
              <div className="text-2xl font-black text-[#15230f] mt-1 font-display">
                ${analytics.averageCostPerWear}
              </div>
              <p className="text-[10px] text-[#637d53] mt-0.5">Decreases each time you rewear</p>
            </div>

            <div className="glass-panel p-4 rounded-3xl">
              <span className="text-[11px] font-semibold uppercase text-[#5a734a] tracking-wider block">
                Rewear & Eco Score
              </span>
              <div className="text-2xl font-black text-[#264415] mt-1 font-display flex items-baseline gap-1">
                <span>{analytics.rewearScore}</span>
                <span className="text-xs font-bold text-[#5c774b]">/100</span>
              </div>
              <div className="w-full h-1.5 bg-[#e3eed3] rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-gradient-to-r from-[#b7ea28] to-[#4e8211] rounded-full"
                  style={{ width: `${analytics.rewearScore}%` }}
                ></div>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-3xl">
              <span className="text-[11px] font-semibold uppercase text-[#5a734a] tracking-wider block">
                Total Outfits Logged
              </span>
              <div className="text-2xl font-black text-[#15230f] mt-1 font-display">
                {outfitLogs.length}
              </div>
              <p className="text-[10px] text-[#637d53] mt-0.5">Calendar entries</p>
            </div>
          </div>

          {/* Color Palette Distribution & Category Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Color Distribution */}
            <div className="glass-panel p-5 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#172312] font-display">
                  Wardrobe Color Spectrum
                </h3>
                <span className="text-xs text-[#59714b]">Detected Tones</span>
              </div>

              <div className="flex h-6 rounded-xl overflow-hidden shadow-2xs border border-white">
                {analytics.colorPalette.map((col, idx) => {
                  const percentage = Math.round((col.count / Math.max(1, analytics.totalItems)) * 100);
                  return (
                    <div
                      key={idx}
                      className="h-full transition-all hover:opacity-90 relative group"
                      style={{
                        backgroundColor: col.hex,
                        width: `${Math.max(8, percentage)}%`,
                      }}
                      title={`${col.name}: ${col.count} items (${percentage}%)`}
                    />
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                {analytics.colorPalette.map((col, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-1.5 rounded-xl bg-white/70">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs shrink-0"
                      style={{ backgroundColor: col.hex }}
                    ></span>
                    <span className="font-semibold text-[#1c2c11] truncate">{col.name}</span>
                    <span className="text-[#647c55] ml-auto text-[11px]">{col.count} pcs</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="glass-panel p-5 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#172312] font-display">
                  Category Composition
                </h3>
                <span className="text-xs text-[#59714b]">{analytics.totalItems} Pieces</span>
              </div>

              <div className="space-y-2 text-xs">
                {analytics.categoryCounts.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-semibold text-[#1f2f16]">
                      <span>{cat.category}</span>
                      <span>
                        {cat.count} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#e4efd5] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1b2b10] rounded-full transition-all duration-500"
                        style={{ width: `${cat.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Wardrobe Gaps & Wishlist Advisor */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-[#18270f]">
              <Sparkles className="w-5 h-5 text-[#6ba312]" />
              <h3 className="text-base font-extrabold font-display">
                AI Wardrobe Gap Advisor & Smart Wishlist
              </h3>
            </div>
            <p className="text-xs text-[#526643]">
              Gemini analyzed your closet structure. Here are strategic foundational pieces to fill gaps and unlock 50+ new rotations:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {analytics.wardrobeGaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="bg-white/80 p-3.5 rounded-2xl border border-[#d6eab9] space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#d4f84d] text-[#1c2c11] inline-block">
                      Recommended: {gap.suggestedCategory}
                    </span>
                    <h4 className="text-xs font-bold text-[#1b2b11]">{gap.title}</h4>
                    <p className="text-[11px] text-[#556947] leading-relaxed">{gap.reason}</p>
                  </div>
                  <div className="pt-2 border-t border-[#deecd0] text-[10px] font-semibold text-[#304820]">
                    Suggested Palette: <span className="font-bold">{gap.suggestedColor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: COST PER WEAR TRACKER --- */}
      {activeTab === 'costperwear' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="glass-panel p-5 rounded-3xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#172312] font-display">
                  Cost-Per-Wear Leaderboard
                </h3>
                <p className="text-xs text-[#536844]">
                  Cost per wear = Price Paid ÷ Times Worn. The more you wear a quality piece, the closer it trends to pennies per day.
                </p>
              </div>
            </div>

            {/* Ranking Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#d6eab9] text-[#597149] uppercase font-bold text-[10px] tracking-wider">
                    <th className="pb-2.5">Item</th>
                    <th className="pb-2.5">Category</th>
                    <th className="pb-2.5">Original Price</th>
                    <th className="pb-2.5">Times Worn</th>
                    <th className="pb-2.5">Cost / Wear</th>
                    <th className="pb-2.5">Value Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3eed3]">
                  {[...items]
                    .sort((a, b) => getCostPerWear(a.pricePaid, a.timesWorn) - getCostPerWear(b.pricePaid, b.timesWorn))
                    .map((item) => {
                      const cpw = getCostPerWear(item.pricePaid, item.timesWorn);
                      let grade = '⭐⭐⭐ High Value';
                      let gradeBg = 'bg-emerald-100 text-emerald-800';

                      if (item.timesWorn === 0) {
                        grade = '🚨 Unworn';
                        gradeBg = 'bg-rose-100 text-rose-800';
                      } else if (cpw > 25) {
                        grade = '⏳ Underused';
                        gradeBg = 'bg-amber-100 text-amber-800';
                      }

                      return (
                        <tr key={item.id} className="hover:bg-white/50 transition-colors">
                          <td className="py-2.5 flex items-center gap-2 font-bold text-[#1a2811]">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                            <span className="truncate max-w-[180px]">{item.name}</span>
                          </td>
                          <td className="py-2.5 text-[#4e643f]">{item.category}</td>
                          <td className="py-2.5 font-semibold text-[#18260f]">${item.pricePaid}</td>
                          <td className="py-2.5 font-bold text-[#233517]">{item.timesWorn} wears</td>
                          <td className="py-2.5 font-black text-sm text-[#14220c]">${cpw}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${gradeBg}`}>
                              {grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: OUTFIT CALENDAR --- */}
      {activeTab === 'calendar' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="glass-panel p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#172312] font-display">
                  Outfit Wear Log & History
                </h3>
                <p className="text-xs text-[#526643]">
                  Avoid repeating identical looks for the same event or social circle
                </p>
              </div>
            </div>

            {outfitLogs.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#586f4a]">
                No outfits logged yet. Tap "Wear this outfit today" on any recommendation to start logging!
              </div>
            ) : (
              <div className="space-y-3">
                {outfitLogs.map((log) => {
                  const loggedItems = log.itemIds
                    .map((id) => items.find((i) => i.id === id))
                    .filter(Boolean) as WardrobeItem[];

                  return (
                    <div
                      key={log.id}
                      className="bg-white/80 p-3.5 rounded-2xl border border-[#d6eab9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-xl bg-[#edf5e1] border border-[#d6eab9] text-center">
                          <span className="text-[10px] uppercase font-bold text-[#566e47] block">
                            Date
                          </span>
                          <span className="text-xs font-black text-[#15230f]">
                            {log.date}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-[#1a2811]">{log.occasion}</h4>
                          {log.notes && (
                            <p className="text-[11px] text-[#556947] mt-0.5 italic">"{log.notes}"</p>
                          )}
                        </div>
                      </div>

                      {/* Small thumbnails of items in outfit */}
                      <div className="flex items-center gap-1.5 overflow-x-auto">
                        {loggedItems.map((it) => (
                          <div
                            key={it.id}
                            className="w-10 h-10 rounded-xl overflow-hidden bg-white p-0.5 border border-[#d6eab9] shrink-0"
                            title={it.name}
                          >
                            <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover rounded-lg" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4: TRAVEL PACKING LIST GENERATOR --- */}
      {activeTab === 'packing' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="glass-panel p-5 sm:p-6 rounded-3xl space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-[#294218]" />
                <h3 className="text-base font-extrabold text-[#172312] font-display">
                  AI Capsule Packing List Generator
                </h3>
              </div>
              <p className="text-xs text-[#526643] mt-0.5">
                Tell Gemini where you are traveling and for how many days. It builds a customized capsule packing list using ONLY clothes in your wardrobe!
              </p>
            </div>

            <form onSubmit={handleGeneratePacking} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-[#203115] block mb-1">Destination</label>
                <input
                  type="text"
                  value={packingDestination}
                  onChange={(e) => setPackingDestination(e.target.value)}
                  placeholder="e.g. Goa, Paris, Tokyo, Aspen"
                  className="w-full bg-white p-2.5 rounded-xl border border-[#d6eab9]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#203115] block mb-1">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={packingDays}
                  onChange={(e) => setPackingDays(Number(e.target.value))}
                  className="w-full bg-white p-2.5 rounded-xl border border-[#d6eab9]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#203115] block mb-1">Trip Vibe / Purpose</label>
                <input
                  type="text"
                  value={packingVibe}
                  onChange={(e) => setPackingVibe(e.target.value)}
                  placeholder="e.g. Beach holiday, Business conference"
                  className="w-full bg-white p-2.5 rounded-xl border border-[#d6eab9]"
                />
              </div>

              <div className="sm:col-span-3 pt-1">
                <button
                  type="submit"
                  disabled={isGeneratingPacking}
                  className="px-5 py-2.5 rounded-full font-bold text-xs bg-[#1a2911] hover:bg-[#283f18] text-[#d4f84d] transition-all flex items-center gap-2 shadow-md disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4 text-[#d4f84d]" />
                  <span>{isGeneratingPacking ? 'Building Capsule...' : 'Generate Packing Capsule'}</span>
                </button>
              </div>
            </form>

            {/* Generated Packing Plan */}
            {packingPlan && (
              <div className="pt-4 border-t border-[#deecd0] space-y-4 animate-fadeIn">
                <div className="p-3.5 rounded-2xl bg-[#edf5e1] border border-[#d6eab9]">
                  <h4 className="text-sm font-extrabold text-[#172412]">
                    Capsule for {packingPlan.destination} ({packingPlan.durationDays} Days)
                  </h4>
                  <p className="text-xs text-[#4b633b] mt-0.5">{packingPlan.weatherSummary}</p>
                </div>

                {/* Packing Checklist by category */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {packingPlan.checklist.map((group, idx) => (
                    <div key={idx} className="bg-white/85 p-3.5 rounded-2xl border border-[#d6eab9] space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d663c]">
                        {group.category}
                      </span>
                      <ul className="space-y-1 text-xs">
                        {group.itemNames.map((name, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-[#1b2b11]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#6da714] shrink-0" />
                            <span className="truncate">{name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Packing tips */}
                {packingPlan.packingTips && packingPlan.packingTips.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-white/70 border border-[#d6eab9] text-xs text-[#283b1c] space-y-1">
                    <span className="font-bold block text-[#1b2b11]">Travel Stylist Tips:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#4d643a]">
                      {packingPlan.packingTips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
