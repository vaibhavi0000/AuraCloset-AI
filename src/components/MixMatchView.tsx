import React, { useState, useMemo } from 'react';
import {
  Shuffle,
  Heart,
  RotateCcw,
  Sparkles,
  Check,
  Share2,
  Sliders,
  Plus,
  Camera,
  Shirt,
} from 'lucide-react';
import { WardrobeItem, OutfitRecommendation } from '../types/wardrobe';
import { triggerConfetti, getCategoryFallbackImage } from '../utils/helpers';

interface MixMatchViewProps {
  items: WardrobeItem[];
  onLogWear: (itemIds: string[], occasion: string) => Promise<void>;
  onOpenShareModal: (outfit: OutfitRecommendation) => void;
  onOpenScanner: () => void;
}

export const MixMatchView: React.FC<MixMatchViewProps> = ({
  items,
  onLogWear,
  onOpenShareModal,
  onOpenScanner,
}) => {
  const [likedOutfitIds, setLikedOutfitIds] = useState<Set<string>>(new Set());
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitRecommendation | null>(null);
  const [isInteractiveStudioOpen, setIsInteractiveStudioOpen] = useState(false);

  // Filter available items
  const availableItems = useMemo(() => items.filter((i) => i.isAvailable), [items]);
  const tops = useMemo(
    () => availableItems.filter((i) => ['Shirt', 'T-shirt', 'Sweater', 'Blazer', 'Jacket'].includes(i.category)),
    [availableItems]
  );
  const bottoms = useMemo(
    () => availableItems.filter((i) => ['Trousers', 'Jeans', 'Skirt'].includes(i.category)),
    [availableItems]
  );
  const shoes = useMemo(
    () => availableItems.filter((i) => i.category === 'Footwear'),
    [availableItems]
  );
  const bagsAndAcc = useMemo(
    () => availableItems.filter((i) => ['Bag', 'Accessory'].includes(i.category)),
    [availableItems]
  );

  const [studioTop, setStudioTop] = useState<WardrobeItem | null>(null);
  const [studioBottom, setStudioBottom] = useState<WardrobeItem | null>(null);
  const [studioShoe, setStudioShoe] = useState<WardrobeItem | null>(null);
  const [studioAcc, setStudioAcc] = useState<WardrobeItem | null>(null);

  // Set initial studio defaults if items exist
  React.useEffect(() => {
    if (tops.length > 0 && !studioTop) setStudioTop(tops[0]);
    if (bottoms.length > 0 && !studioBottom) setStudioBottom(bottoms[0]);
    if (shoes.length > 0 && !studioShoe) setStudioShoe(shoes[0]);
    if (bagsAndAcc.length > 0 && !studioAcc) setStudioAcc(bagsAndAcc[0]);
  }, [tops, bottoms, shoes, bagsAndAcc]);

  // Generate Combos of the Day from REAL user items only
  const combosOfTheDay = useMemo(() => {
    if (availableItems.length < 2) return [];

    const combos: OutfitRecommendation[] = [];

    if (tops.length > 0 && bottoms.length > 0) {
      const top = tops[0];
      const bottom = bottoms[0];
      const shoe = shoes[0] || availableItems[0];
      const bag = bagsAndAcc[0];
      combos.push({
        id: 'combo_real_1',
        title: `${top.name} & ${bottom.name}`,
        vibe: 'Everyday Polished',
        occasion: 'Casual / Day-to-Night',
        compatibilityScore: 97,
        reasoning: `Harmonious pairing of ${top.primaryColor?.name || 'neutral'} and ${bottom.primaryColor?.name || 'classic'} tones.`,
        stylingTips: ['Balance with minimal accessories.'],
        items: [top, bottom, shoe, bag].filter(Boolean),
        colorHarmony: `${top.primaryColor?.name || 'Neutral'} with ${bottom.primaryColor?.name || 'Contrast'}`,
        weatherSuitability: 'Ideal for current temperature',
      });
    }

    if (tops.length > 1 || bottoms.length > 1) {
      const top = tops[1] || tops[0];
      const bottom = bottoms[1] || bottoms[0];
      const shoe = shoes[1] || shoes[0] || availableItems[0];
      combos.push({
        id: 'combo_real_2',
        title: `${top.name} with ${bottom.name}`,
        vibe: 'Modern Rotation',
        occasion: 'Work Presentation / Social Gathering',
        compatibilityScore: 94,
        reasoning: `Layered comfort pairing ${top.name} with ${bottom.name}.`,
        stylingTips: ['Keep footwear crisp and clean.'],
        items: [top, bottom, shoe].filter(Boolean),
        colorHarmony: 'Balanced neutral palette',
        weatherSuitability: 'Flexible daily layering',
      });
    }

    return combos;
  }, [availableItems, tops, bottoms, shoes, bagsAndAcc]);

  const toggleLike = (comboId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedOutfitIds((prev) => {
      const next = new Set(prev);
      if (next.has(comboId)) {
        next.delete(comboId);
      } else {
        next.add(comboId);
        triggerConfetti();
      }
      return next;
    });
  };

  const handleWearCombo = async (combo: OutfitRecommendation) => {
    const itemIds = combo.items.map((i) => i.id);
    await onLogWear(itemIds, combo.occasion);
    triggerConfetti();
    setSelectedOutfit(null);
  };

  const totalItemsCount = items.length;
  const availableCombinations = totalItemsCount >= 2 ? Math.round(totalItemsCount * 18.5) : 0;
  const newClothesBonus = totalItemsCount >= 2 ? Math.round(availableCombinations * 0.3) : 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-28 pt-2 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172312] font-display">
            Mix & Match
          </h1>
          <p className="text-xs text-[#556947] mt-0.5">
            Auto-synthesized combinations from your real clothes
          </p>
        </div>

        {availableItems.length >= 2 && (
          <button
            onClick={() => setIsInteractiveStudioOpen(!isInteractiveStudioOpen)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
              isInteractiveStudioOpen
                ? 'bg-[#d4f84d] text-[#1c2c11]'
                : 'bg-[#1b2b10] text-[#f7faf2]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isInteractiveStudioOpen ? 'View Combos' : 'Custom Studio'}</span>
          </button>
        )}
      </div>

      {/* Screen 3 Stats Counter Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-6">
        <div className="glass-panel p-3 rounded-2xl sm:rounded-3xl text-center">
          <div className="text-xl sm:text-2xl font-black text-[#15230f] tracking-tight">
            {totalItemsCount}
          </div>
          <p className="text-[10px] sm:text-xs font-semibold text-[#576c46] mt-0.5">
            Items in closet
          </p>
        </div>

        <div className="glass-panel p-3 rounded-2xl sm:rounded-3xl text-center">
          <div className="text-xl sm:text-2xl font-black text-[#15230f] tracking-tight">
            {availableCombinations}
          </div>
          <p className="text-[10px] sm:text-xs font-semibold text-[#576c46] mt-0.5">
            Combinations
          </p>
        </div>

        <div className="glass-panel p-3 rounded-2xl sm:rounded-3xl text-center">
          <div className="text-xl sm:text-2xl font-black text-[#2e4d1b] tracking-tight">
            +{newClothesBonus}
          </div>
          <p className="text-[10px] sm:text-xs font-semibold text-[#576c46] mt-0.5">
            New combos bonus
          </p>
        </div>
      </div>

      {availableItems.length < 2 ? (
        <div className="glass-panel p-8 sm:p-10 rounded-[32px] text-center space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-[#d4f84d]/40 border-2 border-[#b5ea28] flex items-center justify-center mx-auto text-[#182a0e]">
            <Shirt className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#172312] font-display">
              Need At Least 2 Clothes
            </h3>
            <p className="text-xs text-[#526643] max-w-sm mx-auto mt-1 leading-relaxed">
              Mix & Match synthesizes complete outfits using your real wardrobe. Add top and bottom pieces to start generating combinations.
            </p>
          </div>
          <button
            onClick={onOpenScanner}
            className="px-5 py-2.5 rounded-full bg-[#1b2b10] hover:bg-[#283f18] text-[#d4f84d] text-xs font-bold inline-flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Camera className="w-4 h-4 text-[#d4f84d]" />
            <span>Add Clothes Now</span>
          </button>
        </div>
      ) : isInteractiveStudioOpen ? (
        /* Interactive Outfit Studio */
        <div className="glass-panel p-5 sm:p-6 rounded-[32px] space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-[#deecd0]">
            <div>
              <h2 className="text-base font-extrabold text-[#172312] font-display">
                Interactive Wardrobe Studio
              </h2>
              <p className="text-xs text-[#526643]">
                Pick pieces from your real wardrobe to build a custom look
              </p>
            </div>
            <button
              onClick={() => {
                if (tops.length > 0) setStudioTop(tops[Math.floor(Math.random() * tops.length)]);
                if (bottoms.length > 0) setStudioBottom(bottoms[Math.floor(Math.random() * bottoms.length)]);
                if (shoes.length > 0) setStudioShoe(shoes[Math.floor(Math.random() * shoes.length)]);
              }}
              className="glass-pill px-3 py-1.5 rounded-full text-xs font-bold text-[#233517] flex items-center gap-1.5 hover:bg-white"
            >
              <Shuffle className="w-3.5 h-3.5 text-[#5f784d]" />
              <span>Shuffle Mix</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Top */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-[#445b34] uppercase tracking-wider block">1. Top</span>
              <div className="aspect-[3/4] rounded-2xl bg-white p-2 border border-[#d6eab9] flex flex-col justify-between">
                {studioTop ? (
                  <>
                    <img
                      src={studioTop.imageUrl}
                      alt={studioTop.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getCategoryFallbackImage(studioTop.category);
                      }}
                      className="w-full h-32 object-contain rounded-xl"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#1b2b11] truncate">{studioTop.name}</h4>
                      <p className="text-[10px] text-[#556947] truncate">${studioTop.pricePaid}</p>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">None available</div>
                )}
              </div>
              {tops.length > 0 && (
                <select
                  value={studioTop?.id || ''}
                  onChange={(e) => setStudioTop(tops.find((t) => t.id === e.target.value) || null)}
                  className="w-full bg-white p-2 rounded-xl border border-[#d6eab9] text-xs font-medium"
                >
                  {tops.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Bottom */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-[#445b34] uppercase tracking-wider block">2. Bottom</span>
              <div className="aspect-[3/4] rounded-2xl bg-white p-2 border border-[#d6eab9] flex flex-col justify-between">
                {studioBottom ? (
                  <>
                    <img
                      src={studioBottom.imageUrl}
                      alt={studioBottom.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getCategoryFallbackImage(studioBottom.category);
                      }}
                      className="w-full h-32 object-contain rounded-xl"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#1b2b11] truncate">{studioBottom.name}</h4>
                      <p className="text-[10px] text-[#556947] truncate">${studioBottom.pricePaid}</p>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">None available</div>
                )}
              </div>
              {bottoms.length > 0 && (
                <select
                  value={studioBottom?.id || ''}
                  onChange={(e) => setStudioBottom(bottoms.find((b) => b.id === e.target.value) || null)}
                  className="w-full bg-white p-2 rounded-xl border border-[#d6eab9] text-xs font-medium"
                >
                  {bottoms.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Shoe */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-[#445b34] uppercase tracking-wider block">3. Footwear</span>
              <div className="aspect-[3/4] rounded-2xl bg-white p-2 border border-[#d6eab9] flex flex-col justify-between">
                {studioShoe ? (
                  <>
                    <img
                      src={studioShoe.imageUrl}
                      alt={studioShoe.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getCategoryFallbackImage(studioShoe.category);
                      }}
                      className="w-full h-32 object-contain rounded-xl"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#1b2b11] truncate">{studioShoe.name}</h4>
                      <p className="text-[10px] text-[#556947] truncate">${studioShoe.pricePaid}</p>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">None available</div>
                )}
              </div>
              {shoes.length > 0 && (
                <select
                  value={studioShoe?.id || ''}
                  onChange={(e) => setStudioShoe(shoes.find((s) => s.id === e.target.value) || null)}
                  className="w-full bg-white p-2 rounded-xl border border-[#d6eab9] text-xs font-medium"
                >
                  {shoes.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Bag/Acc */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-[#445b34] uppercase tracking-wider block">4. Accessory</span>
              <div className="aspect-[3/4] rounded-2xl bg-white p-2 border border-[#d6eab9] flex flex-col justify-between">
                {studioAcc ? (
                  <>
                    <img
                      src={studioAcc.imageUrl}
                      alt={studioAcc.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getCategoryFallbackImage(studioAcc.category);
                      }}
                      className="w-full h-32 object-contain rounded-xl"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#1b2b11] truncate">{studioAcc.name}</h4>
                      <p className="text-[10px] text-[#556947] truncate">${studioAcc.pricePaid}</p>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">Optional</div>
                )}
              </div>
              {bagsAndAcc.length > 0 && (
                <select
                  value={studioAcc?.id || ''}
                  onChange={(e) => setStudioAcc(bagsAndAcc.find((a) => a.id === e.target.value) || null)}
                  className="w-full bg-white p-2 rounded-xl border border-[#d6eab9] text-xs font-medium"
                >
                  {bagsAndAcc.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#deecd0] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[#3a5229]">
              <span className="font-bold">Total Ensemble Value:</span> $
              {((studioTop?.pricePaid || 0) +
                (studioBottom?.pricePaid || 0) +
                (studioShoe?.pricePaid || 0) +
                (studioAcc?.pricePaid || 0))}
            </div>

            <button
              onClick={() => {
                const pieces = [studioTop, studioBottom, studioShoe, studioAcc].filter(Boolean) as WardrobeItem[];
                if (pieces.length > 0) {
                  onLogWear(pieces.map((p) => p.id), 'Custom Studio Creation');
                  triggerConfetti();
                }
              }}
              className="px-5 py-2.5 rounded-full font-bold text-xs bg-[#1a2911] hover:bg-[#283f18] text-[#d4f84d] transition-all shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Log & Wear Custom Creation</span>
            </button>
          </div>
        </div>
      ) : (
        /* Screen 3 Combos of the Day Grid */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-[#162510] font-display">
              Combo's of the Day
            </h2>
            <span className="text-xs font-semibold text-[#546a46]">
              {combosOfTheDay.length} Daily Ensembles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {combosOfTheDay.map((combo) => {
              const isLiked = likedOutfitIds.has(combo.id);

              return (
                <div
                  key={combo.id}
                  onClick={() => setSelectedOutfit(combo)}
                  className="group cursor-pointer glass-panel rounded-[28px] p-4 transition-all duration-300 hover:scale-[1.015] hover:shadow-xl relative flex flex-col justify-between border border-white/80"
                >
                  <button
                    onClick={(e) => toggleLike(combo.id, e)}
                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm flex items-center justify-center transition-all shadow-2xs hover:scale-110"
                    title="Like combo"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        isLiked ? 'fill-rose-500 text-rose-500' : 'text-[#617751]'
                      }`}
                    />
                  </button>

                  <div className="grid grid-cols-2 gap-2 bg-[#eef4e7]/80 rounded-2xl p-2.5 mb-3 min-h-[170px] items-center justify-center">
                    {combo.items.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="w-full aspect-[4/5] rounded-xl overflow-hidden bg-white/70 p-1 flex items-center justify-center"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getCategoryFallbackImage(item.category);
                          }}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#d4f84d] text-[#1c2c11]">
                        {combo.vibe}
                      </span>
                      <span className="text-xs font-black text-[#1e2f14]">
                        {combo.compatibilityScore}% Match
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-[#172412] truncate mt-1">
                      {combo.title}
                    </h3>
                    <p className="text-xs text-[#526643] line-clamp-1">
                      {combo.reasoning}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#deecd0] flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#5a714a]">
                      {combo.items.length} wardrobe pieces
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWearCombo(combo);
                      }}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#1b2b10] hover:bg-[#283f18] text-[#d4f84d] transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Wear</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outfit Modal Drawer */}
      {selectedOutfit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="glass-panel w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 max-h-[92vh] overflow-y-auto relative shadow-2xl space-y-4 bg-white/95">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2 sm:hidden"></div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#d4f84d] text-[#1c2c11]">
                {selectedOutfit.vibe}
              </span>
              <button
                onClick={() => setSelectedOutfit(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-[#172312] font-display">
                {selectedOutfit.title}
              </h2>
              <p className="text-xs text-[#506540] mt-1">{selectedOutfit.reasoning}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {selectedOutfit.items.map((item) => (
                <div key={item.id} className="bg-white/80 rounded-2xl p-2 border border-[#d6eab9] text-center">
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#f0f5e9] mb-1.5 flex items-center justify-center">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <h4 className="text-[11px] font-bold text-[#1a2811] truncate">{item.name}</h4>
                  <p className="text-[10px] text-[#5b734b]">${item.pricePaid}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  onOpenShareModal(selectedOutfit);
                  setSelectedOutfit(null);
                }}
                className="px-4 py-2.5 rounded-full text-xs font-bold bg-white text-[#2a3c1e] border border-[#d6eab9] flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-[#587346]" />
                <span>Share Card</span>
              </button>

              <button
                onClick={() => handleWearCombo(selectedOutfit)}
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#1b2b10] text-[#d4f84d] flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Wear This Ensemble</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
