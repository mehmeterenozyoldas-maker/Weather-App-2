import React, { useState, useEffect, useCallback } from 'react';
import { CloudScene } from './components/CloudScene';
import { UIControls } from './components/UIControls';
import { WeatherConfig, DEFAULT_WEATHER, TextTransform, WeatherData } from './types';
import { generateWeatherConfig } from './services/geminiService';
import { fetchStockholmWeather } from './services/realWeatherService';

const App: React.FC = () => {
  const [text, setText] = useState<string>('SWEDEN'); // Default text
  const [weather, setWeather] = useState<WeatherConfig>(DEFAULT_WEATHER);
  const [isGenerating, setIsGenerating] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  
  const [textTransform, setTextTransform] = useState<TextTransform>({
    scale: 1.5,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    depth: 0.8
  });

  const handleTextChange = (newText: string) => {
    setText(newText.toUpperCase());
  };

  const handleGenerateVibe = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    // Clear live weather data when manually generating a new vibe
    setWeatherData(null); 
    try {
      const newConfig = await generateWeatherConfig(prompt);
      setWeather(prev => ({
        ...prev,
        ...newConfig,
        cloudSeed: Math.random() * 100 
      }));
    } catch (err) {
      console.error("Error generating vibe:", err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleLiveWeather = useCallback(async () => {
      setIsGenerating(true);
      setText("SWEDEN");
      try {
          const { prompt, data } = await fetchStockholmWeather();
          setWeatherData(data); // Store the actual data for display
          
          // Use the prompt to generate the visual scene
          const newConfig = await generateWeatherConfig(prompt);
          setWeather(prev => ({
            ...prev,
            ...newConfig,
            cloudSeed: Math.random() * 100 
          }));
      } catch (err) {
          console.error("Error in live weather flow:", err);
      } finally {
          setIsGenerating(false);
      }
  }, [handleGenerateVibe]);

  // Auto-load Sweden weather on mount
  useEffect(() => {
    handleLiveWeather();
  }, [handleLiveWeather]);

  return (
    <div className="relative w-full h-full bg-black">
      <CloudScene text={text} weather={weather} textTransform={textTransform} />
      <UIControls 
        text={text} 
        onTextChange={handleTextChange} 
        onGenerateVibe={handleGenerateVibe}
        onLiveWeather={handleLiveWeather}
        isGenerating={isGenerating}
        textTransform={textTransform}
        onTransformChange={setTextTransform}
        weatherData={weatherData}
      />
    </div>
  );
};

export default App;
