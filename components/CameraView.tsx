
import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Layers, Sparkles, Image as ImageIcon, Download } from 'lucide-react';

const FILTERS = [
  { id: 'normal', name: 'Original', css: 'none' },
  { id: 'noir', name: 'Noir', css: 'grayscale(100%) contrast(120%)' },
  { id: 'cyber', name: 'Cyber', css: 'hue-rotate(180deg) saturate(200%) brightness(1.1)' },
  { id: 'warm', name: 'Vintage', css: 'sepia(40%) contrast(110%) brightness(0.9)' },
  { id: 'glitch', name: 'Prism', css: 'contrast(150%) saturate(300%) hue-rotate(45deg)' },
];

const CameraView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'PHOTO' | 'VIDEO'>('PHOTO');

  useEffect(() => {
    startCamera();
    return () => stream?.getTracks().forEach(track => track.stop());
  }, []);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: true 
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.filter = activeFilter.css;
        context.drawImage(videoRef.current, 0, 0);
        setCapturedImage(canvasRef.current.toDataURL('image/png'));
      }
    }
  };

  return (
    <div className="relative h-full bg-black flex flex-col items-center justify-center overflow-hidden">
      {capturedImage ? (
        <div className="absolute inset-0 z-50 bg-black flex flex-col">
          <div className="flex-1 relative">
            <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
            <div className="absolute top-6 left-6 right-6 flex justify-between">
              <button onClick={() => setCapturedImage(null)} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white">
                <RefreshCw size={24} />
              </button>
              <a href={capturedImage} download="aura-shot.png" className="p-3 bg-blue-600 rounded-full text-white">
                <Download size={24} />
              </a>
            </div>
          </div>
          <div className="p-8 flex justify-center gap-4 bg-black">
            <button className="px-8 py-3 bg-blue-600 rounded-full font-bold">Post to Story</button>
            <button className="px-8 py-3 bg-white/10 rounded-full font-bold">Send to AI</button>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover transition-all duration-300"
            style={{ filter: activeFilter.css }}
          />
          
          <canvas ref={canvasRef} className="hidden" />

          {/* HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none border-[1px] border-white/10 m-4 rounded-3xl" />
          
          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center gap-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            {/* Filter Selector */}
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar max-w-full px-4">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f)}
                  className={`flex-shrink-0 flex flex-col items-center gap-2 group transition-all ${
                    activeFilter.id === f.id ? 'scale-110' : 'opacity-60 scale-90'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl border-2 transition-all overflow-hidden ${
                    activeFilter.id === f.id ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-white/20'
                  }`}>
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900" style={{ filter: f.css }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{f.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-12 pointer-events-auto">
              <button className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white">
                <ImageIcon size={24} />
              </button>
              
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group transition-all active:scale-95"
              >
                <div className="w-16 h-16 bg-white rounded-full group-hover:scale-90 transition-transform" />
              </button>

              <button className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white">
                <RefreshCw size={24} />
              </button>
            </div>

            <div className="flex gap-6 text-xs font-bold tracking-widest pointer-events-auto">
              <button onClick={() => setMode('PHOTO')} className={mode === 'PHOTO' ? 'text-white' : 'text-white/40'}>STILL</button>
              <button onClick={() => setMode('VIDEO')} className={mode === 'VIDEO' ? 'text-white' : 'text-white/40'}>PULSE</button>
              <span className="text-white/20">|</span>
              <button className="text-white/40">LENS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraView;
