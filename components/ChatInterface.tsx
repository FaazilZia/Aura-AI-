
import React, { useState, useEffect, useRef } from 'react';
import { Message, UserProfile, Conversation } from '../types';
import { getGeminiResponse } from '../geminiService';
import { apiService } from '../apiService';
import { subscribeToNetwork, sendRealtimeMessage, sendTypingStatus } from '../realtimeService';
import { Send, Image as ImageIcon, Smile, MoreHorizontal, RotateCcw, X, Search, Zap, Cloud } from 'lucide-react';

interface ChatInterfaceProps {
  currentUser: UserProfile;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentUser }) => {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem(`aura_convos_${currentUser.id}`);
    if (saved) return JSON.parse(saved);
    return [{
      id: 'aura-ai-main',
      type: 'ai',
      participants: ['aura-ai'],
      participantDetails: [{ 
        id: 'aura-ai', 
        name: 'Aura AI', 
        avatarUrl: 'https://picsum.photos/seed/aura-ai/100/100',
        theme: 'dark',
        joinedAt: Date.now()
      }],
      messages: [{ id: '1', senderId: 'aura-ai', senderName: 'Aura AI', text: "Welcome back! Connected to MongoDB cloud storage.", timestamp: Date.now(), type: 'text' }],
      unreadCount: 0
    }];
  });

  const [activeConvoId, setActiveConvoId] = useState<string>(conversations[0].id);
  const [inputValue, setInputValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isFetchingDb, setIsFetchingDb] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConvo = conversations.find(c => c.id === activeConvoId) || conversations[0];

  // Fetch from MongoDB when switching conversations
  useEffect(() => {
    const syncWithDb = async () => {
      setIsFetchingDb(true);
      const dbMessages = await apiService.getMessages(activeConvoId);
      if (dbMessages && dbMessages.length > 0) {
        setConversations(prev => prev.map(c => c.id === activeConvoId 
          ? { ...c, messages: dbMessages, lastMessage: dbMessages[dbMessages.length - 1] } 
          : c
        ));
      }
      setIsFetchingDb(false);
    };
    syncWithDb();
  }, [activeConvoId]);

  useEffect(() => {
    localStorage.setItem(`aura_convos_${currentUser.id}`, JSON.stringify(conversations));
  }, [conversations, currentUser.id]);

  useEffect(() => {
    const unsubscribe = subscribeToNetwork((event) => {
      if (event.type === 'MESSAGE') {
        setConversations(prev => {
          const exists = prev.find(c => c.id === event.conversationId);
          if (exists) {
            if (exists.messages.some(m => m.id === event.message.id)) return prev;
            return prev.map(c => c.id === event.conversationId 
              ? { 
                  ...c, 
                  messages: [...c.messages, event.message],
                  lastMessage: event.message,
                  unreadCount: activeConvoId === c.id ? 0 : c.unreadCount + 1
                } 
              : c
            );
          } else if (event.message.senderId !== currentUser.id && event.conversationId.includes(currentUser.id)) {
            const newConvo: Conversation = {
              id: event.conversationId,
              type: 'dm',
              participants: [event.message.senderId, currentUser.id],
              participantDetails: [{
                id: event.message.senderId,
                name: event.message.senderName,
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.message.senderId}`,
                theme: 'dark',
                joinedAt: Date.now()
              }, currentUser],
              messages: [event.message],
              lastMessage: event.message,
              unreadCount: 1
            };
            return [newConvo, ...prev];
          }
          return prev;
        });
      } else if (event.type === 'TYPING') {
        if (event.userId !== currentUser.id && event.conversationId === activeConvoId) {
          setRemoteTyping(prev => ({ ...prev, [event.userId]: event.isTyping }));
        }
      }
    });
    return unsubscribe;
  }, [activeConvoId, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvo.messages, isAiTyping, remoteTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: inputValue,
      timestamp: Date.now(),
      type: 'text',
      status: 'sent'
    };

    setConversations(prev => prev.map(c => c.id === activeConvoId 
      ? { ...c, messages: [...c.messages, newMessage], lastMessage: newMessage } 
      : c
    ));
    setInputValue('');

    // Persist to MongoDB
    apiService.saveMessage(activeConvoId, newMessage);

    if (activeConvo.type === 'ai') {
      setIsAiTyping(true);
      try {
        const history = activeConvo.messages.map(m => ({
          role: m.senderId === currentUser.id ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));
        const response = await getGeminiResponse(history, inputValue);
        const aiMsg: Message = {
          id: Date.now().toString(),
          senderId: 'aura-ai',
          senderName: 'Aura AI',
          text: response,
          timestamp: Date.now(),
          type: 'text'
        };
        setConversations(prev => prev.map(c => c.id === activeConvoId 
          ? { ...c, messages: [...c.messages, aiMsg], lastMessage: aiMsg } 
          : c
        ));
        // Persist AI response as well
        apiService.saveMessage(activeConvoId, aiMsg);
      } catch (err) { console.error(err); }
      setIsAiTyping(false);
    } else {
      sendRealtimeMessage(activeConvoId, newMessage);
    }
  };

  const handleTyping = (val: string) => {
    setInputValue(val);
    if (activeConvo.type === 'dm') {
      sendTypingStatus(currentUser.id, activeConvoId, val.length > 0);
    }
  };

  return (
    <div className="flex h-full bg-black overflow-hidden">
      {/* Inbox Sidebar */}
      <div className="w-80 border-r border-[#1a1a1a] flex flex-col bg-[#050505]">
        <div className="p-6">
          <h2 className="text-xl font-black tracking-tighter mb-4">INBOX</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
            <input 
              type="text" 
              placeholder="Filter threads..."
              className="w-full bg-[#111] border border-white/5 rounded-2xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(convo => {
            const partner = convo.participantDetails.find(p => p.id !== currentUser.id);
            const isActive = activeConvoId === convo.id;
            return (
              <button
                key={convo.id}
                onClick={() => setActiveConvoId(convo.id)}
                className={`w-full p-4 flex items-center gap-4 transition-all hover:bg-white/5 border-l-2 ${isActive ? 'bg-white/5 border-blue-500' : 'border-transparent'}`}
              >
                <div className="relative">
                  <img src={partner?.avatarUrl} className="w-12 h-12 rounded-2xl object-cover" alt={partner?.name} />
                  {convo.type === 'ai' ? (
                    <div className="absolute -bottom-1 -right-1 p-1 bg-blue-600 rounded-lg"><Zap size={8} /></div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#050505] rounded-full" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm truncate">{partner?.name}</span>
                    <span className="text-[10px] text-gray-600">
                      {convo.lastMessage ? new Date(convo.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{convo.lastMessage?.text || 'No messages yet'}</p>
                </div>
                {convo.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold">{convo.unreadCount}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-black relative">
        {/* Chat Header */}
        <div className="p-4 border-b border-[#1a1a1a] flex justify-between items-center bg-[#050505]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <img 
              src={activeConvo.participantDetails.find(p => p.id !== currentUser.id)?.avatarUrl} 
              className="w-10 h-10 rounded-xl border border-white/10"
              alt="Avatar"
            />
            <div>
              <h2 className="font-bold text-sm">{activeConvo.participantDetails.find(p => p.id !== currentUser.id)?.name}</h2>
              <div className="flex items-center gap-1.5">
                {isFetchingDb ? (
                  <>
                    <Cloud size={10} className="text-blue-400 animate-pulse" />
                    <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Fetching from Cloud...</span>
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Synced with MongoDB</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button className="p-2 text-gray-500 hover:text-white"><MoreHorizontal size={20} /></button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeConvo.messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[70%] p-4 rounded-3xl ${
                  isMe ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10' 
                       : 'bg-[#111] text-gray-200 border border-[#222] rounded-tl-none'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className="text-[10px] opacity-40 mt-2 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          {(isAiTyping || Object.values(remoteTyping).some(v => v)) && (
            <div className="flex justify-start">
              <div className="bg-[#111] p-4 rounded-2xl rounded-tl-none border border-[#222] flex gap-1 animate-pulse">
                <div className="w-1 h-1 bg-gray-500 rounded-full" />
                <div className="w-1 h-1 bg-gray-500 rounded-full" />
                <div className="w-1 h-1 bg-gray-500 rounded-full" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-[#050505] border-t border-[#1a1a1a]">
          <form onSubmit={handleSendMessage} className="flex items-center gap-4 bg-[#111] border border-white/5 rounded-[2rem] p-2 pl-6">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="Write a message..."
              className="flex-1 bg-transparent border-none focus:outline-none text-sm placeholder:text-gray-700"
            />
            <div className="flex items-center gap-2 pr-2">
              <button type="button" className="p-2 text-gray-500 hover:text-blue-400 transition-colors"><Smile size={20} /></button>
              <button type="button" className="p-2 text-gray-500 hover:text-blue-400 transition-colors"><ImageIcon size={20} /></button>
              <button 
                type="submit"
                disabled={!inputValue.trim()}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  inputValue.trim() ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-gray-800 text-gray-600'
                }`}
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
