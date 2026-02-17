export interface WeatherConfig {
  sunPosition: [number, number, number];
  skyColor: string; // Hex
  cloudColor: string; // Hex
  cloudSeed: number;
  turbidity: number;
  rayleigh: number;
  mieCoefficient: number;
  mieDirectionalG: number;
  fogColor: string;
  // Cinematic additions
  exposure: number;
  bloomStrength: number;
  bloomThreshold: number;
  ambientIntensity: number;
}

export interface TextTransform {
  scale: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  depth: number;
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  windSpeed: number;
  isDay: boolean;
  cloudCover: number;
}

export interface AppState {
  text: string;
  weather: WeatherConfig;
  textTransform: TextTransform;
  isLoading: boolean;
  weatherData: WeatherData | null;
}

// Default weather preset: Cinematic Clear
export const DEFAULT_WEATHER: WeatherConfig = {
  sunPosition: [100, 40, 60],
  skyColor: "#4ca6ff",
  cloudColor: "#e6f4ff",
  cloudSeed: 1,
  turbidity: 0.8,
  rayleigh: 0.6,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.7,
  fogColor: "#aaccff",
  exposure: 0.5,
  bloomStrength: 0.4,
  bloomThreshold: 0.6,
  ambientIntensity: 0.4
};
