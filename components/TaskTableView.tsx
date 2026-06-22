import React, { useState, useEffect } from 'react';
import type { Task, Profile } from '../types/supabase';
import { TaskStatus } from '../types/supabase';
import { Icon } from './ui/Icon';
import { toast } from 'react-toastify';

interface TaskTableViewProps {
  tasks: Task[];
  profiles: Profile[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<any>;
  onDeleteTask: (task: Task) => void;
  onDuplicateTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onTimeTrack: (task: Task) => void;
}

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  tasks,
  profiles,
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
  onEditTask,
  onTimeTrack
}) => {
  const [editingCells, setEditingCells] = useState<Record<string, string>>({}); // taskId-field -> current value during typing
  const [savingCells, setSavingCells] = useState<Record<string, boolean>>({}); // taskId-field -> isSaving status

  const handleTextChange = (taskId: string, field: string, value: string) => {
    setEditingCells(prev => ({ ...prev, [`${taskId}-${field}`]: value }));
  };

  const handleBlur = async (taskId: string, field: string, originalValue: any) => {
    const key = `${taskId}-${field}`;
    const currentValue = editingCells[key];
    
    // Only save if the value actually changed
    if (currentValue !== undefined && currentValue !== originalValue) {
      setSavingCells(prev => ({ ...prev, [key]: true }));
      try {
        await onUpdateTask(taskId, { [field]: currentValue || null });
      } catch (err) {
        console.error(err);
      } finally {
        setSavingCells(prev => ({ ...prev, [key]: false }));
      }
    }
  };

  const handleCheckboxChange = async (taskId: string, field: string, checked: boolean) => {
    const key = `${taskId}-${field}`;
    setSavingCells(prev => ({ ...prev, [key]: true }));
    try {
      await onUpdateTask(taskId, { [field]: checked });
      toast.success(`${field === 'material_wbd' ? 'WBD' : 'PX'} updated successfully!`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to update ${field === 'material_wbd' ? 'WBD' : 'PX'}: ${err.message || err}`);
    } finally {
      setSavingCells(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSelectChange = async (taskId: string, field: string, value: any) => {
    const key = `${taskId}-${field}`;
    setSavingCells(prev => ({ ...prev, [key]: true }));
    try {
      let updates: any = { [field]: value || null };
      if (field === 'assignee_ids') {
        updates = { assignee_ids: value ? [value] : [] };
      }
      await onUpdateTask(taskId, updates);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCells(prev => ({ ...prev, [key]: false }));
    }
  };

  // Helper to format date for input field
  const formatDateForInput = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  return (
    <div className="w-full h-full flex flex-col bg-card/15 rounded-xl border border-border/40 overflow-hidden">
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left border-collapse min-w-[1400px]">
          <thead>
            <tr className="bg-muted/30 border-b border-border sticky top-0 bg-card z-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="p-3 w-[120px]">Brand</th>
              <th className="p-3 w-[220px]">Show</th>
              <th className="p-3 min-w-[280px]">Item name</th>
              <th className="p-3 w-[130px]">Deadline</th>
              <th className="p-3 w-[65px] text-center">WBD</th>
              <th className="p-3 w-[65px] text-center">PX</th>
              <th className="p-3 w-[160px]">Editor*in</th>
              <th className="p-3 w-[120px]">Status</th>
              <th className="p-3 w-[180px]">Freigabelink</th>
              <th className="p-3 w-[180px]">Link to Material</th>
              <th className="p-3 w-[250px]">Notizen / Änderungen</th>
              <th className="p-3 w-[120px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-xs">
            {tasks.map(task => {
              const activeAssigneeId = task.assignee_ids?.[0] || task.assignee_id || '';
              
              return (
                <tr 
                  key={task.id} 
                  className="hover:bg-muted/10 transition-colors group"
                >
                  {/* Brand */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={editingCells[`${task.id}-brand`] ?? (task.brand || '')}
                      onChange={(e) => handleTextChange(task.id, 'brand', e.target.value)}
                      onBlur={() => handleBlur(task.id, 'brand', task.brand)}
                      className="bg-transparent hover:bg-muted/20 focus:bg-background border-0 focus:ring-1 focus:ring-primary rounded p-1 w-full text-xs font-medium focus:outline-none transition-colors text-foreground"
                      placeholder="Brand..."
                    />
                  </td>

                  {/* Show */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={editingCells[`${task.id}-show`] ?? (task.show || '')}
                      onChange={(e) => handleTextChange(task.id, 'show', e.target.value)}
                      onBlur={() => handleBlur(task.id, 'show', task.show)}
                      className="bg-transparent hover:bg-muted/20 focus:bg-background border-0 focus:ring-1 focus:ring-primary rounded p-1 w-full text-xs focus:outline-none transition-colors text-foreground"
                      placeholder="Show..."
                    />
                  </td>

                  {/* Item name (Title) */}
                  <td className="p-2 font-medium">
                    <input
                      type="text"
                      value={editingCells[`${task.id}-title`] ?? task.title}
                      onChange={(e) => handleTextChange(task.id, 'title', e.target.value)}
                      onBlur={() => handleBlur(task.id, 'title', task.title)}
                      className="bg-transparent hover:bg-muted/20 focus:bg-background border-0 focus:ring-1 focus:ring-primary rounded p-1 w-full text-xs font-semibold focus:outline-none transition-colors text-foreground"
                    />
                  </td>

                  {/* Deadline (Due Date) */}
                  <td className="p-2">
                    <input
                      type="date"
                      value={editingCells[`${task.id}-due_date`] ?? formatDateForInput(task.due_date)}
                      onChange={(e) => handleTextChange(task.id, 'due_date', e.target.value)}
                      onBlur={() => handleBlur(task.id, 'due_date', formatDateForInput(task.due_date))}
                      className="bg-transparent hover:bg-muted/20 focus:bg-background border-0 focus:ring-1 focus:ring-primary rounded p-1 w-full text-xs focus:outline-none transition-colors text-foreground"
                    />
                  </td>

                  {/* Material WBD Checkbox */}
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={task.material_wbd || false}
                      onChange={(e) => handleCheckboxChange(task.id, 'material_wbd', e.target.checked)}
                      className="w-4 h-4 bg-background border-input rounded text-primary focus:ring-primary cursor-pointer"
                    />
                  </td>

                  {/* Material PX Checkbox */}
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={task.material_px || false}
                      onChange={(e) => handleCheckboxChange(task.id, 'material_px', e.target.checked)}
                      className="w-4 h-4 bg-background border-input rounded text-primary focus:ring-primary cursor-pointer"
                    />
                  </td>

                  {/* Editor*in (Assignee) */}
                  <td className="p-2">
                    <select
                      value={activeAssigneeId}
                      onChange={(e) => handleSelectChange(task.id, 'assignee_ids', e.target.value)}
                      className="bg-transparent hover:bg-muted/20 focus:bg-background border-0 focus:ring-1 focus:ring-primary rounded p-1 w-full text-xs focus:outline-none transition-colors text-foreground"
                    >
                      <option value="" className="bg-card text-muted-foreground">-- Unassigned --</option>
                      {profiles.map(p => (
                        <option key={p.id} value={p.id} className="bg-card text-foreground">
                          {p.full_name || p.email}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Status */}
                  <td className="p-2">
                    <select
                      value={task.status || 'todo'}
                      onChange={(e) => handleSelectChange(task.id, 'status', e.target.value)}
                      className="bg-transparent hover:bg-muted/20 focus:bg-background border-0 focus:ring-1 focus:ring-primary rounded p-1 w-full text-xs font-semibold focus:outline-none transition-colors text-foreground"
                    >
                      <option value="todo" className="bg-card text-foreground">To Do</option>
                      <option value="in_progress" className="bg-card text-foreground">In Progress</option>
                      <option value="review" className="bg-card text-foreground">Review</option>
                      <option value="done" className="bg-card text-foreground">Done</option>
                    </select>
                  </td>

                  {/* Freigabelink */}
                  <td className="p-2">
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="url"
                        value={editingCells[`${task.id}-freigabelink`] ?? (task.freigabelink || '')}
                        onChange={(e) => handleTextChange(task.id, 'freigabelink', e.target.value)}
                        onBlur={() => handleBlur(task.id, 'freigabelink', task.freigabelink)}
                        className="bg-transparent hover:bg-muted/20 focus:bg-background border-0 focus:ring-1 focus:ring-primary rounded p-1 flex-grow text-xs focus:outline-none transition-colors text-foreground"
                        placeholder="https://..."
                      />
                      {task.freigabelink && (
                        <a 
                          href={task.freigabelink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-blue-300 p-0.5"
                          title="Open Freigabelink"
                        >
                          <Icon path="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Link to Material */}
                  <td className="p-2">
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="url"
                        value={editingCells[`${task.id}-link_to_material`] ?? (task.link_to_material || '')}
                        onChange={(e) => handleTextChange(task.id, 'link_to_material', e.target.value)}
                        onBlur={() => handleBlur(task.id, 'link_to_material', task.link_to_material)}
                        className="bg-transparent hover:bg-muted/20 focus:bg-background border-0 focus:ring-1 focus:ring-primary rounded p-1 flex-grow text-xs focus:outline-none transition-colors text-foreground"
                        placeholder="Link to raw material..."
                      />
                      {task.link_to_material && (
                        <a 
                          href={task.link_to_material} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-blue-300 p-0.5"
                          title="Open Material Link"
                        >
                          <Icon path="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Description (Notizen/Änderungen) */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={editingCells[`${task.id}-description`] ?? (task.description || '')}
                      onChange={(e) => handleTextChange(task.id, 'description', e.target.value)}
                      onBlur={() => handleBlur(task.id, 'description', task.description)}
                      className="bg-transparent hover:bg-muted/20 focus:bg-background border-0 focus:ring-1 focus:ring-primary rounded p-1 w-full text-xs focus:outline-none transition-colors text-foreground"
                      placeholder="Add notes..."
                    />
                  </td>

                  {/* Actions */}
                  <td className="p-2 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onTimeTrack(task)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors"
                        title="Track time"
                      >
                        <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditTask(task)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Full edit"
                      >
                        <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDuplicateTask(task)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-green-400 transition-colors"
                        title="Duplicate"
                      >
                        <Icon path="M8 7v12a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-8a2 2 0 00-2 2zM16 1h-8a4 4 0 00-4 4v12" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
