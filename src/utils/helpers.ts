import confetti from 'canvas-confetti';
import { WardrobeItem, WardrobeAnalytics } from '../types/wardrobe';

export function triggerConfetti() {
  try {
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#d4f84d', '#9fd42c', '#3E4347', '#E2DBD0', '#F6F2E9'],
    });
  } catch (e) {
    // Ignore in environments without canvas
  }
}

export function calculateAnalytics(items: WardrobeItem[]): WardrobeAnalytics {
  const totalItems = items.length;
  const availableItems = items.filter((i) => i.isAvailable);
  const totalValue = items.reduce((sum, item) => sum + (item.pricePaid || 0), 0);
  const totalWears = items.reduce((sum, item) => sum + (item.timesWorn || 0), 0);

  const averageCostPerWear =
    totalWears > 0 ? Number((totalValue / totalWears).toFixed(2)) : totalValue;

  // Approximate potential combinations = tops * bottoms * shoes
  const tops = availableItems.filter((i) =>
    ['Shirt', 'T-shirt', 'Sweater', 'Blazer', 'Hoodie'].includes(i.category)
  ).length;
  const bottoms = availableItems.filter((i) =>
    ['Trousers', 'Jeans', 'Skirt'].includes(i.category)
  ).length;
  const shoes = Math.max(
    1,
    availableItems.filter((i) => i.category === 'Footwear').length
  );
  const dresses = availableItems.filter((i) =>
    ['Dress', 'Saree', 'Kurta'].includes(i.category)
  ).length;

  const totalCombinations = Math.max(12, tops * bottoms * shoes + dresses * shoes);

  // Rewear score (0 to 100): rewarded for high average wears per piece
  const avgWearsPerPiece = totalItems > 0 ? totalWears / totalItems : 0;
  const unwornCount = items.filter((i) => i.timesWorn === 0).length;
  const unwornPenalty = totalItems > 0 ? (unwornCount / totalItems) * 40 : 0;
  const rewearScore = Math.min(
    100,
    Math.max(20, Math.round(avgWearsPerPiece * 3.5 + 40 - unwornPenalty))
  );

  // Category counts
  const catMap: Record<string, number> = {};
  items.forEach((item) => {
    catMap[item.category] = (catMap[item.category] || 0) + 1;
  });
  const categoryCounts = Object.entries(catMap)
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / Math.max(1, totalItems)) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Color palette distribution
  const colorMap: Record<string, { hex: string; count: number }> = {};
  items.forEach((item) => {
    const name = item.primaryColor?.name || 'Neutral';
    const hex = item.primaryColor?.hex || '#888888';
    if (!colorMap[name]) {
      colorMap[name] = { hex, count: 0 };
    }
    colorMap[name].count += 1;
  });
  const colorPalette = Object.entries(colorMap)
    .map(([name, val]) => ({
      name,
      hex: val.hex,
      count: val.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Most worn items
  const mostWorn = [...items].sort((a, b) => b.timesWorn - a.timesWorn).slice(0, 4);

  // Unworn items
  const unwornItems = items.filter((i) => i.timesWorn === 0);

  // Top value items (lowest cost per wear among items worn at least 5 times)
  const topValueItems = [...items]
    .filter((i) => i.timesWorn > 0)
    .sort((a, b) => a.pricePaid / a.timesWorn - b.pricePaid / b.timesWorn)
    .slice(0, 4);

  // Wardrobe gaps
  const wardrobeGaps: WardrobeAnalytics['wardrobeGaps'] = [];
  if (items.filter((i) => i.category === 'Footwear').length < 2) {
    wardrobeGaps.push({
      title: 'Foundational Footwear Gap',
      reason:
        'You have limited footwear options. Adding a versatile white leather sneaker or neutral loafer unlocks multiple daily combinations.',
      suggestedCategory: 'Footwear',
      suggestedColor: 'Chalk White or Taupe',
    });
  }
  if (!items.some((i) => i.category === 'Blazer' || i.category === 'Jacket')) {
    wardrobeGaps.push({
      title: 'Architectural Layering Piece',
      reason:
        'No structured jacket or blazer detected. A relaxed tailoring piece effortlessly elevates basic denim and tees.',
      suggestedCategory: 'Blazer',
      suggestedColor: 'Sand Beige or Sage',
    });
  }
  if (items.filter((i) => i.occasionTags.includes('Formal')).length < 2) {
    wardrobeGaps.push({
      title: 'Evening & Formal Statement',
      reason:
        'Underprepared for formal events or celebratory dinners. A bias-cut slip dress or pleated evening trouser ensures event readiness.',
      suggestedCategory: 'Dress',
      suggestedColor: 'Champagne or Onyx',
    });
  }

  return {
    totalItems,
    totalCombinations,
    totalValue,
    averageCostPerWear,
    rewearScore,
    categoryCounts,
    colorPalette,
    mostWorn,
    unwornItems,
    topValueItems,
    wardrobeGaps,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 1,
  }).format(amount);
}

export function getCostPerWear(price: number, wears: number): number {
  if (!wears || wears <= 0) return price;
  return Number((price / wears).toFixed(2));
}

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  Shirt: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
  'T-shirt': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
  Trousers: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80',
  Jeans: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
  Jacket: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
  Blazer: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80',
  Dress: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
  Skirt: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80',
  Sweater: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=80',
  Hoodie: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
  Footwear: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
  Bag: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
  Accessory: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
  Kurta: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
  Saree: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
};

export function getCategoryFallbackImage(category?: string): string {
  if (category && CATEGORY_FALLBACK_IMAGES[category]) {
    return CATEGORY_FALLBACK_IMAGES[category];
  }
  return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80';
}

