import { GoogleGenAI, Type } from "@google/genai";
import { WeatherConfig, DEFAULT_WEATHER } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateWeatherConfig(prompt: string): Promise<Partial<WeatherConfig>> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a photorealistic and cinematic weather/lighting configuration for a 3D cloud scene based on this vibe: "${prompt}".
      
      Return a JSON object.
      
      Visual Guidelines:
      - sunPosition: [x, y, z]. High Y for noon, low Y for sunset.
      - skyColor/cloudColor/fogColor: Hex codes matching the mood (e.g., orange/purple for sunset, grey for storm).
      - exposure: Camera exposure (0.1 to 2.0).
      - bloomStrength: Intensity of the glow/bloom effect (0.0 to 1.5). High for dreamy/sci-fi.
      - bloomThreshold: Brightness threshold for bloom (0.0 to 1.0).
      - ambientIntensity: Base light level (0.1 to 1.0).
      
      Physics Parameters (Sky shader):
      - turbidity: Air thickness (0-10).
      - rayleigh: Light scattering (0-4).
      - mieCoefficient: Haze (0-0.1).
      - mieDirectionalG: Sun glare focus (0-0.99).
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sunPosition: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            skyColor: { type: Type.STRING },
            cloudColor: { type: Type.STRING },
            fogColor: { type: Type.STRING },
            turbidity: { type: Type.NUMBER },
            rayleigh: { type: Type.NUMBER },
            mieCoefficient: { type: Type.NUMBER },
            mieDirectionalG: { type: Type.NUMBER },
            exposure: { type: Type.NUMBER },
            bloomStrength: { type: Type.NUMBER },
            bloomThreshold: { type: Type.NUMBER },
            ambientIntensity: { type: Type.NUMBER },
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) return DEFAULT_WEATHER;
    
    const data = JSON.parse(jsonText);
    return {
      ...DEFAULT_WEATHER,
      ...data
    };
  } catch (error) {
    console.error("Failed to generate weather config:", error);
    return DEFAULT_WEATHER;
  }
}

export async function generateCreativeText(context: string): Promise<string> {
   try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Propose a single short word, year, or short phrase (max 6 chars) that fits this vibe: "${context}". Return ONLY the text string.`,
    });
    return response.text?.trim().slice(0, 6) || "2026";
   } catch (error) {
     return "2026";
   }
}
