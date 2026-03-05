import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

/**
 * Placeholder for Realtime events (moved away from Supabase)
 */
export function useRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    // Realtime not yet implemented with custom backend
  }, [user, queryClient]);
}

