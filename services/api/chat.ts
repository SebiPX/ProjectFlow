import { fetchApi } from './client';

export interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  channel_id: string;
  is_edited: boolean;
  is_deleted: boolean;
  profile?: {
    id: string;
    full_name: string;
    avatar_url: string;
    email: string;
    role: string;
  };
}

export interface ChatSummary {
  channel_id: string;
  last_message_at: string;
}

export const getChatSummary = async (): Promise<ChatSummary[]> => {
  return await fetchApi('/api/chat/summary', { cache: 'no-store' });
};

export interface ChatChannel {
  id: string;
  name: string;
  type: 'project' | 'direct' | 'general';
  avatar?: string;
}

export const getChatChannels = async (): Promise<ChatChannel[]> => {
  return await fetchApi('/api/chat/channels', { cache: 'no-store' });
};

export const getChatMessages = async (channelId: string): Promise<ChatMessage[]> => {
  return await fetchApi(`/api/chat/${channelId}`, { cache: 'no-store' });
};

export const sendChatMessage = async (channelId: string, content: string): Promise<ChatMessage> => {
  return await fetchApi(`/api/chat/${channelId}`, {
    method: 'POST',
    body: JSON.stringify({ content })
  });
};

export const deleteChatMessage = async (messageId: string): Promise<void> => {
  await fetchApi(`/api/chat/messages/${messageId}`, {
    method: 'DELETE'
  });
};
