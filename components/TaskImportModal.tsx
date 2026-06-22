import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { createTask } from '../services/api/tasks';
import { getProfiles } from '../services/api/profiles';
import { Icon } from './ui/Icon';

interface TaskImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

interface ParsedRow {
  index: number;
  title: string;
  brand: string;
  show: string;
  deadlineRaw: string;
  materialWbd: boolean;
  materialPx: boolean;
  editorName: string;
  statusRaw: string;
  freigabelink: string;
  linkToMaterial: string;
  legalLine: string;
  formats: string[];
  isLikelyTask: boolean;
  selected: boolean;
}

export const TaskImportModal: React.FC<TaskImportModalProps> = ({ isOpen, onClose, projectId }) => {
  const queryClient = useQueryClient();
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [uniqueEditors, setUniqueEditors] = useState<string[]>([]);
  const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([]);
  
  // Mapping states
  const [editorMapping, setEditorMapping] = useState<Record<string, string>>({}); // CSV Editor Name -> Profile ID
  const [statusMapping, setStatusMapping] = useState<Record<string, string>>({}); // CSV Status -> TaskStatus ('todo', 'in_progress', 'review', 'done')
  
  // Import execution states
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [totalToImport, setTotalToImport] = useState(0);

  // Fetch profiles for mapping dropdown
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: getProfiles,
    enabled: isOpen,
  });

  // Reset state on close
  const handleClose = () => {
    setCsvText('');
    setParsedRows([]);
    setUniqueEditors([]);
    setUniqueStatuses([]);
    setEditorMapping({});
    setStatusMapping({});
    setIsImporting(false);
    setImportProgress(0);
    setTotalToImport(0);
    onClose();
  };

  // Helper: Client-side CSV Parser
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentVal = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal.trim());
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentVal.trim());
        lines.push(row);
        row = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (currentVal || row.length > 0) {
      row.push(currentVal.trim());
      lines.push(row);
    }
    return lines;
  };

  // Process file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      processCSVContent(text);
    };
    reader.readAsText(file, 'utf-8');
  };

  const processCSVContent = (text: string) => {
    try {
      const rawLines = parseCSV(text);
      if (rawLines.length < 2) {
        toast.error('CSV file appears to be empty or lacks header.');
        return;
      }

      const headers = rawLines[0].map(h => h.trim().toLowerCase());
      
      // Dynamic mapping of CSV headers to indexes
      const getIndex = (names: string[]) => headers.findIndex(h => names.includes(h));
      
      const idxTitle = getIndex(['item name', 'item', 'name', 'titel']);
      const idxBrand = getIndex(['brand', 'marke']);
      const idxShow = getIndex(['show', 'sendung']);
      const idxDeadline = getIndex(['deadline', 'fälligkeit']);
      const idxMaterialWbd = getIndex(['material wbd', 'material_wbd']);
      const idxMaterialPx = getIndex(['material px', 'material_px']);
      const idxEditor = getIndex(['editor*in', 'editor', 'cutter', 'bearbeiter']);
      const idxStatus = getIndex(['status']);
      const idxFreigabelink = getIndex(['freigabelink', 'freigabe']);
      const idxLinkToMaterial = getIndex(['link to material', 'material link', 'material_link']);
      const idxLegalLine = getIndex(['legal line', 'legal_line', 'copyright']);
      const idxFormats = getIndex(['formats', 'formate']);

      if (idxTitle === -1) {
        toast.error('Required header "Item name" not found in CSV.');
        return;
      }

      const tempRows: ParsedRow[] = [];
      const editorsSet = new Set<string>();
      const statusesSet = new Set<string>();

      for (let i = 1; i < rawLines.length; i++) {
        const line = rawLines[i];
        if (line.length <= 1 || !line[idxTitle]) continue; // Skip blank lines

        const title = line[idxTitle] || '';
        const brand = idxBrand !== -1 ? line[idxBrand] || '' : '';
        const show = idxShow !== -1 ? line[idxShow] || '' : '';
        const deadlineRaw = idxDeadline !== -1 ? line[idxDeadline] || '' : '';
        
        // Parse checkboxes
        const materialWbd = idxMaterialWbd !== -1 ? (line[idxMaterialWbd] === 'checked' || line[idxMaterialWbd] === 'true' || line[idxMaterialWbd] === '1') : false;
        const materialPx = idxMaterialPx !== -1 ? (line[idxMaterialPx] === 'checked' || line[idxMaterialPx] === 'true' || line[idxMaterialPx] === '1') : false;
        
        const editorName = idxEditor !== -1 ? line[idxEditor] || '' : '';
        const statusRaw = idxStatus !== -1 ? line[idxStatus] || '' : '';
        const freigabelink = idxFreigabelink !== -1 ? line[idxFreigabelink] || '' : '';
        const linkToMaterial = idxLinkToMaterial !== -1 ? line[idxLinkToMaterial] || '' : '';
        const legalLine = idxLegalLine !== -1 ? line[idxLegalLine] || '' : '';
        
        // Parse formats array
        const formatsRaw = idxFormats !== -1 ? line[idxFormats] || '' : '';
        const formats = formatsRaw ? formatsRaw.split(',').map(f => f.trim()) : [];

        if (editorName.trim()) editorsSet.add(editorName.trim());
        if (statusRaw.trim()) statusesSet.add(statusRaw.trim());

        // Check if this row is likely a concrete task vs a guideline instruction
        const isInstruction = 
          title.includes('WORKFLOW') || 
          title.includes('wichtige Anmerkungen') || 
          title.includes('Footage Restrictions') || 
          title.includes('Special Content') || 
          title.includes('Clips pro Episode') || 
          title.includes('Social Performance') || 
          title.includes('Prio-Format') || 
          title.includes('Meme Still Vorlage') || 
          title.includes('Nicht alle Videos') || 
          title.startsWith('🌸') || 
          title.startsWith('🔥') || 
          title.startsWith('💎') || 
          title.startsWith('🍄') || 
          !brand;

        tempRows.push({
          index: i,
          title,
          brand,
          show,
          deadlineRaw,
          materialWbd,
          materialPx,
          editorName,
          statusRaw,
          freigabelink,
          linkToMaterial,
          legalLine,
          formats,
          isLikelyTask: !isInstruction,
          selected: !isInstruction // Selected by default if it's likely a task
        });
      }

      setParsedRows(tempRows);
      
      const uniqueEds = Array.from(editorsSet);
      setUniqueEditors(uniqueEds);
      
      const uniqueStats = Array.from(statusesSet);
      setUniqueStatuses(uniqueStats);

      // Setup initial smart mappings
      const initialEditorsMap: Record<string, string> = {};
      uniqueEds.forEach(ed => {
        // Try to find matching profile by name
        const match = profiles.find(p => p.full_name?.toLowerCase().includes(ed.toLowerCase()) || ed.toLowerCase().includes(p.full_name?.toLowerCase() || ''));
        initialEditorsMap[ed] = match ? match.id : '';
      });
      setEditorMapping(initialEditorsMap);

      const initialStatusMap: Record<string, string> = {};
      uniqueStats.forEach(status => {
        const s = status.toLowerCase();
        if (s.includes('gepostet') || s.includes('posted')) {
          initialStatusMap[status] = 'done';
        } else if (s.includes('ausgeliefert') || s.includes('fertig zum posten') || s.includes('geliefert') || s.includes('ready')) {
          initialStatusMap[status] = 'review';
        } else if (s.includes('in arbeit') || s.includes('progress') || s.includes('schneiden')) {
          initialStatusMap[status] = 'in_progress';
        } else {
          initialStatusMap[status] = 'todo';
        }
      });
      setStatusMapping(initialStatusMap);

    } catch (error) {
      console.error(error);
      toast.error('Failed to parse CSV file. Make sure it is formatted correctly.');
    }
  };

  // Helper to parse European/German and ISO date strings
  const parseDateString = (dateStr: string): string | null => {
    if (!dateStr) return null;
    try {
      // Check for German/European date format DD.MM.YYYY
      const deDateMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (deDateMatch) {
        const [_, day, month, year] = deDateMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString();
      }
      
      // Standard Date parsing for ISO/US formats
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    } catch (e) {
      // Fallback
    }
    return null;
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setParsedRows(parsedRows.map(row => ({ ...row, selected: checked })));
  };

  const handleImport = async () => {
    const selectedRows = parsedRows.filter(r => r.selected);
    if (selectedRows.length === 0) {
      toast.warn('No tasks selected for import.');
      return;
    }

    setIsImporting(true);
    setTotalToImport(selectedRows.length);
    setImportProgress(0);

    let successes = 0;
    let failures = 0;

    for (const row of selectedRows) {
      try {
        const mappedAssigneeId = editorMapping[row.editorName] || null;
        const mappedStatus = statusMapping[row.statusRaw] || 'todo';
        const parsedDueDate = parseDateString(row.deadlineRaw);

        // Call createTask API
        await createTask({
          title: row.title,
          description: row.legalLine ? `Legal Line: ${row.legalLine}` : '',
          project_id: projectId,
          status: mappedStatus as any,
          assignee_ids: mappedAssigneeId ? [mappedAssigneeId] : [],
          due_date: parsedDueDate,
          brand: row.brand || null,
          show: row.show || null,
          formats: row.formats,
          legal_line: row.legalLine || null,
          freigabelink: row.freigabelink || null,
          link_to_material: row.linkToMaterial || null,
          material_wbd: row.materialWbd,
          material_px: row.materialPx,
          is_visible_to_client: false
        });

        successes++;
      } catch (err) {
        console.error('Failed to import row: ', row.title, err);
        failures++;
      }
      setImportProgress(prev => prev + 1);
    }

    setIsImporting(false);
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    
    if (failures === 0) {
      toast.success(`Successfully imported all ${successes} tasks!`);
      handleClose();
    } else {
      toast.warning(`Import complete with errors. Success: ${successes}, Failed: ${failures}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" className="w-6 h-6 text-primary" />
              Import Tasks from Airtable CSV
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Upload a CSV file containing social media asset requirements.</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isImporting}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
          >
            <Icon path="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {/* Step 1: File Upload */}
          {parsedRows.length === 0 && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-12 bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer relative group">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform mb-4">
                <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" className="w-10 h-10" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Click to browse or drag CSV file here</h3>
              <p className="text-xs text-muted-foreground mt-1.5">Supports UTF-8 comma-separated CSV tables from Airtable</p>
            </div>
          )}

          {parsedRows.length > 0 && !isImporting && (
            <div className="space-y-6">
              {/* Step 2: Mapping Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Editor Mapping */}
                <div className="border border-border rounded-xl p-4 bg-muted/15 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Map Editors / Assignees ({uniqueEditors.length})
                  </h3>
                  <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
                    {uniqueEditors.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No editors found in CSV.</p>
                    ) : (
                      uniqueEditors.map(edName => (
                        <div key={edName} className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-medium text-muted-foreground truncate w-1/3" title={edName}>{edName}</span>
                          <select
                            value={editorMapping[edName] || ''}
                            onChange={(e) => setEditorMapping({ ...editorMapping, [edName]: e.target.value })}
                            className="w-2/3 px-2 py-1 bg-background border border-input rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="">-- Leave Unassigned --</option>
                            {profiles.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.full_name || p.email}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Status Mapping */}
                <div className="border border-border rounded-xl p-4 bg-muted/15 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    Map Task Statuses ({uniqueStatuses.length})
                  </h3>
                  <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
                    {uniqueStatuses.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No status field detected.</p>
                    ) : (
                      uniqueStatuses.map(statusName => (
                        <div key={statusName} className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-medium text-muted-foreground truncate w-1/3" title={statusName || 'Empty'}>{statusName || 'Empty'}</span>
                          <select
                            value={statusMapping[statusName] || 'todo'}
                            onChange={(e) => setStatusMapping({ ...statusMapping, [statusName]: e.target.value })}
                            className="w-2/3 px-2 py-1 bg-background border border-input rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done / Gepostet</option>
                          </select>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3: Elements Preview */}
              <div className="border border-border rounded-xl overflow-hidden flex flex-col">
                <div className="bg-muted/30 px-4 py-3 border-b border-border flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-foreground">Select Elements to Import ({parsedRows.filter(r => r.selected).length} selected)</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setParsedRows(parsedRows.map(r => ({ ...r, selected: r.isLikelyTask })))}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Reset to Smart Filter
                    </button>
                  </div>
                </div>
                <div className="max-h-[300px] overflow-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/15 border-b border-border sticky top-0 bg-card z-10">
                        <th className="p-3 w-10">
                          <input
                            type="checkbox"
                            checked={parsedRows.length > 0 && parsedRows.every(r => r.selected)}
                            onChange={(e) => handleToggleSelectAll(e.target.checked)}
                            className="rounded"
                          />
                        </th>
                        <th className="p-3">Item Name</th>
                        <th className="p-3">Brand</th>
                        <th className="p-3">Show</th>
                        <th className="p-3">Deadline</th>
                        <th className="p-3">Material (WBD / PX)</th>
                        <th className="p-3">Editor</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`border-b border-border/40 hover:bg-muted/5 transition-colors ${
                            !row.isLikelyTask ? 'opacity-55 bg-muted/5' : ''
                          }`}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={(e) => {
                                const newRows = [...parsedRows];
                                newRows[idx].selected = e.target.checked;
                                setParsedRows(newRows);
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="p-3 font-medium truncate max-w-[200px]" title={row.title}>
                            {!row.isLikelyTask && <span className="text-[10px] px-1 bg-yellow-500/20 text-yellow-600 rounded mr-1">GUIDELINE</span>}
                            {row.title}
                          </td>
                          <td className="p-3 text-muted-foreground">{row.brand || '-'}</td>
                          <td className="p-3 text-muted-foreground truncate max-w-[150px]" title={row.show}>{row.show || '-'}</td>
                          <td className="p-3 text-muted-foreground">{row.deadlineRaw || '-'}</td>
                          <td className="p-3 text-muted-foreground">
                            <div className="flex gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${row.materialWbd ? 'bg-blue-500/20 text-blue-400' : 'bg-muted text-muted-foreground'}`}>
                                WBD
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${row.materialPx ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                                PX
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground truncate max-w-[100px]" title={row.editorName}>{row.editorName || '-'}</td>
                          <td className="p-3 text-muted-foreground truncate max-w-[100px]" title={row.statusRaw}>{row.statusRaw || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Progress / Loading Panel during Import */}
          {isImporting && (
            <div className="flex flex-col items-center justify-center p-12 space-y-6">
              <div className="relative w-24 h-24">
                {/* Circular spinner */}
                <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Importing Tasks...</h3>
                <p className="text-sm text-muted-foreground">
                  Processed {importProgress} of {totalToImport} tasks ({Math.round((importProgress / totalToImport) * 100)}%)
                </p>
              </div>
              {/* Progress bar */}
              <div className="w-full max-w-md bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-350"
                  style={{ width: `${(importProgress / totalToImport) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/10 flex justify-between items-center">
          <button
            onClick={() => {
              if (parsedRows.length > 0) {
                setParsedRows([]);
              } else {
                handleClose();
              }
            }}
            disabled={isImporting}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded-lg"
          >
            {parsedRows.length > 0 ? 'Back / Clear' : 'Cancel'}
          </button>
          {parsedRows.length > 0 && !isImporting && (
            <button
              onClick={handleImport}
              className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-primary/20"
            >
              <Icon path="M5 13l4 4L19 7" className="w-4 h-4" />
              Import {parsedRows.filter(r => r.selected).length} Tasks
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
