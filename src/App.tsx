import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { TodayOutfitView } from './components/TodayOutfitView';
import { WardrobeGridView } from './components/WardrobeGridView';
import { MixMatchView } from './components/MixMatchView';
import { AnalyticsView } from './components/AnalyticsView';
import { ScannerModal } from './components/ScannerModal';
import { ProfileModal } from './components/ProfileModal';
import { AuthModal } from './components/AuthModal';
import { ShareOutfitModal } from './components/ShareOutfitModal';
import { LocationModal } from './components/LocationModal';
import {
  WardrobeItem,
  UserProfile,
  OutfitLog,
  OutfitRecommendation,
  SearchHistoryItem,
  LiveWeatherData,
} from './types/wardrobe';
import { triggerConfetti } from './utils/helpers';
import { requestGpsLiveWeather, fetchLiveWeatherByCity } from './utils/weather';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [user, setUser] = useState<UserProfile>({
    id: 'usr_me',
    name: 'My Closet',
    email: '',
    gender: 'women',
    city: 'New York',
    createdAt: new Date().toISOString(),
  });
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [outfitLogs, setOutfitLogs] = useState<OutfitLog[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Live real-time weather
  const [weather, setWeather] = useState<LiveWeatherData>({
    temp: 21,
    condition: 'Partly Cloudy',
    city: 'New York',
    isLiveGps: false,
  });

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [shareOutfit, setShareOutfit] = useState<OutfitRecommendation | null>(null);

  // Helper to get auth token
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('aura_token') || user.id || 'usr_me';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-user-id': token,
    };
  }, [user.id]);

  // Load user data and items
  const loadUserData = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [userRes, itemsRes, logsRes, searchRes] = await Promise.all([
        fetch('/api/auth/me', { headers }),
        fetch('/api/wardrobe', { headers }),
        fetch('/api/outfit-logs', { headers }),
        fetch('/api/search-history', { headers }),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.user) {
          setUser(userData.user);
        }
      }

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(Array.isArray(itemsData.items) ? itemsData.items : []);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setOutfitLogs(Array.isArray(logsData.logs) ? logsData.logs : []);
      }

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        setSearchHistory(Array.isArray(searchData.history) ? searchData.history : []);
      }
    } catch (err) {
      console.warn('Data load error:', err);
    }
  }, [getAuthHeaders]);

  // Initial load & real-time GPS weather initialization
  useEffect(() => {
    loadUserData();

    // Attempt live GPS weather
    requestGpsLiveWeather()
      .then((liveWeather) => {
        setWeather(liveWeather);
        setUser((prev) => ({ ...prev, city: liveWeather.city }));
      })
      .catch(() => {
        // Fallback to city live weather
        fetchLiveWeatherByCity('New York')
          .then((cityWeather) => setWeather(cityWeather))
          .catch(() => {});
      });
  }, []);

  // Live GPS sync trigger
  const handleLiveGpsSync = async () => {
    try {
      const liveWeather = await requestGpsLiveWeather();
      setWeather(liveWeather);
      setUser((prev) => ({ ...prev, city: liveWeather.city }));
      // Save city to user profile
      await fetch('/api/user', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ city: liveWeather.city }),
      });
    } catch (err) {
      console.warn('GPS prompt dismissed, fetching by current city:', err);
      const cityWeather = await fetchLiveWeatherByCity(user.city || 'New York');
      setWeather(cityWeather);
    }
  };

  // City selection handler
  const handleSelectCity = async (cityName: string) => {
    try {
      const cityWeather = await fetchLiveWeatherByCity(cityName);
      setWeather(cityWeather);
      setUser((prev) => ({ ...prev, city: cityWeather.city }));
      await fetch('/api/user', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ city: cityWeather.city }),
      });
    } catch (err) {
      console.error('Select city error:', err);
      throw err;
    }
  };

  // Auth success handler
  const handleAuthSuccess = async (authUser: UserProfile, token: string) => {
    localStorage.setItem('aura_token', token);
    setUser(authUser);
    if (authUser.city) {
      try {
        const cityWeather = await fetchLiveWeatherByCity(authUser.city);
        setWeather(cityWeather);
      } catch (e) {}
    }
    // Refetch items for the signed in user
    await loadUserData();
    triggerConfetti();
  };

  const handleLogout = async () => {
    localStorage.removeItem('aura_token');
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser({
      id: 'usr_me',
      name: 'Guest Closet',
      email: '',
      gender: 'women',
      city: weather.city || 'New York',
      createdAt: new Date().toISOString(),
    });
    setItems([]);
    setOutfitLogs([]);
    setSearchHistory([]);
  };

  // Wardrobe Handlers
  const handleSaveItem = async (newItem: Partial<WardrobeItem>) => {
    try {
      const res = await fetch('/api/wardrobe', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newItem),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) => [data.item, ...prev]);
      }
    } catch (err) {
      console.error('Save item error:', err);
    }
  };

  const handleUpdateItem = async (updatedItem: WardrobeItem) => {
    try {
      const res = await fetch(`/api/wardrobe/${updatedItem.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedItem),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) =>
          prev.map((i) => (i.id === updatedItem.id ? data.item : i))
        );
      }
    } catch (err) {
      console.error('Update item error:', err);
    }
  };

  // Working Delete Handler (AUDITED & WORKING)
  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/wardrobe/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error('Delete item error:', err);
    }
  };

  // Wear outfit logging
  const handleLogWear = async (itemIds: string[], occasion: string) => {
    try {
      const res = await fetch('/api/outfit-logs', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ itemIds, occasion }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.log) {
          setOutfitLogs((prev) => [data.log, ...prev]);
        }
        if (data.updatedItems) {
          setItems(data.updatedItems);
        }
      }
    } catch (err) {
      console.error('Log wear error:', err);
    }
  };

  const handleWearSingleItem = async (item: WardrobeItem) => {
    await handleLogWear([item.id], `Wore ${item.name}`);
    triggerConfetti();
  };

  // Search History Handlers
  const handleSaveSearchQuery = async (query: string, type: 'wardrobe' | 'stylist') => {
    try {
      const res = await fetch('/api/search-history', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ query, type }),
      });
      const data = await res.json();
      if (data.success && data.entry) {
        setSearchHistory((prev) => [
          data.entry,
          ...prev.filter((p) => p.query.toLowerCase() !== query.toLowerCase()),
        ]);
      }
    } catch (err) {
      console.error('Search history error:', err);
    }
  };

  const handleClearSearchHistory = async () => {
    try {
      await fetch('/api/search-history', {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      setSearchHistory([]);
    } catch (err) {
      console.error('Clear search error:', err);
    }
  };

  const handleUpdateUser = async (updated: Partial<UserProfile>) => {
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        if (data.user.city && data.user.city !== weather.city) {
          try {
            const cityWeather = await fetchLiveWeatherByCity(data.user.city);
            setWeather(cityWeather);
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Update user error:', err);
    }
  };

  const handleResetData = async () => {
    try {
      const res = await fetch('/api/reset-data', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setItems([]);
        setOutfitLogs([]);
        setSearchHistory([]);
      }
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#f7f9f3] text-[#1a2515] pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* Ambient background blur spots */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#d8f47c]/25 blur-[120px]"></div>
        <div className="absolute -top-20 -right-20 w-[550px] h-[550px] rounded-full bg-[#fdd9ce]/30 blur-[130px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full bg-[#e5f7b0]/25 blur-[150px]"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Header */}
        <Navbar
          user={user}
          weather={weather}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          onRefreshWeather={async () => setIsLocationOpen(true)}
        />

        {/* Views */}
        <main className="flex-1">
          {activeTab === 'today' && (
            <TodayOutfitView
              items={items}
              user={user}
              weather={weather}
              searchHistory={searchHistory}
              onLogWear={handleLogWear}
              onOpenShareModal={(outfit) => setShareOutfit(outfit)}
              onNavigateToWardrobe={() => setActiveTab('wardrobe')}
              onOpenScanner={() => setIsScannerOpen(true)}
              onRefreshLiveGps={handleLiveGpsSync}
              onSaveSearchQuery={handleSaveSearchQuery}
              onOpenLocation={() => setIsLocationOpen(true)}
            />
          )}

          {activeTab === 'wardrobe' && (
            <WardrobeGridView
              items={items}
              searchHistory={searchHistory}
              onOpenScanner={() => setIsScannerOpen(true)}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onWearItem={handleWearSingleItem}
              onSaveSearchQuery={handleSaveSearchQuery}
              onClearSearchHistory={handleClearSearchHistory}
            />
          )}

          {activeTab === 'mixmatch' && (
            <MixMatchView
              items={items}
              onLogWear={handleLogWear}
              onOpenShareModal={(outfit) => setShareOutfit(outfit)}
              onOpenScanner={() => setIsScannerOpen(true)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              items={items}
              outfitLogs={outfitLogs}
              onOpenScanner={() => setIsScannerOpen(true)}
            />
          )}
        </main>

        {/* Floating iOS Bottom Navigation Dock */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onOpenScanner={() => setIsScannerOpen(true)}
        />
      </div>

      {/* AI Scanner / Add Item Modal */}
      {isScannerOpen && (
        <ScannerModal
          onClose={() => setIsScannerOpen(false)}
          onSaveItem={handleSaveItem}
          existingItems={items}
        />
      )}

      {/* Profile Modal */}
      {isProfileOpen && (
        <ProfileModal
          user={user}
          onClose={() => setIsProfileOpen(false)}
          onUpdateUser={handleUpdateUser}
          onResetData={handleResetData}
          onLogout={handleLogout}
          onOpenAuth={() => setIsAuthOpen(true)}
          onRequestGps={handleLiveGpsSync}
        />
      )}

      {/* Auth Modal (Google & Manual) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Location & Weather Modal */}
      <LocationModal
        isOpen={isLocationOpen}
        currentCity={weather.city}
        onClose={() => setIsLocationOpen(false)}
        onSelectCity={handleSelectCity}
        onDetectGps={handleLiveGpsSync}
      />

      {/* Shareable Story Card Modal */}
      {shareOutfit && (
        <ShareOutfitModal
          outfit={shareOutfit}
          onClose={() => setShareOutfit(null)}
        />
      )}
    </div>
  );
}
