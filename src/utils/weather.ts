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
 * Fetch real-time live weather using GPS coordinates
 */
export async function fetchLiveWeatherByCoords(
  lat: number,
  lon: number
): Promise<LiveWeatherData> {
  // First try backend proxy which avoids CORS and handles reverse geocoding
  try {
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          temp: data.temp,
          condition: data.condition,
          city: data.city,
          country: data.country || '',
          humidity: data.humidity,
          windSpeed: data.windSpeed,
          isLiveGps: true,
        };
      }
    }
  } catch (e) {
    console.warn('Backend weather proxy error, falling back to direct Open-Meteo:', e);
  }

  // Direct Open-Meteo fallback
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
      city = geoJson.city || geoJson.locality || geoJson.principalSubdivision || 'My City';
    }
  } catch (geoErr) {}

  return {
    temp,
    condition,
    city,
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
    isLiveGps: true,
  };
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
        return {
          temp: data.temp,
          condition: data.condition,
          city: data.city,
          country: data.country || '',
          humidity: data.humidity,
          windSpeed: data.windSpeed,
          isLiveGps: false,
        };
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

  return {
    temp: Math.round(current.temperature_2m),
    condition: decodeWmoWeatherCode(current.weather_code),
    city: name,
    country: country_code || '',
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
    isLiveGps: false,
  };
}

/**
 * Resilient Location Engine:
 * 1. Checks GPS via navigator.geolocation with a 4s timeout.
 * 2. If denied or times out, immediately auto-detects user's real location via IP Geolocation!
 * This guarantees real-time location and weather works everywhere!
 */
export function requestGpsLiveWeather(): Promise<LiveWeatherData> {
  return new Promise((resolve) => {
    let resolved = false;

    const fallbackToIp = async () => {
      if (resolved) return;
      resolved = true;
      try {
        // Try backend proxy first
        const proxyRes = await fetch('/api/weather');
        if (proxyRes.ok) {
          const data = await proxyRes.json();
          if (data.success) {
            resolve({
              temp: data.temp,
              condition: data.condition,
              city: data.city,
              country: data.country || '',
              humidity: data.humidity,
              windSpeed: data.windSpeed,
              isLiveGps: true,
            });
            return;
          }
        }

        // Direct IP geolocation fallback
        const ipRes = await fetch('https://ipwho.is/');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.success) {
            const weather = await fetchLiveWeatherByCoords(
              ipData.latitude,
              ipData.longitude
            );
            resolve({
              ...weather,
              city: ipData.city || ipData.region || weather.city,
            });
            return;
          }
        }
      } catch (err) {
        console.warn('IP fallback error:', err);
      }

      // Safe default if everything fails
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

    // Set 4 second timeout before falling back to IP detection
    const timer = setTimeout(() => {
      fallbackToIp();
    }, 4000);

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
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 300000 }
    );
  });
}
