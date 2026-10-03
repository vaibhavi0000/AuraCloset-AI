import React, { useState } from 'react';
import { X, MapPin, Compass, Search, Check, Sparkles, AlertCircle } from 'lucide-react';
import { LiveWeatherData } from '../types/wardrobe';
import { fetchLiveWeatherByCity } from '../utils/weather';

interface LocationModalProps {
  isOpen: boolean;
  currentCity: string;
  onClose: () => void;
  onSelectCity: (city: string) => Promise<void>;
  onDetectGps: () => Promise<void>;
}

const POPULAR_CITIES = [
  'New York',
  'Paris',
  'London',
  'Tokyo',
  'Milan',
  'Mumbai',
  'Los Angeles',
  'Sydney',
];

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  currentCity,
  onClose,
  onSelectCity,
  onDetectGps,
}) => {
  const [cityInput, setCityInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await onSelectCity(cityInput.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'City not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGpsClick = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await onDetectGps();
      onClose();
    } catch (err: any) {
      setErrorMsg('Could not detect GPS. Please search your city below.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="glass-panel w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 shadow-2xl relative space-y-4 bg-white/95 max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3 sm:hidden"></div>

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#deecd0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#d4f84d] flex items-center justify-center text-[#182a0e]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#172312] font-display">
                Location & Weather
              </h3>
              <p className="text-[11px] text-[#556b46]">
                Sync real-time temperature and weather conditions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Auto Detect GPS button */}
        <button
          type="button"
          onClick={handleGpsClick}
          disabled={isLoading}
          className="w-full p-3.5 rounded-2xl bg-[#edf5e1] hover:bg-[#e1efd2] border border-[#d6eab9] flex items-center justify-between text-[#1c2c11] text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#d4f84d] flex items-center justify-center text-[#1c2c11]">
              <Compass className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </div>
            <div className="text-left">
              <span className="block">Auto-Detect Live Location</span>
              <span className="text-[10px] font-normal text-[#5a714a]">
                Uses GPS / network location for exact coordinates
              </span>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold text-[#455c34]">Detect</span>
        </button>

        {/* Search City Input */}
        <form onSubmit={handleCitySubmit} className="space-y-2">
          <label className="font-bold text-[#203115] text-xs block">
            Or Search City Worldwide
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="e.g. London, Tokyo, San Francisco, Dubai..."
              className="w-full bg-[#f8faf4] text-xs pl-9 pr-12 py-2.5 rounded-xl border border-[#d6eab9] focus:outline-none focus:ring-2 focus:ring-[#9fe61c]"
            />
            <button
              type="submit"
              disabled={!cityInput.trim() || isLoading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#1a2911] text-[#d4f84d] text-xs font-bold disabled:opacity-40"
            >
              Set
            </button>
          </div>
        </form>

        {/* Popular Cities */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-[#5c724c] uppercase tracking-wider block">
            Popular Cities
          </span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_CITIES.map((city) => (
              <button
                key={city}
                type="button"
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    await onSelectCity(city);
                    onClose();
                  } catch (e) {
                    setErrorMsg('Error loading weather');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  currentCity.toLowerCase() === city.toLowerCase()
                    ? 'bg-[#1b2b10] text-[#d4f84d] border-[#1b2b10] font-bold'
                    : 'bg-white hover:bg-gray-50 text-[#293d1b] border-[#d6eab9]'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
