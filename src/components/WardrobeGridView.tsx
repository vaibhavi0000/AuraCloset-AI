import React, { useState, useMemo } from 'react';
import {
  Search,
  Shirt,
  Sparkles,
  Edit3,
  Trash2,
  Check,
  X,
  Plus,
  RefreshCw,
  Clock,
  Camera,
  Upload,
  AlertTriangle,
  History,
  Tag,
} from 'lucide-react';
import { WardrobeItem, Category, Occasion, SearchHistoryItem } from '../types/wardrobe';
import { getCostPerWear, formatCurrency } from '../utils/helpers';

interface WardrobeGridViewProps {
  items: WardrobeItem[];
  searchHistory: SearchHistoryItem[];
  onOpenScanner: () => void;
  onUpdateItem: (item: WardrobeItem) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onWearItem: (item: WardrobeItem) => void;
  onSaveSearchQuery: (query: string, type: 'wardrobe' | 'stylist') => Promise<void>;
  onClearSearchHistory: () => Promise<void>;
}

const CATEGORIES: Category[] = [
  'Shirt',
  'T-shirt',
  'Trousers',
  'Jeans',
  'Jacket',
  'Dress',
  'Skirt',
  'Sweater',
  'Blazer',
  'Footwear',
  'Bag',
  'Accessory',
];

export const WardrobeGridView: React.FC<WardrobeGridViewProps> = ({
  items,
  searchHistory,
  onOpenScanner,
  onUpdateItem,
  onDeleteItem,
  onWearItem,
  onSaveSearchQuery,
  onClearSearchHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'closet' | 'laundry'>('all');
  const [selectedColorHex, setSelectedColorHex] = useState<string>('all');

  // Modals state
  const [detailItem, setDetailItem] = useState<WardrobeItem | null>(null);
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<WardrobeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  // Extract unique colors from user's actual items for palette swatch filter
  const colorSwatches = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => {
      if (item.primaryColor?.hex) {
        map.set(item.primaryColor.hex.toLowerCase(), item.primaryColor.name);
      }
    });
    return Array.from(map.entries()).map(([hex, name]) => ({ hex, name }));
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (availabilityFilter === 'closet' && !item.isAvailable) return false;
      if (availabilityFilter === 'laundry' && item.isAvailable) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      if (
        selectedColorHex !== 'all' &&
        item.primaryColor?.hex?.toLowerCase() !== selectedColorHex.toLowerCase()
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inName = item.name.toLowerCase().includes(q);
        const inCategory = item.category.toLowerCase().includes(q);
        const inFabric = item.fabric?.toLowerCase().includes(q);
        const inFit = item.fitStyle?.toLowerCase().includes(q);
        const inColor = item.primaryColor?.name?.toLowerCase().includes(q);
        const inOccasion = item.occasionTags?.some((o) => o.toLowerCase().includes(q));

        return inName || inCategory || inFabric || inFit || inColor || inOccasion;
      }

      return true;
    });
  }, [items, searchQuery, selectedCategory, availabilityFilter, selectedColorHex]);

  const totalInWardrobe = items.length;
  const inLaundryCount = items.filter((i) => !i.isAvailable).length;
  const activeCombinations = Math.max(0, Math.round(totalInWardrobe * 18.5));

  const handleToggleLaundry = async (item: WardrobeItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = { ...item, isAvailable: !item.isAvailable };
    await onUpdateItem(updated);
    if (detailItem?.id === item.id) {
      setDetailItem(updated);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const deletedName = itemToDelete.name;
      await onDeleteItem(itemToDelete.id);
      setItemToDelete(null);
      setDetailItem(null);
      setDeleteToast(`Removed "${deletedName}" from closet`);
      setTimeout(() => setDeleteToast(null), 3500);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    try {
      await onUpdateItem({ ...editingItem, userEdited: true });
      if (detailItem?.id === editingItem.id) {
        setDetailItem(editingItem);
      }
      setEditingItem(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSaveSearchQuery(searchQuery.trim(), 'wardrobe');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-28 pt-2 animate-fadeIn">
      {/* Toast Feedback */}
      {deleteToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#1b2b11] text-[#d4f84d] text-xs font-bold shadow-xl border border-white/20 flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-[#d4f84d]" />
          <span>{deleteToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172312] font-display">
            My Wardrobe
          </h1>
          <p className="text-xs text-[#556947] mt-0.5">
            {totalInWardrobe === 0
              ? 'Your private wardrobe is empty. Snap clothes to begin.'
              : `${totalInWardrobe} real items cataloged with fabric, color & cost-per-wear`}
          </p>
        </div>

        <button
          onClick={onOpenScanner}
          className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#1b2b10] hover:bg-[#283f18] text-[#f7faf2] text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-[#d4f84d]" />
          <span>Add New Clothes</span>
        </button>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-5">
        <div className="glass-panel p-3 rounded-2xl sm:rounded-3xl text-center">
          <div className="text-xl sm:text-2xl font-black text-[#15230f] tracking-tight">
            {totalInWardrobe}
          </div>
          <p className="text-[10px] sm:text-xs font-semibold text-[#576c46] mt-0.5">
            Items in closet
          </p>
        </div>

        <div className="glass-panel p-3 rounded-2xl sm:rounded-3xl text-center">
          <div className="text-xl sm:text-2xl font-black text-[#15230f] tracking-tight">
            {activeCombinations}
          </div>
          <p className="text-[10px] sm:text-xs font-semibold text-[#576c46] mt-0.5">
            Combinations
          </p>
        </div>

        <div className="glass-panel p-3 rounded-2xl sm:rounded-3xl text-center">
          <div className="text-xl sm:text-2xl font-black text-[#852a1b] tracking-tight">
            {inLaundryCount}
          </div>
          <p className="text-[10px] sm:text-xs font-semibold text-[#576c46] mt-0.5">
            In laundry
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-3xl mb-5 space-y-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#647953]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clothes by tag, fabric, color, or silhouette..."
            className="w-full bg-white/90 text-[#172510] placeholder-[#718762] text-xs sm:text-sm pl-10 pr-9 py-2.5 rounded-2xl border border-[#d6eab9] focus:outline-none focus:ring-2 focus:ring-[#9fe61c] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Search History Chips */}
        {searchHistory && searchHistory.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[10px] font-bold text-[#5c724c] flex items-center gap-1 shrink-0">
              <History className="w-3 h-3" />
              Recent:
            </span>
            {searchHistory.slice(0, 5).map((sh) => (
              <button
                key={sh.id}
                type="button"
                onClick={() => setSearchQuery(sh.query)}
                className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-white/80 hover:bg-white text-[#2b3e1e] border border-[#d6eab7] transition-all"
              >
                {sh.query}
              </button>
            ))}
            <button
              type="button"
              onClick={onClearSearchHistory}
              className="shrink-0 text-[10px] text-gray-400 hover:text-gray-600 underline ml-1"
            >
              Clear
            </button>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[#1a2911] text-[#f7faf2] shadow-xs'
                : 'bg-white/80 hover:bg-white text-[#3d522f] border border-[#d8ebb9]'
            }`}
          >
            All Items ({items.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = items.filter((i) => i.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#1a2911] text-[#f7faf2] shadow-xs'
                    : 'bg-white/80 hover:bg-white text-[#3d522f] border border-[#d8ebb9]'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Status & Color Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#d8ebb9]/70 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#5a714a]">Filter:</span>
            <button
              onClick={() => setAvailabilityFilter('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                availabilityFilter === 'all' ? 'bg-[#293d1b] text-white' : 'bg-white/70 text-[#3f5530]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setAvailabilityFilter('closet')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                availabilityFilter === 'closet' ? 'bg-[#293d1b] text-white' : 'bg-white/70 text-[#3f5530]'
              }`}
            >
              In Closet
            </button>
            <button
              onClick={() => setAvailabilityFilter('laundry')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                availabilityFilter === 'laundry' ? 'bg-[#852a1b] text-white' : 'bg-white/70 text-[#3f5530]'
              }`}
            >
              In Laundry ({inLaundryCount})
            </button>
          </div>

          {colorSwatches.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#5a714a]">Color:</span>
              <button
                onClick={() => setSelectedColorHex('all')}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  selectedColorHex === 'all' ? 'bg-[#1b2b10] text-white' : 'bg-white/70 text-[#394d2c]'
                }`}
              >
                All
              </button>
              <div className="flex items-center gap-1 overflow-x-auto max-w-[180px]">
                {colorSwatches.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() =>
                      setSelectedColorHex(selectedColorHex === color.hex ? 'all' : color.hex)
                    }
                    title={`${color.name} (${color.hex})`}
                    className={`w-4 h-4 rounded-full border transition-all ${
                      selectedColorHex.toLowerCase() === color.hex.toLowerCase()
                        ? 'ring-2 ring-[#223318] scale-125'
                        : 'border-black/20 hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty State / Grid of Items */}
      {items.length === 0 ? (
        <div className="glass-panel p-8 sm:p-12 rounded-[32px] text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#d4f84d]/40 border-2 border-[#b5ea28] flex items-center justify-center mx-auto text-[#182a0e] shadow-sm">
            <Shirt className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#172412] font-display">
              Your Wardrobe is Empty
            </h3>
            <p className="text-xs text-[#556947] max-w-sm mx-auto mt-1 leading-relaxed">
              No dummy items. Upload or snap photos of your real clothes to unlock AI outfit recommendations, color harmonies, and cost-per-wear tracking.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              onClick={onOpenScanner}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#1b2b10] hover:bg-[#283f18] text-[#d4f84d] text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Camera className="w-4 h-4 text-[#d4f84d]" />
              <span>Photograph First Item</span>
            </button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel p-10 rounded-3xl text-center space-y-3">
          <Shirt className="w-10 h-10 text-[#678056] mx-auto opacity-60" />
          <h3 className="text-base font-bold text-[#1b2b11]">No matching clothes found</h3>
          <p className="text-xs text-[#526842] max-w-sm mx-auto">
            Try adjusting your search query or color filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setAvailabilityFilter('all');
              setSelectedColorHex('all');
            }}
            className="px-4 py-2 rounded-full bg-[#1b2b10] text-[#f6f9f0] text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredItems.map((item) => {
            const costPerWear = getCostPerWear(item.pricePaid, item.timesWorn);
            return (
              <div
                key={item.id}
                onClick={() => setDetailItem(item)}
                className={`group cursor-pointer glass-panel rounded-3xl p-3 border transition-all duration-300 hover:scale-[1.015] hover:shadow-lg flex flex-col justify-between relative ${
                  !item.isAvailable ? 'opacity-70 bg-amber-50/40 border-amber-200' : 'hover:border-[#bcee31]'
                }`}
              >
                <div>
                  {/* Photo Container */}
                  <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-[#eef4e7] mb-2.5 flex items-center justify-center">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Category pill */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#1c2c11] shadow-2xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block"
                        style={{ backgroundColor: item.primaryColor?.hex || '#888' }}
                      ></span>
                      <span>{item.category}</span>
                    </div>

                    {/* Quick Delete Trash Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete(item);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 hover:bg-rose-500 hover:text-white text-gray-500 flex items-center justify-center transition-all shadow-xs"
                      title="Delete this clothing piece"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Laundry Overlay */}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          In Laundry
                        </span>
                      </div>
                    )}

                    {/* Bottom Cost-per-wear badge */}
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
                      ${costPerWear}/wear
                    </div>

                    {/* Wear count pill */}
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-[#273a19] px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-[#5f784d]" />
                      <span>{item.timesWorn}w</span>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <h3 className="text-xs font-bold text-[#192711] truncate">{item.name}</h3>
                  <p className="text-[11px] text-[#556b46] truncate mt-0.5">
                    {item.fabric} • {item.fitStyle}
                  </p>
                </div>

                {/* Footer tags */}
                <div className="pt-2 mt-2 border-t border-[#d8ebb9]/60 flex items-center justify-between text-[10px] text-[#506640]">
                  <span className="truncate max-w-[120px]">
                    {item.occasionTags?.slice(0, 2).join(', ') || 'Everyday'}
                  </span>
                  <span className="font-semibold text-[#1c2c11]">${item.pricePaid}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL (Replaces blocked window.confirm) --- */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass-panel w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative text-center space-y-4 border border-white/90 bg-white/95">
            <div className="w-14 h-14 rounded-full bg-rose-100 border-2 border-rose-200 flex items-center justify-center mx-auto text-rose-600">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-[#172312] font-display">
                Remove from Closet?
              </h3>
              <p className="text-xs text-[#556947] mt-1 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-[#172412]">"{itemToDelete.name}"</span>? This will permanently remove it from your wardrobe and reset its wear history.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="w-full sm:flex-1 py-2.5 rounded-full text-xs font-bold text-[#3d552a] bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-full sm:flex-1 py-2.5 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ITEM DETAIL MODAL --- */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="glass-panel w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 max-h-[92vh] overflow-y-auto relative shadow-2xl bg-white/95">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3 sm:hidden"></div>

            <button
              onClick={() => setDetailItem(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-[#2a3c1c] flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-full sm:w-48 aspect-[3/4] rounded-2xl overflow-hidden bg-[#eef4e6] shrink-0 relative">
                <img
                  src={detailItem.imageUrl}
                  alt={detailItem.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-2.5 w-full">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#d4f84d] text-[#1c2c11]">
                    {detailItem.category}
                  </span>
                  <h2 className="text-lg font-extrabold text-[#172412] mt-1 font-display">
                    {detailItem.name}
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-[#f8faf3] border border-[#d6eab9] text-center">
                  <div>
                    <span className="text-[9px] text-[#617750] uppercase font-semibold">Cost/Wear</span>
                    <p className="text-sm font-black text-[#1b2b11]">
                      ${getCostPerWear(detailItem.pricePaid, detailItem.timesWorn)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#617750] uppercase font-semibold">Times Worn</span>
                    <p className="text-sm font-black text-[#1b2b11]">{detailItem.timesWorn}w</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#617750] uppercase font-semibold">Price</span>
                    <p className="text-sm font-black text-[#1b2b11]">${detailItem.pricePaid}</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#e2f0d1]">
                    <span className="text-[#597148]">Silhouette:</span>
                    <span className="font-semibold text-[#1a2811]">{detailItem.fitStyle}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#e2f0d1]">
                    <span className="text-[#597148]">Fabric:</span>
                    <span className="font-semibold text-[#1a2811]">{detailItem.fabric}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#e2f0d1] items-center">
                    <span className="text-[#597148]">Color:</span>
                    <span className="font-semibold text-[#1a2811] flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full border border-black/10 inline-block"
                        style={{ backgroundColor: detailItem.primaryColor?.hex || '#888' }}
                      ></span>
                      {detailItem.primaryColor?.name} ({detailItem.primaryColor?.hex})
                    </span>
                  </div>
                </div>

                {detailItem.stylingNotes && (
                  <div className="p-2.5 rounded-xl bg-[#eef6e4] text-xs text-[#2a3c1e] border border-[#d6eab9]">
                    <span className="font-bold block mb-0.5">Styling Tip:</span>
                    {detailItem.stylingNotes}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-3 border-t border-[#deecd0] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleLaundry(detailItem)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    detailItem.isAvailable
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                      : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  {detailItem.isAvailable ? 'In Laundry' : 'Clean in Closet'}
                </button>

                <button
                  onClick={() => {
                    setEditingItem({ ...detailItem });
                    setDetailItem(null);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-gray-50 text-[#253919] border border-[#d6eab9] flex items-center gap-1.5 transition-all"
                >
                  <Edit3 className="w-3 h-3 text-[#587346]" />
                  Edit Tags
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onWearItem(detailItem);
                    setDetailItem({
                      ...detailItem,
                      timesWorn: detailItem.timesWorn + 1,
                      lastWornDate: new Date().toISOString().split('T')[0],
                    });
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#1a2a11] hover:bg-[#283f18] text-[#d4f84d] transition-all flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Wear Today
                </button>

                {/* Direct working delete trigger */}
                <button
                  onClick={() => setItemToDelete(detailItem)}
                  className="p-2 rounded-full text-rose-600 hover:bg-rose-50 transition-all"
                  title="Delete from wardrobe"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT ITEM MODAL --- */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="glass-panel w-full sm:max-w-xl rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 max-h-[92vh] overflow-y-auto relative shadow-2xl bg-white/95">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3 sm:hidden"></div>

            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#deecd0]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#2b401d]" />
                <h3 className="text-base font-extrabold text-[#172312] font-display">
                  Edit AI Tags & Attributes
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#203115] block mb-1">Item Title</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-[#f8faf4] p-2.5 rounded-xl border border-[#d6eab9]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#203115] block mb-1">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, category: e.target.value as Category })
                    }
                    className="w-full bg-[#f8faf4] p-2.5 rounded-xl border border-[#d6eab9]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#203115] block mb-1">Fit / Silhouette</label>
                  <input
                    type="text"
                    value={editingItem.fitStyle}
                    onChange={(e) => setEditingItem({ ...editingItem, fitStyle: e.target.value })}
                    className="w-full bg-[#f8faf4] p-2.5 rounded-xl border border-[#d6eab9]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#203115] block mb-1">Fabric</label>
                  <input
                    type="text"
                    value={editingItem.fabric}
                    onChange={(e) => setEditingItem({ ...editingItem, fabric: e.target.value })}
                    className="w-full bg-[#f8faf4] p-2.5 rounded-xl border border-[#d6eab9]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#203115] block mb-1">Original Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.pricePaid}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, pricePaid: Number(e.target.value) })
                    }
                    className="w-full bg-[#f8faf4] p-2.5 rounded-xl border border-[#d6eab9]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#deecd0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#486036]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-[#1a2911] hover:bg-[#283f18] text-[#d4f84d] transition-all shadow-sm"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
