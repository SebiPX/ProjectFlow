import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from '../lib/AuthContext';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/api/notifications';
import { Icon } from './ui/Icon';
import type { Notification } from '../types/supabase';

interface Props {
    onClose: () => void;
    onNavigate: (view: string, entityId?: string, tab?: string) => void;
}

export const NotificationsDropdown: React.FC<Props> = ({ onClose, onNavigate }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: notifications, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
        enabled: !!user,
        refetchInterval: 30000,
    });

    // Real-time subscription handled globally in useRealtime hook

    const markReadMutation = useMutation({
        mutationFn: markNotificationAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: markAllNotificationsAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markReadMutation.mutate(notification.id);
        }
        
        if (notification.related_entity_id) {
           onNavigate('project-detail', notification.related_entity_id, 'tasks');
        }
        
        onClose();
    };

    if (isLoading) {
        return (
            <div className="absolute right-0 mt-2 w-80 bg-card rounded-lg shadow-xl border border-border p-4 z-50">
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="absolute right-0 mt-2 w-96 bg-card rounded-lg shadow-xl border border-border z-50 max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="text-foreground font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAllReadMutation.mutate()}
                            className="text-xs text-primary hover:text-blue-300"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="overflow-y-auto flex-1 p-2">
                    {!notifications || notifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-3 rounded-md cursor-pointer transition-colors flex gap-3 ${notification.is_read
                                        ? 'bg-transparent text-muted-foreground hover:bg-muted/50'
                                        : 'bg-muted/30 text-foreground hover:bg-muted'
                                        }`}
                                >
                                    <div className="mt-1 flex-shrink-0">
                                        {notification.type === 'success' && <Icon path="M5 13l4 4L19 7" className="w-5 h-5 text-green-500" />}
                                        {notification.type === 'warning' && <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-5 h-5 text-yellow-500" />}
                                        {notification.type === 'error' && <Icon path="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 text-red-500" />}
                                        {notification.type === 'info' && <Icon path="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 text-primary" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${notification.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                                            {notification.title}
                                        </p>
                                        {notification.message && (
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-gray-600 mt-1">
                                            {/* Using simple fallback as date-fns might be missing per previous steps */}
                                            {new Date(notification.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0 text-primary-foreground" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
