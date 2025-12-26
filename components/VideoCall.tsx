
import React, { useRef, useState, useEffect } from 'react';
import { analyzeVideoFrame, analyzeAudioTone } from '../geminiService';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  Maximize2, Share2, Sparkles, MessageCircle, Activity, Volume2
} from 'lucide-react';

const VideoCall: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [analysis, setAnalysis] = useState<any>(null);
  const [audioAnalysis, setAudioAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAudioAnalyzing, setIsAudioAnalyzing] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  useEffect(() => {
    startCall();
    const videoInterval = setInterval(runAIAnalysis, 8000); 
    const audioInterval = setInterval(runAudioAnalysis, 12000); // Slightly longer for audio snippets
    
    return () => {
      clearInterval(videoInterval);
      clearInterval(audioInterval);
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      
      // Setup Audio Snippet Recording
      setupAudioRecorder(stream);
    } catch (err) {
      console.error("Call initialization failed:", err);
    }
  };

  const setupAudioRecorder = (stream: MediaStream) => {
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      audioChunksRef.current = [];
      await processAudioSnippet(audioBlob);
    };
    mediaRecorderRef.current = recorder;
  };

  const runAudioAnalysis = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive' && !muted) {
      mediaRecorderRef.current.start();
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 3000); // Capture 3 seconds of audio
    }
  };

  const processAudioSnippet = async (blob: Blob) => {
    setIsAudioAnalyzing(true);
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Audio = (reader.result as string).split(',')[1];
      try {
        const result = await analyzeAudioTone(base64Audio);
        setAudioAnalysis(result);
      } catch (e) {
        console.error("Audio analysis error:", e);
      } finally {
        setIsAudioAnalyzing(false);
      }
    };
  };

  const runAIAnalysis = async () => {
    if (localVideoRef.current && !videoOff && !isAnalyzing) {
      setIsAnalyzing(true);
      const canvas = document.createElement('canvas');
      canvas.width = localVideoRef.current.videoWidth;
      canvas.height = localVideoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(localVideoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
        try {
          const result = await analyzeVideoFrame(base64);
          setAnalysis(result);
        } catch (e) {
          console.error("AI analysis error:", e);
        }
      }
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="relative h-full bg-[#0a0a0a] overflow-hidden flex flex-col">
      {/* Remote Participant (Mock) */}
      <div className="flex-1 bg-gradient-to-br from-[#111] to-black relative">
        <img 
          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1280&h=720&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-80" 
          alt="Remote Participant"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        
        <div className="absolute top-8 left-8">
          <div className="flex items-center gap-3 p-2 pr-4 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center font-bold">S</div>
            <div>
              <p className="text-sm font-bold">Sarah Jenkins</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] text-gray-400">Live Captions Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Voice Insight */}
        {audioAnalysis && !muted && (
          <div className="absolute bottom-32 left-8 max-w-[200px] animate-in slide-in-from-left duration-500">
            <div className="p-4 bg-purple-600/20 backdrop-blur-xl border border-purple-500/30 rounded-3xl">
              <div className="flex items-center gap-2 mb-2 text-purple-400">
                <Volume2 size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Vocal Tone</span>
              </div>
              <p className="text-xs font-bold text-white mb-1">{audioAnalysis.vocalEmotion}</p>
              <p className="text-[10px] text-gray-300 italic">"{audioAnalysis.tip}"</p>
              <div className="mt-2 flex items-center gap-1">
                <div className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-1000" 
                    style={{ width: audioAnalysis.energy === 'High' ? '90%' : audioAnalysis.energy === 'Medium' ? '50%' : '20%' }}
                  />
                </div>
                <span className="text-[8px] text-purple-400 font-bold uppercase">{audioAnalysis.energy} Energy</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Local Participant Window */}
      <div className="absolute top-8 right-8 w-48 md:w-72 aspect-video rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl z-20 bg-black">
        {videoOff ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-500">
            <VideoOff size={40} />
            <span className="text-[10px] font-bold mt-2">VIDEO PAUSED</span>
          </div>
        ) : (
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover mirror" 
          />
        )}
        
        {/* AI Insight Overlay */}
        {analysis && !videoOff && (
          <div className="absolute inset-x-0 bottom-0 p-3 bg-blue-600/90 backdrop-blur-md text-white">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Aura Insight</span>
            </div>
            <p className="text-[10px] leading-tight font-medium">
              You look <span className="underline">{analysis.emotion}</span>! {analysis.suggestions[0]}
            </p>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="p-8 flex justify-center items-center gap-6 bg-gradient-to-t from-black to-transparent z-30">
        <button 
          onClick={() => setMuted(!muted)}
          className={`p-4 rounded-2xl border transition-all ${muted ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-white'}`}
        >
          {muted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button 
          onClick={() => setVideoOff(!videoOff)}
          className={`p-4 rounded-2xl border transition-all ${videoOff ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-white'}`}
        >
          {videoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>
        <button className="p-5 rounded-3xl bg-red-500 text-white shadow-xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-all">
          <PhoneOff size={32} />
        </button>
        <button className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white">
          <Share2 size={24} />
        </button>
        <button className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white">
          <MessageCircle size={24} />
        </button>
      </div>

      {/* Background AI Analysis Status */}
      {(isAnalyzing || isAudioAnalyzing) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-blue-500/20 backdrop-blur-md rounded-full border border-blue-500/30 flex items-center gap-2 z-40">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">
            {isAudioAnalyzing ? 'Analyzing Vocal Patterns...' : 'AI Optimizing Stream...'}
          </span>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
