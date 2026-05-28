import React, { useState, useEffect, useRef } from 'react';
import type { View } from '../App';
import { useAuth } from '../lib/AuthContext';
import { Avatar } from './ui/Avatar';
import { Icon } from './ui/Icon';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../services/api/notifications';
import { NotificationsDropdown } from './NotificationsDropdown';

interface NavigationProps {
  currentView: View;
  onNavigate: (view: View, entityId?: string, tab?: string) => void;
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

interface NavItem {
  view?: View;
  icon: string;
  label: string;
  adminOnly?: boolean;
  subItems?: { view: View; label: string; icon: string; adminOnly?: boolean }[];
}

interface NavCategory {
  label: string;
  icon: string; // SVG path
  items: NavItem[];
}

const navCategories: NavCategory[] = [
  {
    label: 'PX Desk',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', // grid
    items: [
      { view: 'dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
      { 
        label: 'Equipment', 
        icon: 'inventory_2',
        subItems: [
          { view: 'inventar', label: 'Inventar', icon: 'inventory_2' },
          { view: 'verleih-formular', label: 'Verleih', icon: 'calendar_month' },
          { view: 'kalender', label: 'Kalender', icon: 'event' },
        ]
      },
      { 
        label: 'Links & Logins', 
        icon: 'password',
        subItems: [
          { view: 'logins', label: 'Logins', icon: 'password' },
          { view: 'links', label: 'Links', icon: 'link' },
        ]
      },
      { view: 'notes', label: 'ToDo / Notizen', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
      { view: 'handyvertraege', label: 'Verträge', icon: 'smartphone', adminOnly: true },
      { view: 'kreditkarten', label: 'Karten', icon: 'credit_card', adminOnly: true },
      { view: 'firmendaten', label: 'Firma', icon: 'business', adminOnly: true },
    ],
  },
  {
    label: 'Projekte',
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', // folder
    items: [
      { view: 'projects', label: 'Projects', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
      { view: 'tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
      { view: 'resources', label: 'Ressourcen', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
      { view: 'cases', label: 'Cases / Portfolios', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
      { view: 'planning', label: 'Planning', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { view: 'assets', label: 'Assets', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    ],
  },
  {
    label: 'CRM & Network',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a3.001 3.001 0 01-2.704-2.143M8 11V7a4 4 0 118 0v4m-2 8h2', // users
    items: [
      { view: 'clients', label: 'Clients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a3.001 3.001 0 01-2.704-2.143M8 11V7a4 4 0 118 0v4m-2 8h2' },
      { view: 'employees', label: 'Team', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { view: 'directory-freelancers', label: 'Crew & Dienstleister', icon: 'M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4' }, // abstract network icon
      { view: 'directory-locations', label: 'Locations', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' }, // building icon
    ],
  },
  {
    label: 'Admin',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', // settings gear
    items: [
      { view: 'service-catalog', label: 'Service Catalog', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', adminOnly: true },
      { view: 'finances', label: 'Finances', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', adminOnly: true },
      { view: 'reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', adminOnly: true },
    ],
  },
];

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate, searchQuery, onSearch }) => {
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const isClient = profile?.role === 'client';

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: !!profile,
    refetchInterval: 30000,
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
  const prevUnreadCountRef = useRef(unreadCount);

  useEffect(() => {
    // Request notification permission if not already granted or denied
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      // Play a synthesized "ping" sound
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
          oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // Pitch bend up
          
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05); // Attack
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5); // Decay
          
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.5);
        }
      } catch (e) {
        console.error('Audio play prevented or unsupported', e);
      }

      // Show browser push notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const newNotifs = notifications?.filter(n => !n.is_read) || [];
        const latest = newNotifs[0];
        
        if (latest) {
          new Notification('PX Flow', {
            body: latest.title,
            icon: '/favicon.ico' // Ensure you have a favicon or logo available here
          });
        }
      }
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, notifications]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error('Error logging out: ' + error.message);
    }
  };

  const getSearchPlaceholder = () => {
    switch (currentView) {
      case 'projects': return 'Search projects...';
      case 'tasks': return 'Search tasks...';
      case 'clients': return 'Search clients...';
      case 'assets': return 'Search assets...';
      case 'employees': return 'Search employees...';
      case 'service-catalog': return 'Search services...';
      default: return 'Search...';
    }
  };

  // Filter categories based on roles
  const visibleCategories = navCategories.map(cat => {
    return {
      ...cat,
      items: cat.items.filter(item => {
        if (item.adminOnly && !isAdmin) return false;
        
        // Handle subItems filtering
        if (item.subItems) {
          item.subItems = item.subItems.filter(sub => {
            if (sub.adminOnly && !isAdmin) return false;
            if (isClient) {
              const allowedClientViews: View[] = ['dashboard', 'projects'];
              return allowedClientViews.includes(sub.view);
            }
            if (profile?.role === 'freelancer') {
              const allowedFreelancerViews: View[] = ['dashboard', 'chat', 'projects', 'tasks', 'assets', 'resources', 'cases', 'planning', 'directory-freelancers', 'directory-locations'];
              return allowedFreelancerViews.includes(sub.view);
            }
            return true;
          });
          // If all subItems are filtered out, filter out the parent item
          if (item.subItems.length === 0) return false;
        }

        if (isClient) {
          const allowedClientViews: View[] = ['dashboard', 'projects'];
          if (item.view) return allowedClientViews.includes(item.view);
        }
        if (profile?.role === 'freelancer') {
          // Hide finances and admin stuff completely, hide clients, etc.
          const allowedFreelancerViews: View[] = ['dashboard', 'chat', 'projects', 'tasks', 'assets', 'resources', 'cases', 'planning', 'directory-freelancers', 'directory-locations'];
          if (item.view) return allowedFreelancerViews.includes(item.view);
        }
        return true;
      })
    };
  }).filter(cat => cat.items.length > 0);

  // Find the active category based on current view
  let activeCategory = visibleCategories.find(cat => 
    cat.items.some(i => i.view === currentView || (i.subItems && i.subItems.some(sub => sub.view === currentView)))
  ) || visibleCategories[0];

  // If view is 'project-detail', set active category to 'Projekte', for 'settings' keep 'PX Desk'
  if (currentView === 'project-detail') {
     activeCategory = visibleCategories.find(cat => cat.label === 'Projekte') || visibleCategories[0];
  } else if (currentView === 'settings') {
     activeCategory = visibleCategories.find(cat => cat.label === 'PX Desk') || visibleCategories[0];
  }

  const allNavItems = visibleCategories.flatMap(cat => 
    cat.items.flatMap(item => {
      if (item.subItems) {
        return item.subItems;
      }
      return [{ view: item.view!, label: item.label, icon: item.icon, adminOnly: item.adminOnly }];
    })
  );

  return (
    <div className="flex-shrink-0 flex flex-col z-50 print:hidden">
      {/* Top Bar: Logo, Categories & Actions */}
      <nav className="bg-background border-b border-border">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo / Title */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-center pt-1.5 transition-all">
                <img 
                  src="/logos/px-black.png" 
                  alt="PX Logo" 
                  className="h-9 w-auto object-contain drop-shadow-sm dark:hidden block"
                />
                <img 
                  src="/logos/px-alpha.png" 
                  alt="PX Logo" 
                  className="h-9 w-auto object-contain drop-shadow-sm hidden dark:block"
                />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground hidden xl:block mt-1">
                Flow
              </h1>
            </button>

            {/* External Links */}
            {!isClient && (
              <div className="hidden md:flex items-center pl-4 border-l border-border h-8">
                <a
                  href={import.meta.env.VITE_PX_STUDIO_URL || "https://px-studio.labs-schickeria.com/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-primary/10 text-primary">
                    <span className="material-icons-round text-[14px]">auto_awesome</span>
                  </div>
                  PX-Studio
                  <span className="material-icons-round text-[12px] opacity-50 ml-0.5">open_in_new</span>
                </a>
              </div>
            )}
          </div>

          {/* Desktop Categories */}
          <div className="hidden lg:flex items-center h-full gap-2 px-8">
            {visibleCategories.map((category) => {
              const isActive = activeCategory.label === category.label;
              return (
                <button
                  key={category.label}
                  onClick={() => {
                    const firstView = category.items[0].subItems ? category.items[0].subItems[0].view : category.items[0].view;
                    onNavigate(firstView!);
                  }}
                  className={`flex items-center justify-center h-full px-4 border-b-2 transition-colors ${
                    isActive 
                      ? 'border-primary text-foreground' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Icon path={category.icon} className="w-4 h-4" />
                    {category.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Section: Search & Profile */}
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative hidden md:block">
              <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchQuery || ''}
                onChange={(e) => onSearch?.(e.target.value)}
                className="bg-muted border border-border rounded-full pl-9 pr-4 py-1.5 w-60 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted-foreground text-foreground transition-all"
              />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors relative"
              >
                <Icon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationsDropdown onClose={() => setShowNotifications(false)} onNavigate={onNavigate as any} />
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`flex items-center gap-3 pl-1 pr-1 py-1 rounded-full border transition-all ${currentView === 'settings' ? 'bg-muted border-primary/50' : 'border-transparent hover:bg-muted/50'}`}
              >
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-foreground leading-none">{profile?.full_name || 'User'}</p>
                  <p className="text-[10px] uppercase text-primary font-bold mt-1 tracking-widest text-opacity-80">
                    {profile?.role || 'user'}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full border border-border p-0.5 overflow-hidden relative group">
                  <Avatar
                    avatarPath={profile?.avatar_url}
                    alt={profile?.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Icon path="M19 9l-7 7-7-7" className="w-3 h-3 text-foreground" />
                  </div>
                </div>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-xl border border-border py-1 z-50">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onNavigate('settings');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-muted flex items-center space-x-2 transition-colors"
                  >
                    <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <div className="border-t border-border my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-muted flex items-center space-x-2 transition-colors"
                  >
                    <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Secondary Bar (Sub-items of Active Category) */}
      {activeCategory && activeCategory.items.length > 1 && (
        <div className="hidden lg:flex items-center justify-center bg-muted/30 border-b border-border h-12 gap-1 px-4">
          {activeCategory.items.map((item) => {
            if (item.subItems) {
              const isActive = item.subItems.some(sub => currentView === sub.view);
              return (
                <div key={item.label} className="relative" onMouseLeave={() => setOpenSubMenu(null)}>
                  <button
                    onMouseEnter={() => setOpenSubMenu(item.label)}
                    onClick={() => setOpenSubMenu(openSubMenu === item.label ? null : item.label)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-2 ${
                      isActive || openSubMenu === item.label
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon path={item.icon} className="w-4 h-4" />
                    {item.label}
                    <Icon path="M19 9l-7 7-7-7" className="w-3 h-3 ml-1" />
                  </button>
                  {openSubMenu === item.label && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 min-w-[160px] bg-card rounded-xl shadow-xl border border-border py-1 z-50">
                      {item.subItems.map(sub => (
                        <button
                          key={sub.view}
                          onClick={() => {
                            setOpenSubMenu(null);
                            onNavigate(sub.view);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${currentView === sub.view ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >
                          <Icon path={sub.icon} className="w-4 h-4" />
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = currentView === item.view || (currentView === 'project-detail' && item.view === 'projects');
            
            return (
              <button
                key={item.label}
                onClick={() => onNavigate(item.view!)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-2 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon path={item.icon} className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile Tabs (Bottom row for small screens, using absolute positioning or just keeping it scrollable) */}
      <div className="lg:hidden flex overflow-x-auto hide-scrollbar border-b border-border bg-background">
        {allNavItems.map((item) => {
          const isActive = currentView === item.view || (currentView === 'project-detail' && item.view === 'projects');
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`flex-[1_0_auto] flex flex-col items-center justify-center py-2 min-w-[70px] px-2 relative transition-colors ${isActive ? 'text-primary bg-primary/10' : 'text-primary-foreground hover:text-primary-foreground'}`}
            >
              <Icon path={item.icon} className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
              {isActive && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(59,130,246,0.5)] text-primary-foreground" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
