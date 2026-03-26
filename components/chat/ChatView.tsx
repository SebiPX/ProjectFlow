import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects } from '../../services/api/projects';
import { getChatMessages, sendChatMessage, getChatSummary, ChatMessage, ChatSummary } from '../../services/api/chat';
import { Icon } from '../ui/Icon';
import { Avatar } from '../ui/Avatar';

interface ChatChannel {
  id: string;
  name: string;
  type: 'project' | 'direct' | 'general';
  avatar?: string;
}

export const ChatView: React.FC = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial read states from localStorage
  const getInitialReadStates = () => {
    const states: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('chat_read_')) {
        const channelId = key.replace('chat_read_', '');
        states[channelId] = localStorage.getItem(key) || '';
      }
    }
    return states;
  };

  const [lastReadStates, setLastReadStates] = useState<Record<string, string>>(getInitialReadStates);

  const updateLastRead = (channelId: string, timestamp: string) => {
    localStorage.setItem(`chat_read_${channelId}`, timestamp);
    setLastReadStates(prev => ({ ...prev, [channelId]: timestamp }));
  };

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects
  });

  const channels: ChatChannel[] = [
    { id: 'general', name: 'General Agency Chat', type: 'general' },
    ...projects.map(p => ({
      id: p.id,
      name: p.title,
      type: 'project' as const
    }))
  ];

  const activeChannel = channels.find(c => c.id === activeChannelId);

  // Fetch messages every 3 seconds (Short Polling)
  const { data: messages = [] } = useQuery({
    queryKey: ['chat', activeChannelId],
    queryFn: () => getChatMessages(activeChannelId),
    refetchInterval: 3000,
    staleTime: 0,
    enabled: !!activeChannelId
  });

  // Fetch summary of last messages every 5 seconds
  const { data: chatSummary = [] } = useQuery({
    queryKey: ['chat-summary'],
    queryFn: getChatSummary,
    refetchInterval: 5000,
    staleTime: 0
  });

  // Automatically mark as read if channel is active and receives new message
  useEffect(() => {
    if (messages.length > 0 && activeChannelId) {
      const latestMessageAt = messages[messages.length - 1].created_at;
      const currentRead = lastReadStates[activeChannelId];
      if (!currentRead || new Date(latestMessageAt) > new Date(currentRead)) {
         updateLastRead(activeChannelId, latestMessageAt);
      }
    }
  }, [messages, activeChannelId, lastReadStates]);

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => sendChatMessage(activeChannelId, content),
    onSuccess: (newMessage) => {
      // Optimistically update cache
      queryClient.setQueryData<ChatMessage[]>(['chat', activeChannelId], (old) => {
        return [...(old || []), newMessage];
      });
      setMessageText('');
    }
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText);
  };

  return (
    <div className="flex h-full bg-background overflow-hidden relative border-t border-border">
      {/* Sidebar Channels */}
      <div className="w-80 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Icon path="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" className="w-5 h-5 text-primary" />
            Chat
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">General</h3>
            {(() => {
              const summary = chatSummary.find((s: ChatSummary) => s.channel_id === 'general');
              const hasUnread = summary && (!lastReadStates['general'] || new Date(summary.last_message_at) > new Date(lastReadStates['general']));
              const isActive = activeChannelId === 'general';
              return (
                <button
                  onClick={() => {
                    setActiveChannelId('general');
                    if (summary) updateLastRead('general', summary.last_message_at);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 relative ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 relative">
                    <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" className="w-4 h-4" />
                    {hasUnread && !isActive && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-card"></span>}
                  </div>
                  <span className="font-medium truncate">Agency Chat</span>
                </button>
              );
            })()}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Project Groups</h3>
            <div className="space-y-1">
              {channels.filter(c => c.type === 'project').map(channel => {
                const summary = chatSummary.find((s: ChatSummary) => s.channel_id === channel.id);
                const hasUnread = summary && (!lastReadStates[channel.id] || new Date(summary.last_message_at) > new Date(lastReadStates[channel.id]));
                const isActive = activeChannelId === channel.id;

                return (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setActiveChannelId(channel.id);
                      if (summary) updateLastRead(channel.id, summary.last_message_at);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 relative ${isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'}`}
                  >
                    <div className="w-8 h-8 rounded shrink-0 bg-muted border border-border flex items-center justify-center text-muted-foreground relative">
                      <Icon path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" className="w-4 h-4" />
                      {hasUnread && !isActive && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full translate-x-1/2 -translate-y-1/2 border border-card shadow-sm"></span>}
                    </div>
                    <span className="truncate">{channel.name}</span>
                  </button>
                );
              })}
              {channels.filter(c => c.type === 'project').length === 0 && (
                 <p className="text-xs text-muted-foreground px-2">No active projects</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background relative">
        {/* Chat Header */}
        <div className="h-16 border-b border-border bg-card flex items-center px-6 shrink-0 z-10">
          <h2 className="text-xl font-bold text-foreground">
            {activeChannel?.name || 'Select a chat'}
          </h2>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Icon path="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" className="w-16 h-16 mb-4 opacity-50" />
              <p>No messages in this chat yet.</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.sender_id === profile?.id;
              
              return (
                <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <Avatar
                    avatarPath={isMe ? profile?.avatar_url : msg.profile?.avatar_url}
                    alt={msg.profile?.full_name || "User"}
                    className="w-10 h-10 rounded-full shrink-0"
                  />
                  <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">
                        {isMe ? 'You' : msg.profile?.full_name || 'Team Member'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-card border-t border-border shrink-0 z-10">
          <form onSubmit={handleSendMessage} className="flex gap-2 relative">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={`Message ${activeChannel?.name}...`}
              className="flex-1 bg-muted border border-input rounded-full px-6 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder-muted-foreground"
            />
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Icon path="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" className="w-5 h-5 ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
