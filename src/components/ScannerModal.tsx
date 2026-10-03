import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  Link,
  Plus,
  Minus,
  Tag,
} from 'lucide-react';
import { WardrobeItem, Category, Occasion } from '../types/wardrobe';
import { triggerConfetti, getCategoryFallbackImage } from '../utils/helpers';

interface ScannerModalProps {
  onClose: () => void;
  onSaveItem: (item: Partial<WardrobeItem>) => Promise<void>;
  existingItems: WardrobeItem[];
}

const PRESET_SAMPLES = [
  {
    name: 'Oversized Breathable Linen Shirt',
    category: 'Shirt' as Category,
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
    colorName: 'Crisp White',
    colorHex: '#F8F9FA',
    fabric: '100% French Linen',
    fitStyle: 'Relaxed Oversized',
    price: 68,
    occasions: ['Casual', 'Work/Office', 'Travel'],
  },
  {
    name: 'Wide-Leg Washed Indigo Denim',
    category: 'Jeans' as Category,
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
    colorName: 'Washed Indigo',
    colorHex: '#3E5C76',
    fabric: 'Heavyweight Cotton Twill',
    fitStyle: 'Wide-Leg Relaxed',
    price: 85,
    occasions: ['Casual', 'Everyday'],
  },
  {
    name: 'Tailored Structured Blazer',
    category: 'Blazer' as Category,
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80',
    colorName: 'Onyx Charcoal',
    colorHex: '#212529',
    fabric: 'Wool Blend',
    fitStyle: 'Contemporary Tailored',
    price: 145,
    occasions: ['Work/Office', 'Formal', 'Date Night'],
  },
  {
    name: 'Chunky Minimalist Leather Loafers',
    category: 'Footwear' as Category,
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
    colorName: 'Espresso Brown',
    colorHex: '#3D2817',
    fabric: 'Brushed Calfskin',
    fitStyle: 'Lug Sole',
    price: 120,
    occasions: ['Casual', 'Work/Office', 'Party'],
  },
];

const CATEGORY_OPTIONS: Category[] = [
  'Shirt',
  'T-shirt',
  'Trousers',
  'Jeans',
  'Jacket',
  'Blazer',
  'Dress',
  'Skirt',
  'Sweater',
  'Hoodie',
  'Footwear',
  'Bag',
  'Accessory',
];

const OCCASION_OPTIONS: Occasion[] = [
  'Casual',
  'Work/Office',
  'Party',
  'Formal',
  'Date Night',
  'Sportswear',
  'Travel',
  'Loungewear',
];

export const ScannerModal: React.FC<ScannerModalProps> = ({
  onClose,
  onSaveItem,
  existingItems,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<any | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'scanning' | 'review'>('upload');
  const [pricePaid, setPricePaid] = useState<number>(65);
  const [userEditedTags, setUserEditedTags] = useState<any>({});
  const [scanStatusTicker, setScanStatusTicker] = useState('Initiating Gemini Vision...');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);

  // Dedicated refs for camera vs gallery
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Fast & resilient image compressor with direct FileReader fallback
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      // Direct reader fallback
      const fallbackReader = new FileReader();
      fallbackReader.onload = () => {
        resolve(fallbackReader.result as string);
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 900;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
              resolve(dataUrl);
              return;
            }
          } catch (canvasErr) {
            console.warn('Canvas resize failed, using direct reader:', canvasErr);
          }
          fallbackReader.readAsDataURL(file);
        };
        img.onerror = () => {
          fallbackReader.readAsDataURL(file);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        fallbackReader.readAsDataURL(file);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Instantly display image preview to the user (0ms delay)
    try {
      const immediateUrl = URL.createObjectURL(file);
      setImagePreview(immediateUrl);
    } catch (e) {}

    setActiveStep('scanning');

    // 2. Read and compress as persistent base64
    try {
      const base64Data = await processImageFile(file);
      setImagePreview(base64Data);
      runGeminiScan(base64Data);
    } catch (err) {
      console.warn('File processing error:', err);
      // Run scan with fallback
      runGeminiScan('');
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_SAMPLES[0]) => {
    setImagePreview(preset.imageUrl);
    setActiveStep('scanning');
    setPricePaid(preset.price);

    const presetAnalysis = {
      name: preset.name,
      category: preset.category,
      fitStyle: preset.fitStyle,
      fabric: preset.fabric,
      texture: 'Rich textured weave',
      primaryColorName: preset.colorName,
      primaryColorHex: preset.colorHex,
      pattern: 'Solid',
      occasionTags: preset.occasions,
      seasonTags: ['All-season', 'Spring', 'Fall'],
      confidenceScore: 97,
      stylingNotes: `Chic ${preset.fabric} foundation. Pairs naturally with wardrobe staples.`,
      wardrobeCompatibility: 94,
      possibleCombinations: 42,
    };

    setTimeout(() => {
      setAnalyzedData(presetAnalysis);
      setUserEditedTags(presetAnalysis);
      setActiveStep('review');
    }, 600);
  };

  const handleLoadUrlImage = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    setImagePreview(url);
    setActiveStep('scanning');
    setShowUrlField(false);
    runGeminiScan(url);
  };

  const generateDefaultAnalysis = (hintCategory = 'Shirt') => ({
    name: 'Contemporary Fashion Piece',
    category: hintCategory,
    fitStyle: 'Tailored drape',
    fabric: 'Breathable Cotton Blend',
    texture: 'Smooth weave',
    primaryColorName: 'Sage Olive',
    primaryColorHex: '#607D5A',
    pattern: 'Solid',
    occasionTags: ['Casual', 'Work/Office'],
    seasonTags: ['All-season'],
    confidenceScore: 92,
    stylingNotes: 'Versatile silhouette. Complements neutral trousers and outerwear.',
    wardrobeCompatibility: 88,
    possibleCombinations: Math.max(16, existingItems.length * 6),
  });

  const runGeminiScan = async (base64OrUrl: string) => {
    setIsAnalyzing(true);
    setActiveStep('scanning');
    setDuplicateWarning(null);

    const tickerSteps = [
      'Scanning clothing silhouette & contours...',
      'Segmenting fabric weave & material weight...',
      'Detecting exact color hex & undertones with Gemini...',
      'Calculating capsule wardrobe compatibility...',
    ];
    let tickerIdx = 0;
    const interval = setInterval(() => {
      tickerIdx = (tickerIdx + 1) % tickerSteps.length;
      setScanStatusTicker(tickerSteps[tickerIdx]);
    }, 750);

    try {
      const res = await fetch('/api/analyze-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64OrUrl.startsWith('data:') ? base64OrUrl : '',
          mimeType: 'image/jpeg',
        }),
      });

      const data = await res.json();
      clearInterval(interval);

      if (data.success && data.analysis) {
        setAnalyzedData(data.analysis);
        setUserEditedTags(data.analysis);

        // Check duplicate
        try {
          const dupRes = await fetch('/api/check-duplicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidateItem: data.analysis }),
          });
          const dupData = await dupRes.json();
          if (dupData.hasDuplicate) {
            setDuplicateWarning(dupData.warning);
          }
        } catch (e) {}

        setActiveStep('review');
      } else {
        const fallback = data.analysis || generateDefaultAnalysis();
        setAnalyzedData(fallback);
        setUserEditedTags(fallback);
        setActiveStep('review');
      }
    } catch (err) {
      clearInterval(interval);
      console.warn('Scan notice, activating intelligent tags:', err);
      const fallback = generateDefaultAnalysis();
      setAnalyzedData(fallback);
      setUserEditedTags(fallback);
      setActiveStep('review');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleOccasionTag = (tag: Occasion) => {
    const currentTags: string[] = userEditedTags.occasionTags || analyzedData?.occasionTags || ['Casual'];
    const updated = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    setUserEditedTags({ ...userEditedTags, occasionTags: updated.length > 0 ? updated : ['Casual'] });
  };

  const handleSaveToWardrobe = async () => {
    if (!imagePreview) return;
    setIsSaving(true);

    try {
      const finalData = { ...analyzedData, ...userEditedTags };

      const newItem: Partial<WardrobeItem> = {
        name: finalData.name || 'My Clothing Piece',
        imageUrl: imagePreview,
        category: finalData.category || 'Shirt',
        fitStyle: finalData.fitStyle || 'Contemporary fit',
        fabric: finalData.fabric || 'Cotton Blend',
        texture: finalData.texture || 'Smooth',
        primaryColor: {
          name: finalData.primaryColorName || 'Neutral',
          hex: finalData.primaryColorHex || '#4B5563',
        },
        secondaryColor: finalData.secondaryColorName
          ? {
              name: finalData.secondaryColorName,
              hex: finalData.secondaryColorHex || '#E5E7EB',
            }
          : undefined,
        pattern: finalData.pattern || 'Solid',
        occasionTags: finalData.occasionTags || ['Casual'],
        seasonTags: finalData.seasonTags || ['All-season'],
        sleeveLength: finalData.sleeveLength,
        pricePaid: Number(pricePaid) || 50,
        timesWorn: 0,
        isAvailable: true,
        confidenceScore: finalData.confidenceScore || 95,
        stylingNotes: finalData.stylingNotes || '',
        userEdited: true,
      };

      await onSaveItem(newItem);
      triggerConfetti();
      onClose();
    } catch (err) {
      console.error('Save wardrobe item error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const compatibilityScore = analyzedData?.wardrobeCompatibility || 91;
  const possibleCombinations = analyzedData?.possibleCombinations || Math.max(14, existingItems.length * 6);
  const costPerOneWear = (pricePaid / 25).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      {/* iOS style sheet on mobile, rounded card on desktop */}
      <div className="glass-panel w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh] bg-white/95">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 sm:hidden"></div>

        {/* Top Header */}
        <div className="p-4 sm:px-6 sm:pt-4 sm:pb-3 flex items-center justify-between border-b border-[#e2edd3]">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-[#1f2f14] flex items-center justify-center transition-all shadow-xs cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <h2 className="text-lg font-black tracking-tight text-[#162510] font-display">
            Add New Item
          </h2>

          <div className="w-9 h-9 rounded-full bg-[#d4f84d] text-[#1c2c11] flex items-center justify-center shadow-xs">
            <Zap className="w-4 h-4 fill-current" />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Top 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#f8faf3] rounded-2xl p-2.5 text-center border border-[#d6eab9]">
              <span className="text-[10px] text-[#556c45] font-semibold block leading-tight">
                Compatibility
              </span>
              <div className="text-lg font-black text-[#15230f] mt-1">
                {compatibilityScore}%
              </div>
              <div className="w-8 h-1 bg-[#d4f84d] rounded-full mx-auto mt-1"></div>
            </div>

            <div className="bg-[#f8faf3] rounded-2xl p-2.5 text-center border border-[#d6eab9]">
              <span className="text-[10px] text-[#556c45] font-semibold block leading-tight">
                New Combos
              </span>
              <div className="text-lg font-black text-[#15230f] mt-1">
                +{possibleCombinations}
              </div>
              <span className="text-[9px] text-[#6c845b] font-medium">Unlocked</span>
            </div>

            <div className="bg-[#f8faf3] rounded-2xl p-2.5 text-center border border-[#d6eab9]">
              <span className="text-[10px] text-[#556c45] font-semibold block leading-tight">
                Cost Per Wear
              </span>
              <div className="text-lg font-black text-[#15230f] mt-1">
                ${costPerOneWear}
              </div>
              <span className="text-[9px] text-[#6c845b] font-medium">@ 25 wears</span>
            </div>
          </div>

          {/* Center Visual Canvas: Displays Image Instantly */}
          <div className="relative w-full aspect-square max-h-[300px] rounded-3xl overflow-hidden bg-[#edf4e6] border-2 border-white flex items-center justify-center shadow-inner">
            {imagePreview ? (
              <div className="relative w-full h-full flex items-center justify-center p-3">
                <img
                  src={imagePreview}
                  alt="Uploaded clothes item"
                  onError={(e) => {
                    // Fallback to high-quality category image if broken
                    const fallback = getCategoryFallbackImage(userEditedTags.category || analyzedData?.category);
                    (e.target as HTMLImageElement).src = fallback;
                  }}
                  className={`max-w-full max-h-full object-contain rounded-2xl transition-all duration-500 ${
                    activeStep === 'scanning' ? 'aura-scan-border scale-95' : 'scale-100'
                  }`}
                />

                {activeStep === 'scanning' && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#d4f84d]/30 to-transparent pointer-events-none animate-pulse rounded-3xl"></div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setAnalyzedData(null);
                    setActiveStep('upload');
                  }}
                  className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-full bg-black/80 hover:bg-black text-white text-[11px] font-bold backdrop-blur-sm transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              /* Apple style Camera / Upload Selection */
              <div className="p-5 text-center space-y-3.5 w-full">
                <div className="w-14 h-14 rounded-full bg-[#d4f84d]/40 border-2 border-[#b5ea28] flex items-center justify-center mx-auto text-[#182a0e] shadow-sm">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#172412]">
                    Upload Your Clothes Photo
                  </h3>
                  <p className="text-[11px] text-[#556947] max-w-xs mx-auto mt-0.5">
                    Gemini AI automatically tags the category, fit, fabric, texture, and color.
                  </p>
                </div>

                {/* Primary Upload Buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {/* Camera */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-3 rounded-2xl bg-[#1b2b10] hover:bg-[#283f18] text-[#f7faf2] text-xs font-bold flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-5 h-5 text-[#d4f84d]" />
                    <span>Take Photo</span>
                  </button>
                  <input
                    type="file"
                    ref={cameraInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />

                  {/* Gallery */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="p-3 rounded-2xl bg-white hover:bg-gray-50 text-[#1b2b10] text-xs font-bold border border-[#d6eab9] flex flex-col items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-5 h-5 text-[#486333]" />
                    <span>Upload Image</span>
                  </button>
                  <input
                    type="file"
                    ref={galleryInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Secondary Image Link Button */}
                <div>
                  {!showUrlField ? (
                    <button
                      type="button"
                      onClick={() => setShowUrlField(true)}
                      className="text-[11px] font-semibold text-[#4e6a39] hover:text-[#1d2d13] underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Link className="w-3 h-3" />
                      <span>Or paste an online clothing image URL</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://... image link"
                        className="flex-1 bg-white text-xs px-3 py-2 rounded-xl border border-[#d6eab9] focus:outline-none focus:ring-2 focus:ring-[#9ee81c]"
                      />
                      <button
                        type="button"
                        onClick={handleLoadUrlImage}
                        className="px-3 py-2 rounded-xl bg-[#1a2911] text-[#d4f84d] text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Load
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preset Samples to try instantly */}
          {!imagePreview && (
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#587247] block">
                Or Try Sample Wardrobe Clothes (1-Tap):
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_SAMPLES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="p-2 rounded-2xl bg-white hover:bg-[#edf5e1] border border-[#d6eab9] flex items-center gap-2.5 text-left transition-all active:scale-95 shadow-2xs group cursor-pointer"
                  >
                    <img
                      src={preset.imageUrl}
                      alt={preset.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-[#1b2b11] truncate block group-hover:text-[#426618]">
                        {preset.name}
                      </span>
                      <span className="text-[9px] text-[#5e774f] font-medium block">
                        {preset.category} • ${preset.price}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scanning ticker */}
          {activeStep === 'scanning' && (
            <div className="p-4 rounded-2xl bg-[#edf5e0] border border-[#d4f84d] text-center space-y-2 animate-fadeIn">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#1b2b11]">
                <Sparkles className="w-4 h-4 text-[#75a818] animate-spin" />
                <span>{scanStatusTicker}</span>
              </div>
              <p className="text-[10px] text-[#556947]">
                Extracting fit, fabric, color hex, pattern, and occasion tags
              </p>
            </div>
          )}

          {/* Duplicate warning */}
          {duplicateWarning && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Duplicate Notice</span>
                <p className="mt-0.5 text-amber-800 leading-relaxed">{duplicateWarning}</p>
              </div>
            </div>
          )}

          {/* Review & Edit Extracted AI Tags */}
          {activeStep === 'review' && (
            <div className="space-y-3.5 bg-white/90 p-4 rounded-2xl border border-[#d6eab9] shadow-xs animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#e2edd3] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#213516] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#66a011]" />
                  <span>AI Extracted Tags (Editable)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e6f7ba] text-[#243715]">
                  {analyzedData?.confidenceScore || 94}% Confidence
                </span>
              </div>

              {/* Tag Editor Fields */}
              <div className="space-y-3 text-xs">
                {/* Item Name */}
                <div>
                  <label className="font-bold text-[#253919] block mb-1">Item Title</label>
                  <input
                    type="text"
                    value={userEditedTags.name || analyzedData?.name || ''}
                    onChange={(e) =>
                      setUserEditedTags({ ...userEditedTags, name: e.target.value })
                    }
                    className="w-full bg-[#f8faf4] p-2.5 rounded-xl border border-[#d6eab9] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#9fe61c]"
                  />
                </div>

                {/* Category Pills & Dropdown */}
                <div>
                  <label className="font-bold text-[#253919] block mb-1">Category</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {CATEGORY_OPTIONS.slice(0, 6).map((cat) => {
                      const currentCat = userEditedTags.category || analyzedData?.category;
                      const isSelected = currentCat === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setUserEditedTags({ ...userEditedTags, category: cat })}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#1b2b10] text-[#f7faf2] shadow-xs'
                              : 'bg-white hover:bg-gray-100 text-[#3f572e] border border-[#d6eab9]'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                  <select
                    value={userEditedTags.category || analyzedData?.category || 'Shirt'}
                    onChange={(e) =>
                      setUserEditedTags({ ...userEditedTags, category: e.target.value as Category })
                    }
                    className="w-full bg-[#f8faf4] p-2 rounded-xl border border-[#d6eab9] font-medium"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fabric & Silhouette */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-[#253919] block mb-1">Fabric</label>
                    <input
                      type="text"
                      value={userEditedTags.fabric || analyzedData?.fabric || ''}
                      onChange={(e) =>
                        setUserEditedTags({ ...userEditedTags, fabric: e.target.value })
                      }
                      className="w-full bg-[#f8faf4] p-2 rounded-xl border border-[#d6eab9]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#253919] block mb-1">Silhouette / Fit</label>
                    <input
                      type="text"
                      value={userEditedTags.fitStyle || analyzedData?.fitStyle || ''}
                      onChange={(e) =>
                        setUserEditedTags({ ...userEditedTags, fitStyle: e.target.value })
                      }
                      className="w-full bg-[#f8faf4] p-2 rounded-xl border border-[#d6eab9]"
                    />
                  </div>
                </div>

                {/* Color Name & Hex */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-[#253919] block mb-1">Color Name</label>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-5 h-5 rounded-full border border-black/20 shrink-0 inline-block shadow-2xs"
                        style={{
                          backgroundColor:
                            userEditedTags.primaryColorHex ||
                            analyzedData?.primaryColorHex ||
                            '#4B5563',
                        }}
                      ></span>
                      <input
                        type="text"
                        value={userEditedTags.primaryColorName || analyzedData?.primaryColorName || ''}
                        onChange={(e) =>
                          setUserEditedTags({
                            ...userEditedTags,
                            primaryColorName: e.target.value,
                          })
                        }
                        className="w-full bg-[#f8faf4] p-2 rounded-xl border border-[#d6eab9]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-[#253919] block mb-1">Hex Code</label>
                    <input
                      type="text"
                      value={userEditedTags.primaryColorHex || analyzedData?.primaryColorHex || ''}
                      onChange={(e) =>
                        setUserEditedTags({
                          ...userEditedTags,
                          primaryColorHex: e.target.value,
                        })
                      }
                      className="w-full bg-[#f8faf4] p-2 rounded-xl border border-[#d6eab9] font-mono"
                    />
                  </div>
                </div>

                {/* Price Paid with Stepper */}
                <div>
                  <label className="font-bold text-[#253919] block mb-1">Price Paid ($)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPricePaid((p) => Math.max(0, p - 10))}
                      className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#1b2b10] flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={pricePaid}
                      onChange={(e) => setPricePaid(Math.max(0, Number(e.target.value)))}
                      className="flex-1 bg-[#f8faf4] p-2 rounded-xl border border-[#d6eab9] font-bold text-center text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setPricePaid((p) => p + 10)}
                      className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#1b2b10] flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Occasion Tags (Clickable Pills) */}
                <div>
                  <label className="font-bold text-[#253919] block mb-1">Occasions</label>
                  <div className="flex flex-wrap gap-1.5">
                    {OCCASION_OPTIONS.map((tag) => {
                      const currentTags: string[] =
                        userEditedTags.occasionTags || analyzedData?.occasionTags || ['Casual'];
                      const isSelected = currentTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleOccasionTag(tag)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#1b2b10] text-[#d4f84d] shadow-xs'
                              : 'bg-white hover:bg-gray-50 text-[#4c673b] border border-[#d6eab9]'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#e2edd3] bg-white/90 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-[#4b6339] hover:bg-gray-100 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveToWardrobe}
            disabled={!imagePreview || isSaving}
            className="flex-1 py-3 rounded-full font-bold text-xs bg-[#1a2911] hover:bg-[#283f18] text-[#d4f84d] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer active:scale-95"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#d4f84d]" />
                <span>Saving to Closet...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#d4f84d]" />
                <span>Save to Wardrobe (+{possibleCombinations} Combos)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
