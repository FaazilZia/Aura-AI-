
import { GoogleGenAI, Type, Modality } from "@google/genai";

// AI helper functions using @google/genai SDK

// Function to get text responses from Aura AI
export const getGeminiResponse = async (history: {role: string, parts: {text: string}[]}[], prompt: string) => {
  // Always initialize GoogleGenAI with a named parameter using process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      ...history,
      { role: 'user', parts: [{ text: prompt }] }
    ],
    config: {
      systemInstruction: "You are Aura, a sophisticated AI companion. Be helpful, empathetic, and witty. Maintain context of previous messages.",
    }
  });
  // Use .text property to access the generated content string
  return response.text || "I'm sorry, I couldn't process that.";
};

// Function to analyze video frames and return emotional insights in JSON format
export const analyzeVideoFrame = async (base64Image: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image,
    },
  };
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        imagePart,
        { text: "Analyze this video frame. Provide: 1. Perceived emotion 2. Lighting quality (poor/good/excellent) 3. Framing suggestions. Return only valid JSON." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          emotion: { type: Type.STRING },
          lighting: { type: Type.STRING },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["emotion", "lighting", "suggestions"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

// Function to analyze audio snippets for vocal tone and emotional state
export const analyzeAudioTone = async (base64Audio: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const audioPart = {
    inlineData: {
      mimeType: 'audio/wav',
      data: base64Audio,
    },
  };
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        audioPart,
        { text: "Analyze the vocal tone and emotional state in this audio. Provide: 1. Vocal emotion (e.g. Calm, Excited, Tired) 2. Energy level (Low/Medium/High) 3. One brief social tip. Return only valid JSON." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vocalEmotion: { type: Type.STRING },
          energy: { type: Type.STRING },
          tip: { type: Type.STRING }
        },
        required: ["vocalEmotion", "energy", "tip"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

// Function to generate high-quality avatars using gemini-2.5-flash-image
export const generateAvatar = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `High quality character avatar, digital art style: ${prompt}` }]
    },
    config: {
      imageConfig: { aspectRatio: "1:1" }
    }
  });

  // Iterate through parts to find the inline image data as required for nano banana series models
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

// Establishes a real-time voice connection using Gemini Live API
export const connectVoiceSession = (callbacks: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: 'You are a warm, empathetic voice companion named Aura. Your goal is to provide emotional support and interesting conversation to help users feel less lonely.',
    },
  });
};
