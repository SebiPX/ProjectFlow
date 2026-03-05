import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface PresenceState {
    onlineUsers: Set<string>; // Set of User IDs (profile id)
}

const PresenceContext = createContext<PresenceState>({
    onlineUsers: new Set(),
});

export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!user) {
            setOnlineUsers(new Set());
            return;
        }

        // Just add current user for now
        setOnlineUsers(new Set([user.id]));
    }, [user]);

    return (
        <PresenceContext.Provider value={{ onlineUsers }}>
            {children}
        </PresenceContext.Provider>
    );
};

