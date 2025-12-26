
import React, { useState, useEffect } from 'react';
import { UserProfile, FriendRequest, Conversation } from '../types';
import { subscribeToNetwork, broadcastEvent } from '../realtimeService';
import { Search, Radar, UserPlus, UserCheck, Timer, ShieldAlert } from 'lucide-react';

interface UserSearchProps {
  currentUser: UserProfile;
  onStartChat: (user: UserProfile) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ currentUser, onStartChat }) => {
  const [nearbyUsers, setNearbyUsers] = useState<UserProfile[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToNetwork((event) => {
      if (event.type === 'PRESENCE') {
        if (event.user.id !== currentUser.id) {
          setNearbyUsers(prev => {
            if (prev.some(u => u.id === event.user.id)) return prev;
            return [...prev, { ...event.user, isOnline: true }];
          });
        }
      }
    });

    // Cleanup stale users after 10 seconds of no heartbeat
    const interval = setInterval(() => {
      setNearbyUsers(prev => prev.filter(u => Date.now() - (u.joinedAt || 0) < 600000)); 
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [currentUser.id]);

  const startScan = () => {
    setIsScanning(true);
    setNearbyUsers([]);
    // Force a presence broadcast
    broadcastEvent({ type: 'PRESENCE', user: currentUser });
    setTimeout(() => setIsScanning(false), 3000);
  };

  return (
    <div className="h-full bg-black flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="max-w-2xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className={`w-24 h-24 rounded-full bg-blue-600/10 flex items-center justify-center mx-auto relative ${isScanning ? 'animate-pulse' : ''}`}>
            <Radar size={48} className={`text-blue-500 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning && (
              <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping opacity-20" />
            )}
          </div>
          <h1 className="text-4xl font-black tracking-tighter">DISCOVER PEOPLE</h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Scan the neural network for other real users currently active. Open this app in another tab to see it in action!
          </p>
        </div>

        <div className="bg-[#050505] border border-white/5 rounded-[3rem] p-8 space-y-6 shadow-2xl">
          <button 
            onClick={startScan}
            disabled={isScanning}
            className="w-full py-4 bg-white text-black rounded-3xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
          >
            {isScanning ? 'SCANNING NETWORK...' : 'START NEURAL SCAN'}
          </button>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Users Found ({nearbyUsers.length})</h3>
            {nearbyUsers.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-xs text-gray-700">No active nodes detected in your immediate vicinity.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {nearbyUsers.map(user => (
                  <div key={user.id} className="p-4 bg-[#111] border border-white/5 rounded-3xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={user.avatarUrl} className="w-12 h-12 rounded-2xl object-cover" alt={user.name} />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#111] rounded-full" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{user.name}</p>
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Authenticated User</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onStartChat(user)}
                      className="p-3 bg-blue-600/10 text-blue-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"
                    >
                      <UserPlus size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 pt-8 border-t border-white/5">
          <div className="flex items-center gap-2 text-gray-600">
            <ShieldAlert size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Timer size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Real-time Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSearch;
