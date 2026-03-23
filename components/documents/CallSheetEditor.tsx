import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getDocumentDetails,
  updateDocumentTitle,
  updateCallSheetData,
  createCallSheetSchedule,
  updateCallSheetSchedule,
  deleteCallSheetSchedule,
  createCallSheetContact,
  updateCallSheetContact,
  deleteCallSheetContact,
  AgencyDocument,
  CallSheetData,
  CallSheetSchedule,
  CallSheetContact
} from '../../services/api/documents';
import { Icon } from '../ui/Icon';
import { toast } from 'react-toastify';

interface CallSheetEditorProps {
  documentId: string;
  onBack: () => void;
  isAdminOrPJM: boolean;
}

export const CallSheetEditor: React.FC<CallSheetEditorProps> = ({ documentId, onBack, isAdminOrPJM }) => {
  const queryClient = useQueryClient();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  const { data: doc, isLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocumentDetails(documentId),
  });

  useEffect(() => {
    if (doc?.title) {
      setTitleInput(doc.title);
    }
  }, [doc?.title]);

  const updateTitleMutation = useMutation({
    mutationFn: (newTitle: string) => updateDocumentTitle(documentId, newTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents', doc?.project_id] });
      setIsEditingTitle(false);
      toast.success('Title updated');
    }
  });

  const updateDataMutation = useMutation({
    mutationFn: (data: Partial<CallSheetData>) => updateCallSheetData(documentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    }
  });

  const createScheduleMutation = useMutation({
    mutationFn: (data: Partial<CallSheetSchedule>) => createCallSheetSchedule(documentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    }
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<CallSheetSchedule> }) => updateCallSheetSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: deleteCallSheetSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    }
  });

  const createContactMutation = useMutation({
    mutationFn: (data: Partial<CallSheetContact>) => createCallSheetContact(documentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    }
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<CallSheetContact> }) => updateCallSheetContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    }
  });

  const deleteContactMutation = useMutation({
    mutationFn: deleteCallSheetContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    }
  });


  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim() !== doc?.title) {
      updateTitleMutation.mutate(titleInput);
    } else {
      setIsEditingTitle(false);
    }
  };

  const handleDataChange = (field: keyof CallSheetData, value: string) => {
    updateDataMutation.mutate({ [field]: value });
  };

  const printDocument = () => {
    window.print();
  };

  if (isLoading) return <div className="p-6">Loading Call Sheet...</div>;
  if (!doc) return <div className="p-6 text-red-500">Document not found</div>;

  const data: Partial<CallSheetData> = doc.data || {};
  const schedule: CallSheetSchedule[] = doc.schedule || [];
  const contacts: CallSheetContact[] = doc.contacts || [];

  return (
    <div className="flex flex-col h-full bg-background relative print:bg-white print:text-black">
      {/* Header bar - Hidden in Print */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
            <Icon path="M10 19l-7-7m0 0l7-7m-7 7h18" className="w-5 h-5" />
          </button>
          
          {isEditingTitle && isAdminOrPJM ? (
            <form onSubmit={handleTitleSubmit} className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="bg-muted border border-border rounded px-3 py-1 text-lg font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                onBlur={handleTitleSubmit}
              />
            </form>
          ) : (
            <h1 
              className="text-2xl font-bold text-foreground flex items-center gap-2 cursor-pointer group"
              onClick={() => isAdminOrPJM && setIsEditingTitle(true)}
            >
              {doc.title}
              {isAdminOrPJM && <Icon path="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
            </h1>
          )}
        </div>
        <div className="flex gap-2">
           <button 
             className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm"
             onClick={printDocument}
           >
             <Icon path="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" className="w-4 h-4" />
             Export PDF / Print
           </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="flex-1 overflow-auto p-8 print:p-0">
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl shadow-sm p-10 print:shadow-none print:border-none print:w-full print:max-w-none print:p-0">
           
           {/* Brand Header */}
           <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-8">
             <div>
               <h1 className="text-4xl font-black tracking-tight text-foreground uppercase print:text-black">Drehdispo</h1>
               <div className="mt-2 text-xl font-medium text-muted-foreground print:text-gray-800">{doc.title}</div>
               <div className="mt-1 text-sm text-muted-foreground">Erstellt von: {doc.author_name} ({new Date(doc.created_at).toLocaleDateString()})</div>
             </div>
             <div className="text-right">
               {/* Pixelschickeria Logo Header */}
               <img src="/Pixelschickeria_Logo.png" alt="Pixelschickeria" className="h-10 ml-auto mb-2 opacity-90 hidden dark:block print:hidden" />
               <img src="/Pixelschickeria_Logo_Dark.png" alt="Pixelschickeria" className="h-10 ml-auto mb-2 opacity-90 dark:hidden print:block" />
               <p className="text-xs font-medium text-foreground print:text-black">Pixelschickeria GmbH</p>
               <p className="text-xs text-muted-foreground print:text-gray-600">hello@pixelschickeria.de</p>
             </div>
           </div>

           {/* Grid Info */}
           <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 print:text-gray-500">Location</label>
                  <input 
                    type="text" 
                    defaultValue={data.location_name || ''} 
                    onBlur={(e) => handleDataChange('location_name', e.target.value)}
                    placeholder="Studio 1..."
                    className="w-full bg-transparent font-medium text-lg border-b border-border focus:border-primary focus:outline-none pb-1 print:border-none print:p-0"
                    disabled={!isAdminOrPJM}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 print:text-gray-500">Adresse</label>
                  <textarea 
                    defaultValue={data.location_address || ''} 
                    onBlur={(e) => handleDataChange('location_address', e.target.value)}
                    placeholder="Musterstraße 1..."
                    className="w-full bg-transparent text-sm border border-transparent hover:border-border focus:border-primary rounded resize-none h-16 p-1 focus:outline-none print:border-none print:p-0"
                    disabled={!isAdminOrPJM}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1 print:text-gray-500">
                    <Icon path="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" className="w-3 h-3" /> Wetter
                  </label>
                  <input 
                    type="text" 
                    defaultValue={data.weather_info || ''} 
                    onBlur={(e) => handleDataChange('weather_info', e.target.value)}
                    placeholder="Sonnig, 20°C"
                    className="w-full bg-transparent text-sm border border-transparent hover:border-border focus:border-primary rounded p-1 focus:outline-none print:border-none print:p-0"
                    disabled={!isAdminOrPJM}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1 text-red-400 print:text-red-600">
                    <Icon path="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" className="w-3 h-3" /> Nächstes Krankenhaus
                  </label>
                  <textarea 
                    defaultValue={data.hospital_info || ''} 
                    onBlur={(e) => handleDataChange('hospital_info', e.target.value)}
                    placeholder="Krankenhaus X..."
                    className="w-full bg-transparent text-sm border border-transparent hover:border-border focus:border-primary rounded resize-none h-10 p-1 focus:outline-none print:border-none print:p-0"
                    disabled={!isAdminOrPJM}
                  />
                </div>
              </div>
           </div>

           {/* Schedule Table */}
           <div className="mb-12">
             <div className="flex justify-between items-end mb-4 border-b border-border pb-2">
               <h2 className="text-xl font-bold text-foreground print:text-black">Zeitplan</h2>
               {isAdminOrPJM && (
                 <button onClick={() => createScheduleMutation.mutate({ time_start: '08:00', description: 'Neuer Punkt' })} className="text-primary text-sm font-medium hover:underline print:hidden">
                   + Termin hinzufügen
                 </button>
               )}
             </div>
             <table className="w-full text-left text-sm">
               <thead className="text-xs uppercase text-muted-foreground print:text-gray-500">
                 <tr>
                   <th className="py-2 w-24">Zeit</th>
                   <th className="py-2">Was passiert?</th>
                   <th className="py-2 w-48">Wer?</th>
                   <th className="py-2 w-10 print:hidden"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border/50">
                 {schedule.map(item => (
                   <tr key={item.id} className="group">
                     <td className="py-2 align-top font-mono">
                       <input 
                         type="text" 
                         defaultValue={item.time_start || ''} 
                         onBlur={(e) => updateScheduleMutation.mutate({ id: item.id, data: { time_start: e.target.value } })}
                         className="w-16 bg-transparent border-none focus:ring-1 focus:ring-primary rounded p-1 print:p-0 font-bold"
                         disabled={!isAdminOrPJM}
                       />
                     </td>
                     <td className="py-2 align-top">
                       <textarea 
                         defaultValue={item.description || ''} 
                         onBlur={(e) => updateScheduleMutation.mutate({ id: item.id, data: { description: e.target.value } })}
                         className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded resize-none min-h-[40px] p-1 print:p-0"
                         disabled={!isAdminOrPJM}
                       />
                     </td>
                     <td className="py-2 align-top">
                       <input 
                         type="text" 
                         defaultValue={item.persons || ''} 
                         onBlur={(e) => updateScheduleMutation.mutate({ id: item.id, data: { persons: e.target.value } })}
                         className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded font-medium text-muted-foreground p-1 print:p-0"
                         disabled={!isAdminOrPJM}
                       />
                     </td>
                     <td className="py-2 text-right align-top print:hidden">
                       {isAdminOrPJM && (
                         <button onClick={() => deleteScheduleMutation.mutate(item.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                           <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
                         </button>
                       )}
                     </td>
                   </tr>
                 ))}
                 {schedule.length === 0 && (
                   <tr>
                     <td colSpan={4} className="py-4 text-muted-foreground italic">Keine Einträge.</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>

           {/* Contacts Table */}
           <div className="mb-8">
             <div className="flex justify-between items-end mb-4 border-b border-border pb-2">
               <h2 className="text-xl font-bold text-foreground print:text-black">Kontakte / Crew</h2>
               {isAdminOrPJM && (
                 <button onClick={() => createContactMutation.mutate({ name: 'Neuer Kontakt', role: 'Rolle', phone: '0123...' })} className="text-primary text-sm font-medium hover:underline print:hidden">
                   + Kontakt hinzufügen
                 </button>
               )}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
               {contacts.map(contact => (
                 <div key={contact.id} className="flex items-start justify-between border-b border-border/50 pb-2 group">
                   <div className="w-full mr-2">
                     <div className="flex gap-2 mb-1">
                       <input 
                         type="text" 
                         defaultValue={contact.name || ''} 
                         onBlur={(e) => updateContactMutation.mutate({ id: contact.id, data: { name: e.target.value } })}
                         className="font-bold bg-transparent focus:ring-1 focus:ring-primary rounded outline-none w-1/2 print:p-0"
                         disabled={!isAdminOrPJM}
                       />
                       <input 
                         type="text" 
                         defaultValue={contact.role || ''} 
                         onBlur={(e) => updateContactMutation.mutate({ id: contact.id, data: { role: e.target.value } })}
                         className="text-muted-foreground bg-transparent focus:ring-1 focus:ring-primary rounded outline-none w-1/2 text-right italic print:p-0"
                         disabled={!isAdminOrPJM}
                       />
                     </div>
                     <div className="flex gap-2">
                       <input 
                         type="text" 
                         defaultValue={contact.phone || ''} 
                         onBlur={(e) => updateContactMutation.mutate({ id: contact.id, data: { phone: e.target.value } })}
                         className="text-sm bg-transparent focus:ring-1 focus:ring-primary rounded outline-none w-1/2 print:p-0"
                         placeholder="Tel..."
                         disabled={!isAdminOrPJM}
                       />
                       <input 
                         type="text" 
                         defaultValue={contact.email || ''} 
                         onBlur={(e) => updateContactMutation.mutate({ id: contact.id, data: { email: e.target.value } })}
                         className="text-sm text-primary bg-transparent focus:ring-1 focus:ring-primary rounded outline-none w-1/2 text-right print:p-0"
                         placeholder="Email..."
                         disabled={!isAdminOrPJM}
                       />
                     </div>
                   </div>
                   {isAdminOrPJM && (
                     <button onClick={() => deleteContactMutation.mutate(contact.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 mt-1 print:hidden">
                       <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
                     </button>
                   )}
                 </div>
               ))}
             </div>
           </div>

           {/* General Notes */}
           <div>
             <h2 className="text-sm font-bold text-muted-foreground uppercase mb-2 print:text-gray-500">Allgemeine Notizen</h2>
             <textarea 
               defaultValue={data.general_notes || ''} 
               onBlur={(e) => handleDataChange('general_notes', e.target.value)}
               placeholder="Parkhinweise, Besonderheiten..."
               className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded p-2 focus:outline-none min-h-[100px] print:border-none print:p-0"
               disabled={!isAdminOrPJM}
             />
           </div>

        </div>
      </div>
    </div>
  );
};
