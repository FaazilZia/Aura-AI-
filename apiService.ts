
import { UserProfile, Message } from './types';

const API_BASE = 'http://localhost:5000/api';

export const apiService = {
  async syncUser(user: UserProfile): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/sync-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl
      })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Connection failed');
    }
    return data;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const res = await fetch(`${API_BASE}/messages/${conversationId}`);
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      return [];
    }
  },

  async saveMessage(conversationId: string, message: Message): Promise<void> {
    try {
      await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...message, conversationId })
      });
    } catch (e) {
      console.warn("Message not persisted to cloud.");
    }
  }
};
