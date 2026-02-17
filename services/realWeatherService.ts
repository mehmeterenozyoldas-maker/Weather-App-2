import { WeatherData } from "../types";

export async function fetchStockholmWeather(): Promise<{ prompt: string; data: WeatherData }> {
  try {
    // Fetching from Open-Meteo (Free, no API key required for non-commercial use)
    // Coordinates for Stockholm, Sweden
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=59.3293&longitude=18.0686&current=temperature_2m,is_day,weather_code,cloud_cover,wind_speed_10m&timezone=auto"
    );
    
    if (!res.ok) throw new Error("Weather API failed");
    
    const data = await res.json();
    const current = data.current;

    const weatherCode = current.weather_code;
    const isDay = current.is_day === 1;
    const temp = current.temperature_2m;
    const clouds = current.cloud_cover;
    const wind = current.wind_speed_10m;
    
    // WMO Weather interpretation codes
    const descriptions: Record<number, string> = {
      0: "Clear sky",
      1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
      45: "Foggy", 48: "Depositing rime fog",
      51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
      56: "Light freezing drizzle", 57: "Dense freezing drizzle",
      61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
      66: "Light freezing rain", 67: "Heavy freezing rain",
      71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
      77: "Snow grains",
      80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
      85: "Slight snow showers", 86: "Heavy snow showers",
      95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
    };

    const condition = descriptions[weatherCode] || "Cloudy";
    const timeOfDay = isDay ? "Daytime" : "Nighttime";

    const prompt = `Current real-time weather in Stockholm, Sweden: ${condition}. 
    It is currently ${timeOfDay}. 
    Temperature: ${temp}°C. 
    Cloud Coverage: ${clouds}%. 
    Wind Speed: ${wind} km/h.
    Create a photorealistic, cinematic atmosphere matching these exact conditions.`;

    const weatherData: WeatherData = {
        location: "Stockholm, SE",
        temperature: temp,
        condition: condition,
        windSpeed: wind,
        isDay: isDay,
        cloudCover: clouds
    };
    
    return { prompt, data: weatherData };
    
  } catch (e) {
    console.error("Weather fetch failed", e);
    // Return fallback data so the app doesn't crash
    return { 
        prompt: "Stockholm Sweden cinematic winter atmosphere, cold, moody lighting",
        data: {
            location: "Stockholm (Offline)",
            temperature: 0,
            condition: "Unknown",
            windSpeed: 0,
            isDay: true,
            cloudCover: 50
        }
    };
  }
}
