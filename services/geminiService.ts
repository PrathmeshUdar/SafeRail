
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface SafetyAnalysisResponse {
  assessment: string;
  hazardProbability: number;
  recommendations: string[];
  detectedObjects: string[];
}

export const analyzeSafetyFrame = async (base64Image: string): Promise<SafetyAnalysisResponse | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
            { text: "Analyze this railway track camera feed. Detect any intrusions (humans, animals, objects), check for track visible faults, and estimate visibility/fog levels. Provide a JSON response." }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assessment: { type: Type.STRING, description: "Overall safety summary" },
            hazardProbability: { type: Type.NUMBER, description: "Likelihood of an incident 0-100" },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            detectedObjects: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["assessment", "hazardProbability", "recommendations", "detectedObjects"]
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as SafetyAnalysisResponse;
    }
    return null;
  } catch (error) {
    console.error("Safety analysis failed:", error);
    return null;
  }
};

export const getSmartAlertMessage = async (stats: any): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Current Rail Status: Fog ${stats.fogLevel}%, Health ${stats.trackHealth}%, Speed ${stats.speed}km/h. Generate a concise safety directive for the pilot.`
        });
        return response.text || "Continue operations with standard caution.";
    } catch (error) {
        return "System monitoring active.";
    }
}
