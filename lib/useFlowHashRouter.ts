import { useState, useEffect, useCallback } from 'react';
import type { Project } from '../types/supabase';
import { MOCK_PROJECTS } from '../constants';

export type View = 'dashboard' | 'projects' | 'project-detail' | 'tasks' | 'planning' | 'assets' | 'clients' | 'employees' | 'service-catalog' | 'finances' | 'reports' | 'resources' | 'settings' | 'inventar' | 'verleih' | 'verleih-formular' | 'kalender' | 'logins' | 'handyvertraege' | 'kreditkarten' | 'firmendaten' | 'links' | 'chat' | 'directory-freelancers' | 'directory-locations' | 'cases';

export function useFlowHashRouter() {
  const [view, setViewState] = useState<View>('dashboard');
  const [activeProject, setActiveProjectState] = useState<Project | null>(MOCK_PROJECTS[0]);
  const [activeProjectTab, setActiveProjectTabState] = useState<string>('tasks');
  const [searchQuery, setSearchQuery] = useState('');

  const updateHash = (v: View, projectId?: string, tab?: string) => {
    if (typeof window === 'undefined') return;
    let newHash = `#${v}`;
    if (v === 'project-detail' && projectId) {
      newHash += `?id=${projectId}`;
      if (tab) newHash += `&tab=${tab}`;
    }
    if (window.location.hash !== newHash) {
      window.history.pushState(null, '', newHash);
    }
  };

  const setView = useCallback((newView: View) => {
    setViewState(newView);
    updateHash(newView);
  }, []);

  const handleNavigate = useCallback((newView: View, entityId?: string, tab?: string) => {
    setViewState(newView);
    setSearchQuery(''); // Clear search when changing view

    if (newView === 'project-detail' && entityId) {
      setActiveProjectState({ id: entityId } as Project);
      if (tab) setActiveProjectTabState(tab);
    }
    updateHash(newView, entityId, tab);
  }, []);

  const handleSelectProject = useCallback((project: Project) => {
    setActiveProjectState(project);
    setActiveProjectTabState('overview');
    setViewState('project-detail');
    setSearchQuery('');
    updateHash('project-detail', project.id, 'overview');
  }, []);

  useEffect(() => {
    const syncFromHash = () => {
      if (!window.location.hash) {
        window.history.replaceState(null, '', `#dashboard`);
        return;
      }
      const hashContent = window.location.hash.substring(1);
      const [viewPart, queryPart] = hashContent.split('?');
      const v = viewPart as View;
      
      setViewState(v);
      if (queryPart) {
        const params = new URLSearchParams(queryPart);
        const id = params.get('id');
        const tab = params.get('tab');
        if (id) {
          setActiveProjectState({ id } as Project);
        }
        if (tab) {
          setActiveProjectTabState(tab);
        }
      }
    };

    window.addEventListener('hashchange', syncFromHash);
    window.addEventListener('popstate', syncFromHash);

    // Initial sync
    syncFromHash();

    return () => {
      window.removeEventListener('hashchange', syncFromHash);
      window.removeEventListener('popstate', syncFromHash);
    };
  }, []);

  return {
    view,
    setView,
    activeProject,
    setActiveProject: setActiveProjectState,
    activeProjectTab,
    setActiveProjectTab: setActiveProjectTabState,
    searchQuery,
    setSearchQuery,
    handleNavigate,
    handleSelectProject
  };
}
