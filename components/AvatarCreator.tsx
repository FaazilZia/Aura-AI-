
import React, { useState } from 'react';
import { generateAvatar } from '../geminiService';
import { Sparkles, Palette, Download, Wand2, RefreshCcw } from 'lucide-react';

const STYLES = [
  { id: '3d-render', name: '3D Render', icon: '💎' },
  { id: 'anime', name: 'Anime', icon: '🌸' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌃' },
  { id: 'realistic', name: 'Realistic', icon: '📸' },
  { id: 'abstract', name: 'Vector', icon: '🎨' },
];

const AvatarCreator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    try {
      const fullPrompt = `A high-quality avatar for ${prompt} in ${selectedStyle.name} style. Centered portrait, clean background, sharp focus.`;
      const result = await generateAvatar(fullPrompt);
      setGeneratedUrl(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-[#000] flex flex-col p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4 tracking-tighter bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            AI AVATAR LAB
          </h1>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            Design your digital twin. Use natural language to describe your identity and let our neural engines manifest it.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Controls */}
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Digital DNA Prompt</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe yourself... e.g., 'A confident explorer with glowing tattoos and neon visor'"
                className="w-full h-32 bg-[#0a0a0a] border border-[#222] rounded-3xl p-6 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Artistic Modality</label>
              <div className="grid grid-cols-3 gap-3">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style)}
                    className={`p-4 rounded-2xl border transition-all text-left group ${
                      selectedStyle.id === style.id 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-[#0a0a0a] border-[#222] text-gray-500 hover:border-gray-700'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{style.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-tighter">{style.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isLoading || !prompt}
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-2xl shadow-purple-500/20"
            >
              {isLoading ? (
                <>
                  <RefreshCcw className="animate-spin" size={24} />
                  <span>SYNTHESIZING...</span>
                </>
              ) : (
                <>
                  <Wand2 size={24} />
                  <span>GENERATE AVATAR</span>
                </>
              )}
            </button>
          </div>

          {/* Preview */}
          <div className="relative group">
            <div className="aspect-square bg-[#0a0a0a] rounded-[3rem] border-2 border-dashed border-gray-800 flex flex-col items-center justify-center overflow-hidden relative">
              {generatedUrl ? (
                <img src={generatedUrl} className="w-full h-full object-cover" alt="Avatar Result" />
              ) : (
                <div className="text-center px-10">
                  <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center mx-auto mb-6 text-gray-700">
                    <Palette size={40} />
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Your creation will appear here once synthesized.</p>
                </div>
              )}
              
              {isLoading && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
                  </div>
                  <p className="mt-6 text-blue-400 text-xs font-bold tracking-[0.2em]">RENDERING IDENTITY</p>
                </div>
              )}
            </div>

            {generatedUrl && !isLoading && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                <button className="px-6 py-3 bg-white text-black rounded-full font-bold text-xs shadow-xl flex items-center gap-2 hover:bg-gray-100 transition-colors">
                  <Download size={16} /> SAVE TO GALLERY
                </button>
                <button className="p-3 bg-black border border-[#333] rounded-full text-white shadow-xl hover:bg-[#111] transition-colors">
                  <Sparkles size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarCreator;
