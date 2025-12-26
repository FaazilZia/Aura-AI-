
import React, { useState, useEffect } from 'react';
import { AppView, UserProfile, Conversation } from './types';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import CameraView from './components/CameraView';
import VideoCall from './components/VideoCall';
import AvatarCreator from './components/AvatarCreator';
import UserSearch from './components/UserSearch';
import { apiService } from './apiService';
import { startPresenceHeartbeat } from './realtimeService';
import { Mic, Shield, ArrowRight, Zap } from 'lucide-react';

const STORAGE_KEY = 'aura_user_identity_v3';
const SESSION_ID = Math.random().toString(36).substr(2, 9);

const VoiceCompanionStub: React.FC = () => (
  <div className="h-full flex flex-col items-center justify-center bg-black p-8 text-center space-y-12">
    <div className="relative">
      <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse blur-3xl opacity-30 absolute inset-0" />
      <div className="w-48 h-48 rounded-full border border-blue-500/50 flex items-center justify-center relative z-10">
        <div className="w-40 h-40 rounded-full border-2 border-dashed border-blue-400/30 animate-[spin_10s_linear_infinite]" />
        <Mic size={64} className="text-white absolute" />
      </div>
    </div>
    <div className="max-w-md">
      <h2 className="text-3xl font-bold mb-4">Aura Voice</h2>
      <p className="text-gray-500 mb-8 leading-relaxed">
        Your AI companion for emotional support and conversation. Speak naturally, Aura is listening.
      </p>
      <button className="px-12 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10">
        Start Conversation
      </button>
    </div>
  </div>
);

const SettingsStub: React.FC = () => (
  <div className="h-full bg-black p-12 overflow-y-auto">
    <div className="max-w-2xl mx-auto space-y-12">
      <h2 className="text-3xl font-black tracking-tight">PREFERENCES</h2>
      <div className="space-y-6">
        <div className="p-6 rounded-3xl bg-[#0a0a0a] border border-[#222] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-2xl text-green-500"><Shield size={24} /></div>
            <div>
              <p className="font-bold">Privacy Shield</p>
              <p className="text-xs text-gray-500">Active for all real-time interactions</p>
            </div>
          </div>
          <div className="w-12 h-6 bg-green-600 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" /></div>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [setupName, setSetupName] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const userWithSession = { ...parsed, id: `${parsed.id}_${SESSION_ID}` };
        setUserProfile(userWithSession);
        // Background sync
        apiService.syncUser(parsed).catch(() => {});
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (userProfile) {
      const stop = startPresenceHeartbeat(userProfile);
      return () => stop();
    }
  }, [userProfile]);

  const handleInitializeIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupName.trim()) return;
    setIsInitializing(true);
    
    const baseId = setupName.trim().toLowerCase().replace(/\s+/g, '-');
    const newProfile: UserProfile = {
      id: baseId,
      name: setupName.trim(),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${setupName.trim()}`,
      theme: 'dark',
      joinedAt: Date.now()
    };

    try {
      const syncedProfile = await apiService.syncUser(newProfile);
      const profileWithSession = { ...syncedProfile, id: `${syncedProfile.id}_${SESSION_ID}` };
      setUserProfile(profileWithSession);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedProfile));
    } catch (err) {
      // Fallback to local only if server is down
      const profileWithSession = { ...newProfile, id: `${newProfile.id}_${SESSION_ID}` };
      setUserProfile(profileWithSession);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserProfile(null);
    setSetupName('');
  };

  const handleStartChat = (targetUser: UserProfile) => {
    const convosKey = `aura_convos_${userProfile?.id}`;
    const existing = JSON.parse(localStorage.getItem(convosKey) || '[]');
    const convoId = [userProfile?.id, targetUser.id].sort().join('--');
    
    if (!existing.some((c: any) => c.id === convoId)) {
      const newConvo: Conversation = {
        id: convoId,
        type: 'dm',
        participants: [userProfile!.id, targetUser.id],
        participantDetails: [userProfile!, targetUser],
        messages: [],
        unreadCount: 0
      };
      localStorage.setItem(convosKey, JSON.stringify([newConvo, ...existing]));
    }
    setCurrentView(AppView.CHAT);
  };

  const renderView = () => {
    if (!userProfile) return null;
    switch (currentView) {
      case AppView.CHAT:
        return <ChatInterface currentUser={userProfile} />;
      case AppView.PEOPLE:
        return <UserSearch currentUser={userProfile} onStartChat={handleStartChat} />;
      case AppView.CAMERA:
        return <CameraView />;
      case AppView.VIDEO_CALL:
        return <VideoCall />;
      case AppView.AVATAR:
        return <AvatarCreator />;
      case AppView.VOICE_COMPANION:
        return <VoiceCompanionStub />;
      case AppView.SETTINGS:
        return <SettingsStub />;
      default:
        return <ChatInterface currentUser={userProfile} />;
    }
  };

  if (!userProfile) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full" />
        
        <div className="relative z-10 w-full max-w-md space-y-12 text-center">
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20 mb-8 animate-pulse">
              <Zap size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">AURA CHAT</h1>
            <p className="text-gray-500 text-sm font-medium">Join the network by entering your name below.</p>
          </div>
          
          <form onSubmit={handleInitializeIdentity} className="space-y-4">
            <input 
              autoFocus
              type="text"
              value={setupName}
              onChange={(e) => setSetupName(e.target.value)}
              placeholder="Your display name"
              disabled={isInitializing}
              className="w-full bg-[#111] border border-white/5 rounded-3xl px-8 py-5 text-xl text-center focus:outline-none focus:border-blue-500/50 disabled:opacity-50 transition-all placeholder:text-gray-800"
            />

            <button 
              type="submit" 
              disabled={isInitializing || !setupName.trim()}
              className="w-full py-5 bg-white text-black rounded-3xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all disabled:bg-gray-700 shadow-xl shadow-white/5"
            >
              {isInitializing ? 'JOINING...' : 'BEGIN JOURNEY'} <ArrowRight size={20} />
            </button>
          </form>
          
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black opacity-50">
            Open multiple tabs to chat with yourself in real-time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden">
      <Sidebar currentView={currentView} setView={setCurrentView} user={userProfile} onLogout={handleLogout} />
      <main className="flex-1 h-full overflow-hidden relative">
        <div className="relative h-full z-10">{renderView()}</div>
      </main>
    </div>
  );
};

export default App;
