import { LiveWeatherData } from '../types/wardrobe';

export function decodeWmoWeatherCode(code: number): string {
  switch (code) {
    case 0:
      return 'Clear Sky';
    case 1:
      return 'Mainly Clear';
    case 2:
      return 'Partly Cloudy';
    case 3:
      return 'Overcast';
    case 45:
    case 48:
      return 'Fog & Mist';
    case 51:
    case 53:
    case 55:
      return 'Drizzle';
    case 61:
    case 63:
    case 65:
      return 'Rain';
    case 66:
    case 67:
      return 'Freezing Rain';
    case 71:
    case 73:
    case 75:
      return 'Snow Fall';
    case 80:
    case 81:
    case 82:
      return 'Rain Showers';
    case 95:
    case 96:
    case 99:
      return 'Thunderstorm';
    default:
      return 'Mild & Clear';
  }
}

/**
 * Get cached live weather for instant 0ms mobile render
 */
export function getCachedWeather(): LiveWeatherData | null {
  try {
    const raw = sessionStorage.getItem('aura_weather_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data && Date.now() - parsed.timestamp < 15 * 60 * 1000) {
        return parsed.data;
      }
    }
  } catch (e) {}
  return null;
}

function setCachedWeather(data: LiveWeatherData) {
  try {
    sessionStorage.setItem(
      'aura_weather_cache',
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch (e) {}
}

/**
 * Fetch real-time live weather using GPS coordinates
 */
export async function fetchLiveWeatherByCoords(
  lat: number,
  lon: number
): Promise<LiveWeatherData> {
  // 1. Backend proxy handles reverse geocoding & Open-Meteo with caching
  try {
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const weather: LiveWeatherData = {
          temp: data.temp,
          condition: data.condition,
          city: data.city,
          country: data.country || '',
          humidity: data.humidity,
          windSpeed: data.windSpeed,
          isLiveGps: true,
        };
        setCachedWeather(weather);
        return weather;
      }
    }
  } catch (e) {
    console.warn('Backend weather proxy error, falling back to direct Open-Meteo:', e);
  }

  // 2. Direct Open-Meteo fallback
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
  const weatherRes = await fetch(weatherUrl);
  if (!weatherRes.ok) {
    throw new Error('Failed to fetch live weather data');
  }
  const weatherJson = await weatherRes.json();
  const current = weatherJson.current;
  const temp = Math.round(current.temperature_2m);
  const condition = decodeWmoWeatherCode(current.weather_code);

  let city = 'Current Location';
  try {
    const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const geoRes = await fetch(geoUrl);
    if (geoRes.ok) {
      const geoJson = await geoRes.json();
      city = geoJson.city || geoJson.locality || geoJson.principalSubdivision || 'My Location';
    }
  } catch (geoErr) {}

  const result: LiveWeatherData = {
    temp,
    condition,
    city,
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
    isLiveGps: true,
  };
  setCachedWeather(result);
  return result;
}

/**
 * Fetch live weather by city name query
 */
export async function fetchLiveWeatherByCity(
  cityName: string
): Promise<LiveWeatherData> {
  try {
    const res = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const weather: LiveWeatherData = {
          temp: data.temp,
          condition: data.condition,
          city: data.city,
          country: data.country || '',
          humidity: data.humidity,
          windSpeed: data.windSpeed,
          isLiveGps: false,
        };
        setCachedWeather(weather);
        return weather;
      }
    }
  } catch (e) {
    console.warn('Backend weather by city error:', e);
  }

  // Direct Open-Meteo geocoding fallback
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    cityName
  )}&count=1&language=en&format=json`;
  const geoRes = await fetch(geoUrl);
  const geoJson = await geoRes.json();
  if (!geoJson.results || geoJson.results.length === 0) {
    throw new Error(`City "${cityName}" not found`);
  }

  const { latitude, longitude, name, country_code } = geoJson.results[0];
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
  const weatherRes = await fetch(weatherUrl);
  const weatherJson = await weatherRes.json();
  const current = weatherJson.current;

  const result: LiveWeatherData = {
    temp: Math.round(current.temperature_2m),
    condition: decodeWmoWeatherCode(current.weather_code),
    city: name,
    country: country_code || '',
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
    isLiveGps: false,
  };
  setCachedWeather(result);
  return result;
}

/**
 * High-speed Resilient Location Engine:
 * 1. Checks GPS via navigator.geolocation with quick low-power network positioning.
 * 2. If denied or times out, immediately auto-detects user's real location via IP Geolocation.
 * 3. Never freezes or blocks the mobile UI.
 */
export function requestGpsLiveWeather(): Promise<LiveWeatherData> {
  return new Promise((resolve) => {
    let resolved = false;

    const fallbackToIp = async () => {
      if (resolved) return;
      resolved = true;
      try {
        // Fast backend proxy (uses x-forwarded-for client IP on server)
        const proxyRes = await fetch('/api/weather');
        if (proxyRes.ok) {
          const data = await proxyRes.json();
          if (data.success) {
            const weather: LiveWeatherData = {
              temp: data.temp,
              condition: data.condition,
              city: data.city,
              country: data.country || '',
              humidity: data.humidity,
              windSpeed: data.windSpeed,
              isLiveGps: true,
            };
            setCachedWeather(weather);
            resolve(weather);
            return;
          }
        }
      } catch (err) {
        console.warn('Backend IP fallback error:', err);
      }

      try {
        // Direct browser IP geolocation fallback
        const ipRes = await fetch('https://ipwho.is/');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.success && ipData.latitude && ipData.longitude) {
            const weather = await fetchLiveWeatherByCoords(
              ipData.latitude,
              ipData.longitude
            );
            const enriched = {
              ...weather,
              city: ipData.city || ipData.region || weather.city,
            };
            setCachedWeather(enriched);
            resolve(enriched);
            return;
          }
        }
      } catch (err) {
        console.warn('Direct IP fallback error:', err);
      }

      // Safe default if everything is restricted
      resolve({
        temp: 22,
        condition: 'Mild & Clear',
        city: 'Current Location',
        isLiveGps: false,
      });
    };

    if (!navigator.geolocation) {
      fallbackToIp();
      return;
    }

    // Set 2.5 second timeout for mobile to avoid waiting on slow GPS chips
    const timer = setTimeout(() => {
      fallbackToIp();
    }, 2500);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (resolved) return;
        clearTimeout(timer);
        resolved = true;
        try {
          const weather = await fetchLiveWeatherByCoords(
            pos.coords.latitude,
            pos.coords.longitude
          );
          resolve(weather);
        } catch (err) {
          fallbackToIp();
        }
      },
      () => {
        clearTimeout(timer);
        fallbackToIp();
      },
      { enableHighAccuracy: false, timeout: 2500, maximumAge: 600000 }
    );
  });
}
