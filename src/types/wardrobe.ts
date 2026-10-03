export type Category =
  | 'Shirt'
  | 'T-shirt'
  | 'Trousers'
  | 'Jeans'
  | 'Jacket'
  | 'Dress'
  | 'Skirt'
  | 'Sweater'
  | 'Hoodie'
  | 'Kurta'
  | 'Saree'
  | 'Blazer'
  | 'Footwear'
  | 'Accessory'
  | 'Bag';

export type Occasion =
  | 'Casual'
  | 'Formal'
  | 'Party'
  | 'Work/Office'
  | 'Ethnic'
  | 'Sportswear'
  | 'Loungewear'
  | 'Date Night'
  | 'Travel';

export type Season = 'Summer' | 'Winter' | 'Monsoon' | 'Spring' | 'Fall' | 'All-season';

export interface WardrobeItem {
  id: string;
  userId: string;
  name: string;
  imageUrl: string;
  category: Category;
  fitStyle: string;
  fabric: string;
  texture: string;
  primaryColor: {
    name: string;
    hex: string;
  };
  secondaryColor?: {
    name: string;
    hex: string;
  };
  pattern: string;
  occasionTags: Occasion[];
  seasonTags: Season[];
  sleeveLength?: string;
  pricePaid: number;
  timesWorn: number;
  lastWornDate?: string; // ISO date string
  isAvailable: boolean; // false if in laundry / unavailable
  confidenceScore: number; // 0 to 100
  stylingNotes?: string;
  userEdited: boolean;
  createdAt: string;
  aiRawResponse?: any;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  gender: 'women' | 'men' | 'unisex' | 'all';
  city: string;
  avatarUrl?: string;
  provider?: 'manual' | 'google';
  createdAt: string;
}

export interface SearchHistoryItem {
  id: string;
  userId: string;
  query: string;
  type: 'stylist' | 'wardrobe';
  timestamp: string;
}

export interface LiveWeatherData {
  temp: number;
  condition: string;
  city: string;
  country?: string;
  humidity?: number;
  windSpeed?: number;
  isLiveGps?: boolean;
}

export interface OutfitRecommendation {
  id: string;
  title: string;
  vibe: string;
  occasion: string;
  compatibilityScore: number;
  reasoning: string;
  stylingTips: string[];
  items: WardrobeItem[];
  colorHarmony: string;
  weatherSuitability: string;
  liked?: boolean;
}

export interface OutfitLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  itemIds: string[];
  occasion: string;
  notes?: string;
  rating?: number; // 1-5
  createdAt: string;
}

export interface PackingListPlan {
  id: string;
  destination: string;
  durationDays: number;
  vibe: string;
  weatherSummary: string;
  items: WardrobeItem[];
  checklist: {
    category: string;
    itemNames: string[];
  }[];
  packingTips: string[];
  wardrobeGaps?: string[];
  createdAt: string;
}

export interface WardrobeAnalytics {
  totalItems: number;
  totalCombinations: number;
  totalValue: number;
  averageCostPerWear: number;
  rewearScore: number; // 0-100
  categoryCounts: { category: string; count: number; percentage: number }[];
  colorPalette: { name: string; hex: string; count: number }[];
  mostWorn: WardrobeItem[];
  unwornItems: WardrobeItem[];
  topValueItems: WardrobeItem[]; // lowest cost per wear
  wardrobeGaps: {
    title: string;
    reason: string;
    suggestedColor: string;
    suggestedCategory: Category;
  }[];
}
