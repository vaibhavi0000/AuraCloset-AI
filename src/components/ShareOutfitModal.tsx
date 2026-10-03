import React from 'react';
import { X, Sparkles, Download, Copy, Check, Instagram } from 'lucide-react';
import { OutfitRecommendation } from '../types/wardrobe';

interface ShareOutfitModalProps {
  outfit: OutfitRecommendation;
  onClose: () => void;
}

export const ShareOutfitModal: React.FC<ShareOutfitModalProps> = ({
  outfit,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(
      `Check out today's outfit styled with AuraCloset AI: "${outfit.title}" (${outfit.compatibilityScore}% compatibility)`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
      <div className="relative w-full max-w-sm flex flex-col items-center">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-black flex items-center justify-center shadow-md transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 9:16 Instagram Story Card */}
        <div
          id="instagram-story-card"
          className="w-full aspect-[9/16] rounded-[36px] p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl border-4 border-white/60 bg-gradient-to-b from-[#f2f7ea] via-[#e5f0d4] to-[#d8ebbe] text-[#162510]"
        >
          {/* Top Brand header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-xl bg-[#d4f84d] flex items-center justify-center text-[#182a0e] shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm tracking-tight font-display">
                AuraCloset AI
              </span>
            </div>

            <div className="glass-pill px-2.5 py-1 rounded-full text-[10px] font-bold text-[#2a3e1d]">
              {outfit.compatibilityScore}% Match
            </div>
          </div>

          {/* Center 2x2 Collage of Outfit Items */}
          <div className="my-auto py-2">
            <div className="grid grid-cols-2 gap-2.5">
              {outfit.items.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="aspect-[4/5] rounded-2xl bg-white/80 p-2 shadow-xs border border-white flex flex-col justify-between"
                >
                  <div className="w-full h-24 overflow-hidden rounded-xl bg-[#f0f5e9] flex items-center justify-center">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="mt-1">
                    <p className="text-[10px] font-bold text-[#1a2811] truncate">{item.name}</p>
                    <p className="text-[9px] text-[#556947] truncate">{item.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Stylist Signature */}
          <div className="glass-pill p-3.5 rounded-2xl space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#556d44] block">
              Today's Curated Look
            </span>
            <h3 className="text-sm font-black text-[#14210e] leading-snug">
              {outfit.title}
            </h3>
            <p className="text-[10px] text-[#4d633d] line-clamp-2">
              "{outfit.reasoning}"
            </p>
          </div>
        </div>

        {/* Action bar below card */}
        <div className="mt-3 flex items-center gap-2 w-full">
          <button
            onClick={handleCopyLink}
            className="flex-1 py-2.5 rounded-full text-xs font-bold bg-white text-[#192711] shadow-md flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied text!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={() => {
              alert('Screenshot or save this card directly for your Instagram Story!');
            }}
            className="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#1b2b10] text-[#d4f84d] shadow-md flex items-center justify-center gap-1.5 hover:bg-[#283f18] transition-all"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Story Ready</span>
          </button>
        </div>
      </div>
    </div>
  );
};
