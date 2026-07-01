
import React, { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { PresenceProvider } from './lib/PresenceContext';
import { Login } from './components/Login';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { useRealtime } from './lib/useRealtime';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { TaskList } from './components/TaskList';
import { AssetList } from './components/AssetList';
import { ClientList } from './components/ClientList';
import { EmployeeList } from './components/EmployeeList';
import { ServiceModuleList } from './components/ServiceModuleList';
import { Finances } from './components/Finances';
import { Reports } from './components/Reports';
import { Planning } from './components/Planning';
import { Settings } from './components/Settings';
import ResourcePlanning from './components/ResourcePlanning';
import type { Project } from './types/supabase';
import { MOCK_PROJECTS } from './constants';
import { InventarApp } from './components/InventarApp';
import { ChatView } from './components/chat/ChatView';
import { ContactsList } from './components/directory/ContactsList';
import { LocationsList } from './components/directory/LocationsList';
import { CasesList } from './components/CasesList';
import { PublicAssetReview } from './components/PublicAssetReview';
import { Notes } from './components/Notes';
import { AccountList } from './components/AccountList';
import { KitchenDutyPlanner } from './components/KitchenDutyPlanner';
import { MocoOffers } from './components/MocoOffers';

export type { View } from './lib/useFlowHashRouter';
import { useFlowHashRouter, View } from './lib/useFlowHashRouter';

const MainApp: React.FC = () => {
  const {
    view,
    activeProject,
    activeProjectTab,
    searchQuery,
    setSearchQuery,
    handleNavigate,
    handleSelectProject
  } = useFlowHashRouter();
  const { user, profile, loading } = useAuth();

  // Initialize Realtime subscriptions
  useRealtime();

  const renderContent = () => {
    if (view === 'finances' && profile?.role === 'freelancer') {
      return <Dashboard onSelectProject={handleSelectProject} />;
    }

    switch (view) {
      case 'dashboard':
        return profile?.role === 'client'
          ? <ClientDashboard onSelectProject={handleSelectProject} />
          : <Dashboard onSelectProject={handleSelectProject} />;
      case 'projects':
        return <ProjectList onSelectProject={handleSelectProject} searchQuery={searchQuery} />;
      case 'project-detail':
        return activeProject ? <ProjectDetail project={activeProject} defaultTab={activeProjectTab} /> : <ProjectList onSelectProject={handleSelectProject} searchQuery={searchQuery} />;
      case 'tasks':
        return <TaskList onSelectProject={handleSelectProject} searchQuery={searchQuery} />;
      case 'assets':
        // Removing searchQuery to fix lint error if AssetList doesn't support it
        return <AssetList onSelectProject={handleSelectProject} />;
      case 'cases':
        return <CasesList />;
      case 'clients':
        return <ClientList searchQuery={searchQuery} />;
      case 'employees':
        return <EmployeeList searchQuery={searchQuery} />;
      case 'directory-freelancers':
        return <ContactsList />;
      case 'directory-locations':
        return <LocationsList />;
      case 'planning':
        return <Planning />;
      case 'service-catalog':
        return <ServiceModuleList searchQuery={searchQuery} />;
      case 'settings':
        return <Settings />;
      case 'finances':
        return <Finances />;
      case 'reports':
        return <Reports />;
      case 'resources':
        return <ResourcePlanning />;
      case 'chat':
        return <ChatView />;
      case 'notes':
        return <Notes />;
      case 'accounts':
        return <AccountList searchQuery={searchQuery} />;
      case 'kitchen-duty':
        return <KitchenDutyPlanner />;
      case 'moco-offers':
        return <MocoOffers />;
      case 'inventar':
      case 'verleih':
      case 'verleih-formular':
      case 'kalender':
      case 'logins':
      case 'links':
        // InventarApp intercepts these paths and uses its own MemoryRouter structure
        return <InventarApp onBack={() => handleNavigate('dashboard')} setView={handleNavigate} dashboardPath={`/${view}`} />;
      case 'handyvertraege':
      case 'kreditkarten':
      case 'firmendaten': {
        const isGF = profile?.role === 'GF' || profile?.role === 'superadmin';
        if (!isGF) {
          return profile?.role === 'client'
            ? <ClientDashboard onSelectProject={handleSelectProject} />
            : <Dashboard onSelectProject={handleSelectProject} />;
        }
        return <InventarApp onBack={() => handleNavigate('dashboard')} setView={handleNavigate} dashboardPath={`/${view}`} />;
      }
      default:
        return profile?.role === 'client'
          ? <ClientDashboard onSelectProject={handleSelectProject} />
          : <Dashboard onSelectProject={handleSelectProject} />;
    }
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check for public review route first
  const urlParams = new URLSearchParams(window.location.search);
  const reviewAssetId = urlParams.get('review_asset');
  const reviewAssetIds = urlParams.get('review_assets');
  
  if (reviewAssetIds) {
    return <PublicAssetReview assetIds={reviewAssetIds.split(',')} />;
  } else if (reviewAssetId) {
    return <PublicAssetReview assetId={reviewAssetId} />;
  }

  // Show login if not authenticated
  if (!user) {
    return <Login />;
  }

  // Show main app if authenticated
  return (
    <div className="flex flex-col h-screen print:h-auto print:block print:min-h-0 bg-background text-foreground overflow-hidden print:overflow-visible font-sans antialiased">
      <Navigation 
        currentView={view} 
        onNavigate={handleNavigate} 
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
      />
      <main className="flex-1 overflow-x-hidden overflow-y-auto print:overflow-visible print:block bg-muted/40 print:bg-white border-t border-border print:border-none">
        {renderContent()}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PresenceProvider>
          <MainApp />
          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            aria-label="Toast Notifications"
          />
        </PresenceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

