import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { updateTask, getTasksByProject } from '../services/api/tasks';
import { getProjects, getProjectServices } from '../services/api/projects';
import { getAssetsByProject } from '../services/api/assets';
import { getProjectDocuments } from '../services/api/documents';
import { getProfiles } from '../services/api/profiles';
import type { Task } from '../types/supabase';
import { Icon } from './ui/Icon';
import { Avatar } from './ui/Avatar';
import CreatableSelect from 'react-select/creatable';
import { useAuth } from '../lib/AuthContext';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onTimeTrack?: (task: Task) => void;
}

const formatDateTimeLocal = (dateString: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ isOpen, onClose, task, onTimeTrack }) => {
  const { profile } = useAuth();
  const isFreelancer = profile?.role === 'freelancer';
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    project_id: task.project_id,
    status: task.status || 'todo',
    assignee_ids: task.assignee_ids || (task.assignee_id ? [task.assignee_id] : []),
    start_date: formatDateTimeLocal(task.start_date),
    review_date: task.review_date ? new Date(task.review_date).toISOString().split('T')[0] : '',
    revision_date: task.revision_date ? new Date(task.revision_date).toISOString().split('T')[0] : '',
    due_date: formatDateTimeLocal(task.due_date),
    is_visible_to_client: task.is_visible_to_client ?? true,
    brand: task.brand || '',
    show: task.show || '',
    legal_line: task.legal_line || '',
    freigabelink: task.freigabelink || '',
    rights_expiration_date: task.rights_expiration_date ? new Date(task.rights_expiration_date).toISOString().split('T')[0] : '',
    status_influencerclips: task.status_influencerclips || false,
    material_wbd: task.material_wbd || false,
    material_px: task.material_px || false,
    link_to_material: task.link_to_material || '',
  });

  const [formats, setFormats] = useState<string[]>(task.formats || []);

  const [materials, setMaterials] = useState<string[]>(task.materials || []);
  const [customDates, setCustomDates] = useState<{name: string, date: string}[]>(task.custom_dates || []);
  const [dependsOnTaskIds, setDependsOnTaskIds] = useState<string[]>(task.depends_on_task_ids || []);

  // Update form data when task changes
  useEffect(() => {
    setFormData({
      title: task.title,
      description: task.description || '',
      project_id: task.project_id,
      status: task.status || 'todo',
      assignee_ids: task.assignee_ids || (task.assignee_id ? [task.assignee_id] : []),
      start_date: formatDateTimeLocal(task.start_date),
      review_date: task.review_date ? new Date(task.review_date).toISOString().split('T')[0] : '',
      revision_date: task.revision_date ? new Date(task.revision_date).toISOString().split('T')[0] : '',
      due_date: formatDateTimeLocal(task.due_date),
      is_visible_to_client: task.is_visible_to_client ?? true,
      brand: task.brand || '',
      show: task.show || '',
      legal_line: task.legal_line || '',
      freigabelink: task.freigabelink || '',
      rights_expiration_date: task.rights_expiration_date ? new Date(task.rights_expiration_date).toISOString().split('T')[0] : '',
      status_influencerclips: task.status_influencerclips || false,
      material_wbd: task.material_wbd || false,
      material_px: task.material_px || false,
      link_to_material: task.link_to_material || '',
    });
    setFormats(task.formats || []);
    setMaterials(task.materials || []);
    setCustomDates(task.custom_dates || []);
    setDependsOnTaskIds(task.depends_on_task_ids || []);
  }, [task]);

  // Fetch projects for dropdown (keeping in case of legacy use, but UI removed)
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    enabled: isOpen,
  });

  // Fetch assets and documents for materials dropdown
  const { data: projectAssets = [] } = useQuery({
    queryKey: ['assets', formData.project_id],
    queryFn: () => getAssetsByProject(formData.project_id || ''),
    enabled: isOpen && !!formData.project_id,
  });

  const { data: projectDocuments = [] } = useQuery({
    queryKey: ['documents', formData.project_id],
    queryFn: () => getProjectDocuments(formData.project_id || ''),
    enabled: isOpen && !!formData.project_id,
  });

  // Fetch tasks for dependency dropdown
  const { data: projectTasks = [] } = useQuery({
    queryKey: ['tasks', formData.project_id],
    queryFn: () => getTasksByProject(formData.project_id || ''),
    enabled: isOpen && !!formData.project_id,
  });

  // Fetch profiles for assignee dropdown
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: getProfiles,
    enabled: isOpen,
  });

  // Service tracking state
  // Check if project_service_id exists on Task type, fallback to service_module_id if missing type def
  const [projectServiceId, setProjectServiceId] = useState((task as any).project_service_id || '');
  const [estimatedHours, setEstimatedHours] = useState(task.estimated_hours?.toString() || '');
  const [estimatedRate, setEstimatedRate] = useState(task.estimated_rate?.toString() || '');

  // Fetch project services
  const { data: projectServices = [] } = useQuery({
    queryKey: ['project-services', formData.project_id],
    queryFn: () => getProjectServices(formData.project_id),
    enabled: isOpen && !!formData.project_id,
  });

  // Update service state when task changes
  useEffect(() => {
    setProjectServiceId((task as any).project_service_id || '');
    setEstimatedHours(task.estimated_hours?.toString() || '');
    setEstimatedRate(task.estimated_rate?.toString() || '');
  }, [task]);

  // Auto-fill rate when service is selected
  useEffect(() => {
    if (projectServiceId && !estimatedRate) {
      const selectedService = projectServices.find((s: any) => s.id === projectServiceId);
      if (selectedService && selectedService.hourly_rate) {
        setEstimatedRate(selectedService.hourly_rate.toString());
      }
    }
  }, [projectServiceId, projectServices]);

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Task>) => updateTask(task.id, updates),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', task.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-service-breakdown', task.project_id] });
      // If task was moved to another project, also invalidate that project's queries
      if (variables.project_id && variables.project_id !== task.project_id) {
        queryClient.invalidateQueries({ queryKey: ['tasks', variables.project_id] });
        queryClient.invalidateQueries({ queryKey: ['project-service-breakdown', variables.project_id] });
      }
      toast.success('Task updated successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  // Extract unique brands from the selected project's client, fallback to existing tasks
  const selectedProject = projects.find(p => p.id === formData.project_id);
  const clientBrands = selectedProject?.client?.brands || [];
  
  // Combine client brands with any historical ones, removing duplicates
  const allBrandsSet = new Set([...clientBrands, ...projectTasks.map(t => t.brand).filter(Boolean)]);
  const existingBrands = Array.from(allBrandsSet).map(b => ({ value: b as string, label: b as string }));

  const existingShows = Array.from(new Set(projectTasks.map(t => t.show).filter(Boolean))).map(s => ({ value: s as string, label: s as string }));
  const formatOptions = ['16:9', '9:16', '1:1', '4:5'].map(f => ({ value: f, label: f }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    updateMutation.mutate({
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      project_id: formData.project_id,
      status: formData.status as any,
      assignee_ids: formData.assignee_ids,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
      custom_dates: customDates.filter(c => c.name.trim() && c.date),
      materials: materials.filter(m => m.trim() !== ''),
      depends_on_task_ids: dependsOnTaskIds,
      planned_minutes: estimatedHours ? Math.round(parseFloat(estimatedHours) * 60) : undefined,
      is_visible_to_client: formData.is_visible_to_client,
      // Service tracking fields (optional)
      project_service_id: projectServiceId || null,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
      estimated_rate: estimatedRate ? parseFloat(estimatedRate) : null,
      brand: formData.brand || null,
      show: formData.show || null,
      formats: formats,
      legal_line: formData.legal_line || null,
      freigabelink: formData.freigabelink || null,
      rights_expiration_date: formData.rights_expiration_date || null,
      status_influencerclips: formData.status_influencerclips,
      material_wbd: formData.material_wbd,
      material_px: formData.material_px,
      link_to_material: formData.link_to_material || null,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Task Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-2">
              Task Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter task name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
             <div>
               <label className="block text-sm font-medium text-muted-foreground mb-2">Brand</label>
               <CreatableSelect
                 isClearable
                 options={existingBrands}
                 value={formData.brand ? { value: formData.brand, label: formData.brand } : null}
                 onChange={(newValue: any) => setFormData({ ...formData, brand: newValue?.value || '' })}
                 className="react-select-container"
                 classNamePrefix="react-select"
                 placeholder="Select or type new Brand..."
                 styles={{
                   control: (base) => ({
                     ...base,
                     backgroundColor: 'hsl(var(--muted))',
                     borderColor: 'hsl(var(--input))',
                   }),
                   menu: (base) => ({
                     ...base,
                     backgroundColor: 'hsl(var(--card))',
                     border: '1px solid hsl(var(--border))',
                   }),
                   option: (base, state) => ({
                     ...base,
                     backgroundColor: state.isFocused ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                     color: 'hsl(var(--foreground))',
                   }),
                   singleValue: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
                   input: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
                 }}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-muted-foreground mb-2">Show</label>
               <CreatableSelect
                 isClearable
                 options={existingShows}
                 value={formData.show ? { value: formData.show, label: formData.show } : null}
                 onChange={(newValue: any) => setFormData({ ...formData, show: newValue?.value || '' })}
                 className="react-select-container"
                 classNamePrefix="react-select"
                 placeholder="Select or type new Show..."
                 styles={{
                   control: (base) => ({
                     ...base,
                     backgroundColor: 'hsl(var(--muted))',
                     borderColor: 'hsl(var(--input))',
                   }),
                   menu: (base) => ({
                     ...base,
                     backgroundColor: 'hsl(var(--card))',
                     border: '1px solid hsl(var(--border))',
                   }),
                   option: (base, state) => ({
                     ...base,
                     backgroundColor: state.isFocused ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                     color: 'hsl(var(--foreground))',
                   }),
                   singleValue: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
                   input: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
                 }}
               />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
             {/* Link to Material */}
             <div>
               <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                 <Icon path="M10 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" className="w-4 h-4 text-primary" />
                 Link to Material
               </label>
               <input
                 type="url"
                 value={formData.link_to_material}
                 onChange={(e) => setFormData({ ...formData, link_to_material: e.target.value })}
                 className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                 placeholder="Link to raw material..."
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                 <Icon path="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" className="w-4 h-4 text-primary" />
                 Freigabelink
               </label>
               <input
                 type="url"
                 value={formData.freigabelink}
                 onChange={(e) => setFormData({ ...formData, freigabelink: e.target.value })}
                 className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h-1m-4-6l-4 4m0 0l-4-4m4 4V4" className="w-4 h-4" />
                  Rights Expiration Date
               </label>
               <input
                 type="date"
                 value={formData.rights_expiration_date}
                 onChange={(e) => setFormData({ ...formData, rights_expiration_date: e.target.value })}
                 className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
               />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
             <div>
               <label className="block text-sm font-medium text-muted-foreground mb-2">Legal Line / Copyright</label>
               <textarea
                 rows={2}
                 value={formData.legal_line}
                 onChange={(e) => setFormData({ ...formData, legal_line: e.target.value })}
                 className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-muted-foreground mb-2">Formats</label>
               <CreatableSelect
                 isMulti
                 options={formatOptions}
                 value={formats.map(f => ({ value: f, label: f }))}
                 onChange={(newValues: any) => setFormats(newValues ? newValues.map((v: any) => v.value) : [])}
                 className="react-select-container"
                 classNamePrefix="react-select"
                 placeholder="e.g. 16:9, 9:16..."
                 styles={{
                   control: (base) => ({
                     ...base,
                     backgroundColor: 'hsl(var(--muted))',
                     borderColor: 'hsl(var(--input))',
                   }),
                   menu: (base) => ({
                     ...base,
                     backgroundColor: 'hsl(var(--card))',
                     border: '1px solid hsl(var(--border))',
                   }),
                   option: (base, state) => ({
                     ...base,
                     backgroundColor: state.isFocused ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                     color: 'hsl(var(--foreground))',
                   }),
                   multiValue: (base) => ({
                     ...base,
                     backgroundColor: 'hsl(var(--primary) / 0.2)',
                     borderRadius: '4px',
                   }),
                   multiValueLabel: (base) => ({ ...base, color: 'hsl(var(--primary))' }),
                   multiValueRemove: (base) => ({
                     ...base,
                     color: 'hsl(var(--primary))',
                     ':hover': { backgroundColor: 'hsl(var(--primary))', color: 'white' },
                  }),
                   input: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
                 }}
               />
             </div>
          </div>

          {/* Checkboxes for Workflow States */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-lg border border-border/50 mt-4">
             <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="material_wbd_edit"
                  checked={formData.material_wbd}
                  onChange={(e) => setFormData({ ...formData, material_wbd: e.target.checked })}
                  className="w-4 h-4 bg-background border-input rounded focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="material_wbd_edit" className="text-sm font-medium text-muted-foreground cursor-pointer flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                  Material WBD (Warner)
                </label>
             </div>
             <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="material_px_edit"
                  checked={formData.material_px}
                  onChange={(e) => setFormData({ ...formData, material_px: e.target.checked })}
                  className="w-4 h-4 bg-background border-input rounded focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="material_px_edit" className="text-sm font-medium text-muted-foreground cursor-pointer flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
                  Material PX (Schickeria)
                </label>
             </div>
             <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="influencerclips_edit"
                  checked={formData.status_influencerclips}
                  onChange={(e) => setFormData({ ...formData, status_influencerclips: e.target.checked })}
                  className="w-4 h-4 bg-background border-input rounded focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="influencerclips_edit" className="text-sm font-medium text-muted-foreground cursor-pointer flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
                  Influencer Clips (Needs clearing)
                </label>
             </div>
          </div>

          {/* Project Selection */}
          <div>
            <label htmlFor="project_id" className="block text-sm font-medium text-muted-foreground mb-2">
              Project
            </label>
            <select
              id="project_id"
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a project...</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Task description..."
            />
          </div>

          {/* Status & Assignee Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-muted-foreground mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Assignees
              </label>
              <div className="w-full max-h-48 overflow-y-auto bg-muted border border-input rounded-lg p-2 space-y-1">
                {profiles.map((profile) => (
                  <label key={profile.id} className="flex items-center p-2 hover:bg-background rounded cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.assignee_ids.includes(profile.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked 
                          ? [...formData.assignee_ids, profile.id]
                          : formData.assignee_ids.filter(id => id !== profile.id);
                        setFormData({ ...formData, assignee_ids: newIds });
                      }}
                      className="w-4 h-4 bg-background border-input rounded focus:ring-2 focus:ring-primary flex-shrink-0"
                    />
                    <div className="ml-3 flex items-center gap-2 overflow-hidden">
                      <Avatar avatarPath={profile.avatar_url} alt={profile.full_name || ''} size="sm" />
                      <span className="text-sm text-foreground truncate">{profile.full_name || profile.email}</span>
                    </div>
                  </label>
                ))}
                {profiles.length === 0 && (
                  <div className="text-sm text-muted-foreground p-2">No profiles found</div>
                )}
              </div>
            </div>
          </div>

          {/* Dependencies / Blocked By */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" className="w-4 h-4" />
              Blocked By (Dependencies)
            </label>
            <div className="w-full max-h-32 overflow-y-auto bg-muted border border-input rounded-lg p-2 space-y-1">
              {projectTasks.filter((t: Task) => t.id !== task.id).map((t: Task) => (
                <label key={t.id} className="flex items-center p-2 hover:bg-background rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={dependsOnTaskIds.includes(t.id)}
                    onChange={(e) => {
                      const newIds = e.target.checked 
                        ? [...dependsOnTaskIds, t.id]
                        : dependsOnTaskIds.filter(id => id !== t.id);
                      setDependsOnTaskIds(newIds);
                    }}
                    className="w-4 h-4 bg-background border-input rounded focus:ring-2 focus:ring-primary flex-shrink-0"
                  />
                  <div className="ml-3 flex items-center gap-2 overflow-hidden">
                    <span className="text-sm text-foreground truncate">{t.title}</span>
                  </div>
                </label>
              ))}
              {projectTasks.filter((t: Task) => t.id !== task.id).length === 0 && (
                <div className="text-sm text-muted-foreground p-2">No other tasks available to depend on.</div>
              )}
            </div>
          </div>

          {/* Static Dates Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-muted-foreground mb-2">
                Start Date
              </label>
              <input
                type="datetime-local"
                id="start_date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-muted-foreground mb-2">
                Date Final (Due)
              </label>
              <input
                type="datetime-local"
                id="due_date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Custom Dates & Milestones */}
          <div className="border-t border-border pt-4 mt-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-sm font-medium text-foreground">Custom Milestones & Dates</h3>
                <p className="text-xs text-muted-foreground">Add specific deadlines or events for this task.</p>
              </div>
              <button
                type="button"
                onClick={() => setCustomDates([...customDates, { name: '', date: '' }])}
                className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 text-sm font-medium"
              >
                <Icon path="M12 4v16m8-8H4" className="w-4 h-4" />
                Add Date
              </button>
            </div>
            
            <div className="space-y-3">
              {customDates.map((cd, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-background p-2 rounded-lg border border-border">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={cd.name}
                      onChange={(e) => {
                        const newDates = [...customDates];
                        newDates[idx].name = e.target.value;
                        setCustomDates(newDates);
                      }}
                      placeholder="e.g. Interner Review"
                      className="w-full px-3 py-1.5 bg-muted border border-input rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="datetime-local"
                      value={cd.date}
                      onChange={(e) => {
                        const newDates = [...customDates];
                        newDates[idx].date = e.target.value;
                        setCustomDates(newDates);
                      }}
                      className="w-full px-3 py-1.5 bg-muted border border-input rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newDates = customDates.filter((_, i) => i !== idx);
                      setCustomDates(newDates);
                    }}
                    className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
                  >
                    <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {customDates.length === 0 && (
                <div className="text-sm text-muted-foreground italic text-center py-2 bg-muted/30 rounded-lg">No custom dates added</div>
              )}
            </div>
          </div>

          {/* Materials Section */}
          <div className="border-t border-border pt-4 mt-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-sm font-medium text-foreground">Materials / Equipment</h3>
                <p className="text-xs text-muted-foreground">List external materials or items required.</p>
              </div>
              <div className="flex items-center gap-3">
                {(projectAssets.length > 0 || projectDocuments.length > 0) && (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        setMaterials([...materials, e.target.value]);
                      }
                    }}
                    className="px-2 py-1 bg-muted border border-input rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    <option value="">+ From Project</option>
                    {projectAssets.length > 0 && (
                      <optgroup label="Assets">
                        {projectAssets.map((a: any) => (
                          <option key={`asset-${a.id}`} value={`Asset: ${a.name}`}>{a.name}</option>
                        ))}
                      </optgroup>
                    )}
                    {projectDocuments.length > 0 && (
                      <optgroup label="Documents">
                        {projectDocuments.map((d: any) => (
                          <option key={`doc-${d.id}`} value={`Doc: ${d.title}`}>{d.title}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => setMaterials([...materials, ''])}
                  className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 text-sm font-medium"
                >
                  <Icon path="M12 4v16m8-8H4" className="w-4 h-4" />
                  Custom
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {materials.map((mat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={mat}
                      onChange={(e) => {
                        const newMats = [...materials];
                        newMats[idx] = e.target.value;
                        setMaterials(newMats);
                      }}
                      placeholder="Item name / link"
                      className="w-full pl-9 pr-4 py-2 bg-muted border border-input rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newMats = materials.filter((_, i) => i !== idx);
                      setMaterials(newMats);
                    }}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                  >
                    <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {materials.length === 0 && (
                <div className="text-sm text-muted-foreground italic text-center py-2 bg-muted/30 rounded-lg">No materials added</div>
              )}
            </div>
          </div>

          {/* Service-Based Estimation (Optional) */}
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-5 h-5 text-primary" />
              Service-Based Estimation (Optional)
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Link this task to a service from the catalog to enable Plan vs Actual tracking.
            </p>

            {/* Service Module */}
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label htmlFor="project_service_id" className="block text-sm font-medium text-muted-foreground mb-2">
                  Budget / Moco Leistung
                </label>
                <select
                  id="project_service_id"
                  value={projectServiceId}
                  onChange={(e) => {
                    setProjectServiceId(e.target.value);
                  }}
                  className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={updateMutation.isPending || !formData.project_id}
                >
                  <option value="">None</option>
                  {projectServices
                    .filter((m: any) => m.active)
                    .map((module: any) => (
                      <option key={module.id} value={module.id}>
                        {module.name} (Budget: {module.budget ? module.budget + '€' : '-'})
                      </option>
                    ))}
                </select>
                {!formData.project_id && (
                  <p className="text-xs text-muted-foreground mt-1">Please select a project first to see its services.</p>
                )}
              </div>
            </div>
            {/* Estimated Hours & Rate */}
            <div className={`grid grid-cols-1 ${isFreelancer ? '' : 'md:grid-cols-2'} gap-4`}>
              <div>
                <label htmlFor="estimated_hours" className="block text-sm font-medium text-muted-foreground mb-2">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  id="estimated_hours"
                  min="0"
                  step="0.1"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  disabled={!projectServiceId || updateMutation.isPending}
                  className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">Planned billable hours</p>
              </div>

              {!isFreelancer && (
                <div>
                  <label htmlFor="estimated_rate" className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    Estimated Rate (€/h)
                  </label>
                  <input
                    type="number"
                    id="estimated_rate"
                    min="0"
                    step="0.01"
                    value={estimatedRate}
                    onChange={(e) => setEstimatedRate(e.target.value)}
                    disabled={!projectServiceId || updateMutation.isPending}
                    className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Override if custom pricing</p>
                </div>
              )}
            </div>

            {/* Planned Value Preview */}
            {!isFreelancer && estimatedHours && estimatedRate && (
              <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Planned Value:</strong>{' '}
                  {(parseFloat(estimatedHours) * parseFloat(estimatedRate)).toFixed(2)} €
                </p>
              </div>
            )}
          </div>

          {/* Client Visibility Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_visible_to_client"
              checked={formData.is_visible_to_client}
              onChange={(e) => setFormData({ ...formData, is_visible_to_client: e.target.checked })}
              className="w-4 h-4 bg-muted border-input rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="is_visible_to_client" className="ml-2 text-sm text-muted-foreground">
              Visible to client
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center gap-3 pt-4 border-t border-border">
            {onTimeTrack && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onTimeTrack(task);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-foreground rounded-lg transition-colors flex items-center gap-2"
              >
                <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />
                Track Time
              </button>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                disabled={updateMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Task'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
