
import { RealtimeEvent, UserProfile, Message } from './types';

const CHANNEL_NAME = 'aura_realtime_network';
const channel = new BroadcastChannel(CHANNEL_NAME);

export const subscribeToNetwork = (callback: (event: RealtimeEvent) => void) => {
  const handler = (e: MessageEvent<RealtimeEvent>) => callback(e.data);
  channel.addEventListener('message', handler);
  return () => channel.removeEventListener('message', handler);
};

export const broadcastEvent = (event: RealtimeEvent) => {
  channel.postMessage(event);
};

// Heartbeat to keep presence alive
export const startPresenceHeartbeat = (user: UserProfile) => {
  const interval = setInterval(() => {
    broadcastEvent({ type: 'PRESENCE', user });
  }, 3000);
  return () => clearInterval(interval);
};

export const sendRealtimeMessage = (conversationId: string, message: Message) => {
  broadcastEvent({ type: 'MESSAGE', conversationId, message });
};

export const sendTypingStatus = (userId: string, conversationId: string, isTyping: boolean) => {
  broadcastEvent({ type: 'TYPING', userId, conversationId, isTyping });
};
