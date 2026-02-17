import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, Download, Eye, EyeOff, Wind, Sliders, MapPin, CloudRain, Video, Circle, Square } from 'lucide-react';
import { TextTransform, WeatherData } from '../types';

interface UIControlsProps {
  text: string;
  onTextChange: (text: string) => void;
  onGenerateVibe: (prompt: string) => void;
  onLiveWeather: () => void;
  isGenerating: boolean;
  textTransform: TextTransform;
  onTransformChange: (t: TextTransform) => void;
  weatherData: WeatherData | null;
}

export const UIControls: React.FC<UIControlsProps> = ({ 
    text, onTextChange, onGenerateVibe, onLiveWeather, isGenerating, textTransform, onTransformChange, weatherData
}) => {
  const [prompt, setPrompt] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const handleVibeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerateVibe(prompt);
      setPrompt('');
    }
  };
  
  const handleScreenshot = () => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
          const link = document.createElement('a');
          link.download = `cloudgen-${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
      }
  };

  const startRecording = async () => {
    let stream: MediaStream | null = null;
    let isFallback = false;

    try {
        // Attempt Screen Capture (includes UI)
        stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                displaySurface: "browser",
                frameRate: 60,
            },
            audio: false,
            // @ts-ignore - Experimental hint for Chrome to prefer current tab
            preferCurrentTab: true
        });
    } catch (err) {
        console.warn("Screen capture failed, attempting fallback to canvas.", err);
        
        // Fallback: Canvas Capture (Scene only, no UI)
        const canvas = document.querySelector('canvas');
        if (canvas) {
            stream = canvas.captureStream(60);
            isFallback = true;
            alert("Screen recording permission denied. Recording 3D scene only (no UI).");
        }
    }

    if (!stream) {
        alert("Recording failed. Please ensure permissions are granted.");
        return;
    }

    streamRef.current = stream;

    try {
        // Prefer VP9 for high quality, fallback to standard webm
        const mimeTypes = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm'
        ];
        const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';

        const recorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 25000000 // 25 Mbps for high quality
        });

        chunksRef.current = [];
        
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunksRef.current.push(event.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = isFallback ? `cloudgen-scene-${Date.now()}.webm` : `cloudgen-screen-${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            
            // Cleanup stream tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            setIsRecording(false);
        };
        
        // Handle if user stops recording via browser UI (only for screen capture)
        if (!isFallback) {
             stream.getVideoTracks()[0].onended = () => {
                 if (recorder.state !== 'inactive') {
                    recorder.stop();
                 }
            };
        }

        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
    } catch (err) {
        console.error("MediaRecorder setup failed", err);
        alert("Recording failed to start.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        // State update happens in onstop callback
    }
  };

  const handleToggleRecord = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  };

  const updateTransform = (key: keyof TextTransform, value: number) => {
      onTransformChange({
          ...textTransform,
          [key]: value
      });
  };

  if (!isVisible) {
      return (
          <button 
            onClick={() => setIsVisible(true)}
            className="absolute bottom-6 right-6 z-20 p-3 glass-panel rounded-full text-white/50 hover:text-white transition-all hover:scale-110"
          >
              <Eye size={20} />
          </button>
      );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10 font-['Space_Grotesk']">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col gap-4">
            <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 w-fit bg-black/40 border-white/10">
                <Wind className="w-4 h-4 text-blue-400" />
                <span className="text-white text-sm font-bold tracking-wider">CLOUDGEN 2026</span>
            </div>

            {/* Weather Widget (Only shows when data is available) */}
            {weatherData && (
                <div className="glass-panel p-5 rounded-2xl text-white animate-in slide-in-from-left-5 fade-in duration-500 w-fit backdrop-blur-xl bg-black/40 border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-2 mb-3 text-blue-300">
                        <MapPin size={16} />
                        <span className="text-sm font-bold tracking-widest uppercase">{weatherData.location}</span>
                    </div>
                    <div className="flex items-end gap-4 mb-4">
                         <span className="text-5xl font-light tracking-tighter">{Math.round(weatherData.temperature)}°</span>
                         <div className="flex flex-col pb-1.5">
                             <span className="text-sm text-white font-bold leading-none mb-1">{weatherData.condition}</span>
                             <span className="text-[11px] text-white/50 font-medium uppercase">{weatherData.isDay ? 'Daytime' : 'Nighttime'}</span>
                         </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs text-white/70">
                        <div className="flex items-center gap-2">
                            <Wind size={14} className="text-white/40" />
                            <span>{weatherData.windSpeed} km/h</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CloudRain size={14} className="text-white/40" />
                            <span>{weatherData.cloudCover}% Clouds</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
        
        <div className="flex gap-2">
            {/* Recording Button */}
            <button 
                onClick={handleToggleRecord}
                className={`glass-panel p-2 rounded-full transition-all duration-300 flex items-center gap-2 ${
                    isRecording 
                    ? 'text-red-500 bg-red-500/10 border-red-500/50 pr-4' 
                    : 'text-white/70 hover:text-white'
                }`}
                title={isRecording ? "Stop Recording" : "Record Screen"}
             >
                {isRecording ? (
                    <>
                        <Square size={18} fill="currentColor" />
                        <span className="text-xs font-bold animate-pulse">REC</span>
                    </>
                ) : (
                    <Video size={18} />
                )}
            </button>

             <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`glass-panel p-2 rounded-full transition-colors ${showSettings ? 'text-white bg-white/10' : 'text-white/70 hover:text-white'}`}
                title="Transform Settings"
             >
                <Sliders size={18} />
            </button>
             <button 
                onClick={handleScreenshot}
                className="glass-panel p-2 rounded-full text-white/70 hover:text-white transition-colors"
                title="Save Screenshot"
             >
                <Download size={18} />
            </button>
            <button 
                onClick={() => setIsVisible(false)}
                className="glass-panel p-2 rounded-full text-white/70 hover:text-white transition-colors"
                title="Hide UI"
            >
                <EyeOff size={18} />
            </button>
        </div>
      </div>

      {/* Settings Panel (Top Right) */}
      {showSettings && (
          <div className="absolute top-20 right-6 w-64 glass-panel rounded-xl p-4 pointer-events-auto animate-in slide-in-from-right-5 fade-in duration-200 bg-black/60 border-white/10">
              <h3 className="text-white text-xs font-bold mb-4 uppercase tracking-wider text-white/50">Object Properties</h3>
              
              <div className="space-y-4">
                  <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-white/70">
                          <span>SCALE</span>
                          <span>{textTransform.scale.toFixed(1)}x</span>
                      </div>
                      <input 
                        type="range" min="0.5" max="3" step="0.1"
                        value={textTransform.scale}
                        onChange={(e) => updateTransform('scale', parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                      />
                  </div>

                  <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-white/70">
                          <span>DEPTH</span>
                          <span>{textTransform.depth.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="2" step="0.1"
                        value={textTransform.depth}
                        onChange={(e) => updateTransform('depth', parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                      />
                  </div>

                  <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-white/70">
                          <span>ROTATE Y</span>
                          <span>{Math.round(textTransform.rotationY * (180/Math.PI))}°</span>
                      </div>
                      <input 
                        type="range" min={-Math.PI} max={Math.PI} step="0.1"
                        value={textTransform.rotationY}
                        onChange={(e) => updateTransform('rotationY', parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                      />
                  </div>
                  
                  <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-white/70">
                          <span>ROTATE X</span>
                          <span>{Math.round(textTransform.rotationX * (180/Math.PI))}°</span>
                      </div>
                      <input 
                        type="range" min={-Math.PI / 2} max={Math.PI / 2} step="0.1"
                        value={textTransform.rotationX}
                        onChange={(e) => updateTransform('rotationX', parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                      />
                  </div>
              </div>
          </div>
      )}

      {/* Main Interactive Area - Bottom Center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 flex flex-col gap-4 pointer-events-auto transition-all duration-500">
        
        {/* Text Input - Minimalist */}
        <div className="relative group text-center">
            <input
                type="text"
                value={text}
                onChange={(e) => onTextChange(e.target.value.slice(0, 10))}
                className="w-full bg-transparent text-center text-4xl md:text-5xl font-bold text-white/90 placeholder-white/20 focus:outline-none drop-shadow-lg tracking-widest uppercase font-['Inter']"
                placeholder="TYPE HERE"
                spellCheck={false}
            />
            <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-white/40 to-transparent mt-2 group-focus-within:w-48 transition-all duration-500" />
        </div>

        {/* Control Panel */}
        <div className="glass-panel rounded-2xl p-2 mt-4 shadow-2xl shadow-black/50 bg-black/40 border-white/10">
            <form onSubmit={handleVibeSubmit} className="relative flex items-center">
                <div className="pl-3 pr-2 text-purple-400">
                     {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                </div>
                <input 
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                    placeholder="Describe the atmosphere..."
                    className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-white/30 py-3"
                />
                <button 
                    type="submit" 
                    disabled={!prompt.trim() || isGenerating}
                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-white/10"
                >
                    GENERATE
                </button>
            </form>
            
            {/* Quick Chips */}
            <div className="flex gap-2 overflow-x-auto p-2 pb-1 scrollbar-hide items-center">
                 <button
                    onClick={onLiveWeather}
                    className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-[10px] text-blue-200 hover:text-white border border-blue-500/30 transition-all uppercase tracking-wide font-bold"
                >
                    <MapPin size={10} />
                    Live Stockholm
                </button>

                {['Cyberpunk Neon', 'Golden Hour', 'Deep Space', 'Arctic Storm'].map((preset) => (
                    <button
                        key={preset}
                        onClick={() => onGenerateVibe(preset)}
                        className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-black/20 hover:bg-white/10 text-[10px] text-white/70 hover:text-white border border-white/5 transition-all uppercase tracking-wide"
                    >
                        {preset}
                    </button>
                ))}
            </div>
        </div>
      </div>
      
      {/* Branding / Credit */}
      <div className="absolute bottom-6 right-6 text-[10px] text-white/20 pointer-events-auto hover:text-white/60 transition-colors">
          POWERED BY GEMINI 3 FLASH
      </div>

    </div>
  );
};