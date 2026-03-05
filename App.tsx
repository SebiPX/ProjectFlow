
import React, { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { PresenceProvider } from './lib/PresenceContext';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
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

export type View = 'dashboard' | 'projects' | 'project-detail' | 'tasks' | 'planning' | 'assets' | 'clients' | 'employees' | 'service-catalog' | 'finances' | 'reports' | 'resources' | 'settings';

const MainApp: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [activeProject, setActiveProject] = useState<Project | null>(MOCK_PROJECTS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, profile, loading } = useAuth();

  // Initialize Realtime subscriptions
  useRealtime();

  const handleNavigate = (newView: View) => {
    setView(newView);
    setSearchQuery(''); // Clear search when changing view
  };

  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
    setView('project-detail');
    setSearchQuery('');
  };

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return profile?.role === 'client'
          ? <ClientDashboard onSelectProject={handleSelectProject} />
          : <Dashboard onSelectProject={handleSelectProject} />;
      case 'projects':
        return <ProjectList onSelectProject={handleSelectProject} searchQuery={searchQuery} />;
      case 'project-detail':
        return activeProject ? <ProjectDetail project={activeProject} /> : <ProjectList onSelectProject={handleSelectProject} searchQuery={searchQuery} />;
      case 'tasks':
        return <TaskList onSelectProject={handleSelectProject} searchQuery={searchQuery} />;
      case 'assets':
        return <AssetList onSelectProject={handleSelectProject} searchQuery={searchQuery} />;
      case 'clients':
        return <ClientList searchQuery={searchQuery} />;
      case 'employees':
        return <EmployeeList searchQuery={searchQuery} />;
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
      default:
        return profile?.role === 'client'
          ? <ClientDashboard onSelectProject={handleSelectProject} />
          : <Dashboard onSelectProject={handleSelectProject} />;
    }
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <Login />;
  }

  // Show main app if authenticated
  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar currentView={view} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          currentView={view}
          onNavigate={handleNavigate}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900">
          {renderContent()}
        </main>
      </div>
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

