import { fetchApi } from './client';
import type { Notification } from '../../types/supabase';

/**
 * Get notifications for the current user
 * Returns all unread notifications + last 20 read ones
 */
export async function getNotifications(): Promise<Notification[]> {
    return await fetchApi('/api/notifications/my');
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(id: string): Promise<void> {
    await fetchApi(`/api/notifications/${id}/read`, {
        method: 'PUT'
    });
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead(): Promise<void> {
    await fetchApi('/api/notifications/my/read-all', {
        method: 'PUT'
    });
}

/**
 * Create a notification (Internal use)
 */
export async function createNotification(
    notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>
): Promise<void> {
    await fetchApi('/api/notifications', {
        method: 'POST',
        body: JSON.stringify(notification)
    });
}

