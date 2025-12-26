
export enum AppView {
  CHAT = 'CHAT',
  CAMERA = 'CAMERA',
  VIDEO_CALL = 'VIDEO_CALL',
  VOICE_COMPANION = 'VOICE_COMPANION',
  AVATAR = 'AVATAR',
  SETTINGS = 'SETTINGS',
  PEOPLE = 'PEOPLE'
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  type: 'text' | 'image' | 'system';
  status?: 'sent' | 'delivered' | 'read';
}

export interface UserProfile {
  id: string; // Unique identifier (name-based)
  name: string;
  avatarUrl: string;
  theme: 'dark' | 'light' | 'neon';
  joinedAt: number;
  isOnline?: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails: UserProfile[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  type: 'ai' | 'dm' | 'group';
}

export interface FriendRequest {
  id: string;
  from: UserProfile;
  toId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export type RealtimeEvent = 
  | { type: 'PRESENCE'; user: UserProfile }
  | { type: 'MESSAGE'; conversationId: string; message: Message }
  | { type: 'TYPING'; userId: string; conversationId: string; isTyping: boolean }
  | { type: 'FRIEND_REQUEST'; request: FriendRequest }
  | { type: 'FRIEND_RESPONSE'; requestId: string; status: 'accepted' | 'rejected'; from: UserProfile };
