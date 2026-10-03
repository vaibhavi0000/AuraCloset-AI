import React from 'react';
import { Home, Shirt, Plus, Shuffle, PieChart } from 'lucide-react';

export type ActiveTab = 'today' | 'wardrobe' | 'mixmatch' | 'analytics';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenScanner: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenScanner,
}) => {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 px-3">
      <nav className="glass-pill px-3 py-2 rounded-full flex items-center gap-1.5 shadow-[0_16px_40px_-10px_rgba(20,35,12,0.18)] border border-white/80">
        {/* Today's Outfit */}
        <button
          onClick={() => onChangeTab('today')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'today'
              ? 'bg-[#1a2911] text-[#f4f8ec] shadow-sm'
              : 'text-[#445b33] hover:text-[#192710] hover:bg-[#eaf3dc]'
          }`}
          title="Today's Outfit"
        >
          <Home className="w-4 h-4" />
          <span className={activeTab === 'today' ? 'inline' : 'hidden md:inline'}>Today</span>
        </button>

        {/* Wardrobe Grid */}
        <button
          onClick={() => onChangeTab('wardrobe')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'wardrobe'
              ? 'bg-[#1a2911] text-[#f4f8ec] shadow-sm'
              : 'text-[#445b33] hover:text-[#192710] hover:bg-[#eaf3dc]'
          }`}
          title="Digital Wardrobe"
        >
          <Shirt className="w-4 h-4" />
          <span className={activeTab === 'wardrobe' ? 'inline' : 'hidden md:inline'}>Closet</span>
        </button>

        {/* Center Scanner Action */}
        <button
          onClick={onOpenScanner}
          className="relative -my-1 mx-1 w-11 h-11 rounded-full bg-[#d4f84d] hover:bg-[#c2ef31] text-[#14230c] flex items-center justify-center shadow-[0_6px_20px_rgba(212,248,77,0.55)] border-2 border-white transition-all hover:scale-105 active:scale-95 group"
          title="AI Scan & Add Clothes"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" />
        </button>

        {/* Mix & Match */}
        <button
          onClick={() => onChangeTab('mixmatch')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'mixmatch'
              ? 'bg-[#1a2911] text-[#f4f8ec] shadow-sm'
              : 'text-[#445b33] hover:text-[#192710] hover:bg-[#eaf3dc]'
          }`}
          title="Mix & Match Combos"
        >
          <Shuffle className="w-4 h-4" />
          <span className={activeTab === 'mixmatch' ? 'inline' : 'hidden md:inline'}>Combos</span>
        </button>

        {/* Analytics & Calendar */}
        <button
          onClick={() => onChangeTab('analytics')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'analytics'
              ? 'bg-[#1a2911] text-[#f4f8ec] shadow-sm'
              : 'text-[#445b33] hover:text-[#192710] hover:bg-[#eaf3dc]'
          }`}
          title="Wardrobe Analytics & Cost Per Wear"
        >
          <PieChart className="w-4 h-4" />
          <span className={activeTab === 'analytics' ? 'inline' : 'hidden md:inline'}>Insights</span>
        </button>
      </nav>
    </div>
  );
};
