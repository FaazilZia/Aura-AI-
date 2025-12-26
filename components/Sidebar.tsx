
import React from 'react';
import { AppView, UserProfile } from '../types';
import { 
  MessageSquare, 
  Camera, 
  Video, 
  Mic, 
  User as UserIcon, 
  Settings,
  Zap,
  LogOut,
  Users,
  Database
} from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  user: UserProfile | null;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, user, onLogout }) => {
  const items = [
    { id: AppView.CHAT, icon: MessageSquare, label: 'Messages' },
    { id: AppView.PEOPLE, icon: Users, label: 'People' },
    { id: AppView.CAMERA, icon: Camera, label: 'Lens' },
    { id: AppView.VIDEO_CALL, icon: Video, label: 'Calls' },
    { id: AppView.VOICE_COMPANION, icon: Mic, label: 'Aura AI' },
    { id: AppView.AVATAR, icon: UserIcon, label: 'Identity' },
    { id: AppView.SETTINGS, icon: Settings, label: 'Options' },
  ];

  return (
    <div className="w-20 md:w-64 h-full bg-[#050505] border-r border-[#1a1a1a] flex flex-col p-4 z-50">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <Zap size={24} className="text-white" />
        </div>
        <span className="hidden md:block font-bold text-xl tracking-tight">AURA</span>
      </div>

      <nav className="flex-1 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 group ${
                isActive 
                ? 'bg-[#121212] text-blue-400 shadow-sm' 
                : 'text-gray-500 hover:bg-[#0d0d0d] hover:text-gray-300'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-blue-500/10' : ''}`}>
                <Icon size={24} />
              </div>
              <span className={`hidden md:block font-medium ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-2 space-y-4">
        {/* Database Connectivity Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-[#111] rounded-xl border border-white/5">
          <Database size={12} className="text-green-500" />
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.1em]">Cloud Database Sync</span>
        </div>

        {user && (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-[#0d0d0d] group border border-white/5">
            <div className="flex items-center gap-3 overflow-hidden">
              <img 
                src={user.avatarUrl} 
                className="w-10 h-10 rounded-full object-cover border border-white/10" 
                alt="Profile"
              />
              <div className="hidden md:block truncate">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Live</p>
                </div>
              </div>
            </div>
            {onLogout && (
              <button 
                onClick={onLogout}
                className="hidden md:block p-2 text-gray-600 hover:text-red-400 transition-colors"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
