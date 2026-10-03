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
  Layers,
} from 'lucide-react';
import { WardrobeItem, Category, Occasion } from '../types/wardrobe';
import { triggerConfetti } from '../utils/helpers';

interface ScannerModalProps {
  onClose: () => void;
  onSaveItem: (item: Partial<WardrobeItem>) => Promise<void>;
  existingItems: WardrobeItem[];
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  onClose,
  onSaveItem,
  existingItems,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<any | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'scanning' | 'review'>('upload');
  const [pricePaid, setPricePaid] = useState<number>(65);
  const [userEditedTags, setUserEditedTags] = useState<any>({});
  const [scanStatusTicker, setScanStatusTicker] = useState('Initiating Gemini Vision...');

  // Dedicated refs for camera vs photo library
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Compression helper for instant mobile upload
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

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
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file);
      setImagePreview(compressedBase64);
      runGeminiScan(compressedBase64);
    } catch (err) {
      console.error('Image compression failed:', err);
    }
  };

  const runGeminiScan = async (base64Data: string) => {
    setIsAnalyzing(true);
    setActiveStep('scanning');
    setDuplicateWarning(null);

    const tickerSteps = [
      'Scanning clothing silhouette & aura...',
      'Segmenting fabric weave & material weight...',
      'Detecting exact color hex & undertones with Gemini...',
      'Calculating capsule wardrobe compatibility...',
    ];
    let tickerIdx = 0;
    const interval = setInterval(() => {
      tickerIdx = (tickerIdx + 1) % tickerSteps.length;
      setScanStatusTicker(tickerSteps[tickerIdx]);
    }, 850);

    try {
      const res = await fetch('/api/analyze-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data || imagePreview || '',
          mimeType: 'image/jpeg',
        }),
      });

      const data = await res.json();
      clearInterval(interval);

      if (data.success && data.analysis) {
        setAnalyzedData(data.analysis);
        setUserEditedTags(data.analysis);

        // Real duplicate check against user's actual items
        const dupRes = await fetch('/api/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateItem: data.analysis }),
        });
        const dupData = await dupRes.json();
        if (dupData.hasDuplicate) {
          setDuplicateWarning(dupData.warning);
        }

        setActiveStep('review');
      }
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      setActiveStep('review');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToWardrobe = async () => {
    if (!imagePreview) return;
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
      userEdited: false,
    };

    await onSaveItem(newItem);
    triggerConfetti();
    onClose();
  };

  const compatibilityScore = analyzedData?.wardrobeCompatibility || 88;
  const possibleCombinations = analyzedData?.possibleCombinations || Math.max(12, existingItems.length * 6);
  const costPerOneWear = (pricePaid / 25).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      {/* iOS sheet on mobile, rounded modal on desktop */}
      <div className="glass-panel w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh] bg-white/95">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 sm:hidden"></div>

        {/* Top Header */}
        <div className="p-4 sm:px-6 sm:pt-4 sm:pb-3 flex items-center justify-between border-b border-[#e2edd3]">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-[#1f2f14] flex items-center justify-center transition-all shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>

          <h2 className="text-lg font-black tracking-tight text-[#162510] font-display">
            Add new Item
          </h2>

          <div className="w-9 h-9 rounded-full bg-[#d4f84d] text-[#1c2c11] flex items-center justify-center shadow-xs">
            <Zap className="w-4 h-4 fill-current" />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Top 3 Metric Cards (Screen 2 Mockup) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#f8faf3] rounded-2xl p-2.5 text-center border border-[#d6eab9]">
              <span className="text-[10px] text-[#556c45] font-semibold block leading-tight">
                Wardrobe compatibility
              </span>
              <div className="text-lg font-black text-[#15230f] mt-1">
                {compatibilityScore}%
              </div>
              <div className="w-8 h-1 bg-[#d4f84d] rounded-full mx-auto mt-1"></div>
            </div>

            <div className="bg-[#f8faf3] rounded-2xl p-2.5 text-center border border-[#d6eab9]">
              <span className="text-[10px] text-[#556c45] font-semibold block leading-tight">
                New combos
              </span>
              <div className="text-lg font-black text-[#15230f] mt-1">
                +{possibleCombinations}
              </div>
              <span className="text-[9px] text-[#6c845b] font-medium">Unlocked</span>
            </div>

            <div className="bg-[#f8faf3] rounded-2xl p-2.5 text-center border border-[#d6eab9]">
              <span className="text-[10px] text-[#556c45] font-semibold block leading-tight">
                Cost per wear
              </span>
              <div className="text-lg font-black text-[#15230f] mt-1">
                ${costPerOneWear}
              </div>
              <span className="text-[9px] text-[#6c845b] font-medium">@ 25 wears</span>
            </div>
          </div>

          {/* Center Visual Canvas with AI Glowing Aura */}
          <div className="relative w-full aspect-square max-h-[300px] rounded-3xl overflow-hidden bg-[#edf4e6] border-2 border-white flex items-center justify-center shadow-inner">
            {imagePreview ? (
              <div className="relative w-full h-full flex items-center justify-center p-3">
                <img
                  src={imagePreview}
                  alt="Scanned item"
                  className={`max-w-full max-h-full object-contain transition-all duration-700 ${
                    activeStep === 'scanning' ? 'aura-scan-border scale-95 rounded-2xl' : 'rounded-2xl'
                  }`}
                />

                {activeStep === 'scanning' && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#d4f84d]/40 to-transparent pointer-events-none animate-pulse"></div>
                )}

                <button
                  onClick={() => {
                    setImagePreview(null);
                    setAnalyzedData(null);
                    setActiveStep('upload');
                  }}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black text-white text-[11px] font-bold backdrop-blur-sm transition-all"
                >
                  Retake Photo
                </button>
              </div>
            ) : (
              /* Apple style Camera / Upload Selection */
              <div className="p-6 text-center space-y-4 w-full">
                <div className="w-16 h-16 rounded-full bg-[#d4f84d]/40 border-2 border-[#b5ea28] flex items-center justify-center mx-auto text-[#182a0e] shadow-sm">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#172412]">
                    Add Real Clothes to Closet
                  </h3>
                  <p className="text-[11px] text-[#556947] max-w-xs mx-auto mt-0.5">
                    Gemini analyzes your item's silhouette, fabric, texture, color hex codes, and occasion tags.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {/* Native Mobile Camera Trigger */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-3 rounded-2xl bg-[#1b2b10] hover:bg-[#283f18] text-[#f7faf2] text-xs font-bold flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
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

                  {/* Photo Library Upload */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="p-3 rounded-2xl bg-white hover:bg-gray-50 text-[#1b2b10] text-xs font-bold border border-[#d6eab9] flex flex-col items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
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

                <div className="text-[10px] text-[#637d53] flex items-center justify-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Tip: Good lighting & flat lay deliver maximum AI accuracy</span>
                </div>
              </div>
            )}
          </div>

          {/* Scanning ticker */}
          {activeStep === 'scanning' && (
            <div className="p-4 rounded-2xl bg-[#edf5e0] border border-[#d4f84d] text-center space-y-2 animate-fadeIn">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#1b2b11]">
                <Sparkles className="w-4 h-4 text-[#75a818] animate-spin" />
                <span>{scanStatusTicker}</span>
              </div>
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
          {activeStep === 'review' && analyzedData && (
            <div className="space-y-3.5 bg-white/80 p-4 rounded-2xl border border-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#213516] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#66a011]" />
                  AI Tag Extraction Review
                </span>
                <span className="text-[11px] font-semibold text-[#5a714a]">
                  Confidence: {analyzedData.confidenceScore}%
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold text-[#253919] block mb-1">Item Title</label>
                  <input
                    type="text"
                    value={userEditedTags.name || ''}
                    onChange={(e) =>
                      setUserEditedTags({ ...userEditedTags, name: e.target.value })
                    }
                    className="w-full bg-[#f8faf4] p-2 rounded-xl border border-[#d6eab9] font-semibold text-[#162510]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-[#253919] block mb-1">Category</label>
                    <input
                      type="text"
                      value={userEditedTags.category || ''}
                      onChange={(e) =>
                        setUserEditedTags({ ...userEditedTags, category: e.target.value })
                      }
                      className="w-full bg-[#f8faf4] p-2 rounded-xl border border-[#d6eab9]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#253919] block mb-1">Price Paid ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={pricePaid}
                      onChange={(e) => setPricePaid(Number(e.target.value))}
                      className="w-full bg-[#f8faf4] p-2 rounded-xl border border-[#d6eab9]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-[#253919] block mb-1">Fabric</label>
                    <input
                      type="text"
                      value={userEditedTags.fabric || ''}
                      onChange={(e) =>
                        setUserEditedTags({ ...userEditedTags, fabric: e.target.value })
                      }
                      className="w-full bg-[#f8faf4] p-2 rounded-xl border border-[#d6eab9]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#253919] block mb-1">Silhouette</label>
                    <input
                      type="text"
                      value={userEditedTags.fitStyle || ''}
                      onChange={(e) =>
                        setUserEditedTags({ ...userEditedTags, fitStyle: e.target.value })
                      }
                      className="w-full bg-[#f8faf4] p-2 rounded-xl border border-[#d6eab9]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-[#253919] block mb-1">Color Name</label>
                    <input
                      type="text"
                      value={userEditedTags.primaryColorName || ''}
                      onChange={(e) =>
                        setUserEditedTags({
                          ...userEditedTags,
                          primaryColorName: e.target.value,
                        })
                      }
                      className="w-full bg-[#f8faf4] p-2 rounded-xl border border-[#d6eab9]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#253919] block mb-1">Color Hex</label>
                    <input
                      type="text"
                      value={userEditedTags.primaryColorHex || ''}
                      onChange={(e) =>
                        setUserEditedTags({
                          ...userEditedTags,
                          primaryColorHex: e.target.value,
                        })
                      }
                      className="w-full bg-[#f8faf4] p-2 rounded-xl border border-[#d6eab9]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#e2edd3] bg-white/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-[#4b6339]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveToWardrobe}
            disabled={!imagePreview || activeStep === 'scanning'}
            className="flex-1 py-3 rounded-full font-bold text-xs bg-[#1a2911] hover:bg-[#283f18] text-[#d4f84d] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <CheckCircle2 className="w-4 h-4 text-[#d4f84d]" />
            <span>Save to Wardrobe (+{possibleCombinations} Combos)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
