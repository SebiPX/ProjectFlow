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
import { LocationAutocomplete } from './LocationAutocomplete';

interface CallSheetEditorProps {
  documentId: string;
  pjmEmail: string;
  onBack: () => void;
  isAdminOrPJM: boolean;
}

export const CallSheetEditor: React.FC<CallSheetEditorProps> = ({ documentId, pjmEmail, onBack, isAdminOrPJM }) => {
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

  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  const fetchWeather = async (lat: string, lng: string, date: string) => {
    if (!lat || !lng || !date) {
      toast.error('Bitte erst eine Location (mit Autocomplete) auswählen und das Drehtag-Datum festlegen!');
      return;
    }
    setIsWeatherLoading(true);
    try {
      // Open-Meteo expects YYYY-MM-DD
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${date}&end_date=${date}`;
      const res = await fetch(url);
      const json = await res.json();
      
      if (json.daily && json.daily.time && json.daily.time.length > 0) {
        const tMax = json.daily.temperature_2m_max[0];
        const tMin = json.daily.temperature_2m_min[0];
        const code = json.daily.weathercode[0];

        const getWmoCodeText = (c: number) => {
          if (c === 0) return 'Sonnig/Klar';
          if (c === 1 || c === 2 || c === 3) return 'Heiter bis wolkig';
          if (c === 45 || c === 48) return 'Nebel';
          if (c >= 51 && c <= 55) return 'Nieselregen';
          if (c >= 61 && c <= 65) return 'Regen';
          if (c >= 71 && c <= 77) return 'Schnee';
          if (c >= 80 && c <= 82) return 'Schauer';
          if (c >= 95 && c <= 99) return 'Gewitter';
          return 'Gemixt';
        };

        const weatherDesc = getWmoCodeText(code);
        const forecastText = `${weatherDesc}, ${Math.round(tMin)}°C bis ${Math.round(tMax)}°C`;
        handleDataChange('weather_info', forecastText);
        toast.success('Wetter erfolgreich geladen!');
      } else {
        toast.info('Für dieses Datum (zu weit in der Zukunft?) sind keine Daten verfügbar.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Wetter abrufen fehlgeschlagen.');
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const [isHospitalLoading, setIsHospitalLoading] = useState(false);

  const fetchHospital = async (lat: string, lng: string) => {
    if (!lat || !lng) {
      toast.error('Bitte erst eine Location (mit Autocomplete) auswählen!');
      return;
    }
    setIsHospitalLoading(true);
    try {
      const boxSize = 0.2; // approx 22km radius bounding box
      const url = `https://nominatim.openstreetmap.org/search?amenity=hospital&format=json&addressdetails=1&viewbox=${parseFloat(lng)-boxSize},${parseFloat(lat)+boxSize},${parseFloat(lng)+boxSize},${parseFloat(lat)-boxSize}&bounded=1&limit=5`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data && data.length > 0) {
        let closest = data[0];
        let minD = Infinity;
        const R = 6371; // Erdradius km
        
        data.forEach((el: any) => {
          const elLat = parseFloat(el.lat);
          const elLng = parseFloat(el.lon);
          if (!elLat || !elLng) return;
          
          const dLat = (elLat - parseFloat(lat)) * Math.PI / 180;
          const dLon = (elLng - parseFloat(lng)) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(parseFloat(lat) * Math.PI / 180) * Math.cos(elLat * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2); 
          const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          
          if (d < minD) {
            minD = d;
            closest = el;
          }
        });

        const addr = closest.address || {};
        const name = closest.name || addr.amenity || addr.hospital || addr.clinic || 'Krankenhaus';
        const road = addr.road || addr.street || '';
        const house = addr.house_number || '';
        const postcode = addr.postcode || '';
        const city = addr.city || addr.town || addr.village || addr.suburb || '';
        
        let lines = [name];
        if (road || house) {
          lines.push(`${road} ${house}`.trim());
        }
        if (postcode || city) {
          lines.push(`${postcode} ${city}`.trim());
        }
        const info = lines.filter(Boolean).join('\n');
        
        handleDataChange('hospital_info', info);
        toast.success('Nächstes Krankenhaus gefunden!');
      } else {
        toast.info('Kein Krankenhaus im direkten Umkreis gefunden.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Krankenhaus-Suche fehlgeschlagen.');
    } finally {
      setIsHospitalLoading(false);
    }
  };

  const printDocument = () => {
    const originalTitle = document.title;
    document.title = doc?.title || 'Drehdispo';
    window.print();
    document.title = originalTitle;
  };

  if (isLoading) return <div className="p-6">Loading Call Sheet...</div>;
  if (!doc) return <div className="p-6 text-red-500">Document not found</div>;

  const data: Partial<CallSheetData> = doc.data || {};
  const schedule: CallSheetSchedule[] = doc.schedule || [];
  const contacts: CallSheetContact[] = doc.contacts || [];

  return (
    <div className="flex flex-col h-full bg-background relative print:bg-white print:text-black print:h-auto print:block">
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
      <div className="flex-1 overflow-auto p-8 print:p-0 print:overflow-visible print:h-auto print:block">
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl shadow-sm p-10 print:shadow-none print:border-none print:w-full print:max-w-none print:p-0">
           
           {/* Brand Header */}
           <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-8">
             <div>
               <h1 className="text-4xl font-black tracking-tight text-foreground uppercase print:text-black">Drehdispo</h1>
               <div className="mt-2 text-xl font-medium text-muted-foreground print:text-gray-800">{doc.title}</div>
               <div className="mt-2 text-sm text-foreground flex items-center gap-2">
                 <span className="font-bold uppercase text-muted-foreground">Drehtag:</span>
                 <input 
                    type="date"
                    value={data.shoot_date || ''}
                    onChange={(e) => handleDataChange('shoot_date', e.target.value)}
                    className="bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none print:border-none uppercase"
                    disabled={!isAdminOrPJM}
                 />
               </div>
             </div>
             <div className="text-right">
               {/* Pixelschickeria Logo Header */}
               <img src="/logos/px-alpha.png" alt="Pixelschickeria" className="h-10 ml-auto mb-2 opacity-90 hidden dark:block print:hidden" />
               <img src="/logos/px-black.png" alt="Pixelschickeria" className="h-10 ml-auto mb-2 opacity-90 dark:hidden print:block" />
               <p className="text-xs font-medium text-foreground print:text-black">Pixelschickeria GmbH</p>
               <p className="text-xs text-muted-foreground print:text-gray-600">{pjmEmail}</p>
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
                  <LocationAutocomplete 
                    value={data.location_address || ''} 
                    onChange={(val) => handleDataChange('location_address', val)}
                    onSelectCallback={(lat, lon, address) => {
                      updateDataMutation.mutate({
                        location_address: address,
                        location_lat: lat,
                        location_lng: lon
                      });
                    }}
                    disabled={!isAdminOrPJM}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-muted-foreground uppercase flex items-center gap-1 print:text-gray-500">
                      <Icon path="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" className="w-3 h-3" /> Wetter
                    </label>
                    {isAdminOrPJM && (
                      <button 
                        onClick={() => fetchWeather(data.location_lat as string, data.location_lng as string, data.shoot_date as string)}
                        className={`text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 px-2 rounded print:hidden transition-colors ${
                          (!data.location_lat || !data.shoot_date || isWeatherLoading) ? 'opacity-50 cursor-pointer' : ''
                        }`}
                        title="Benötigt Datum & Adresse (Autocomplete)"
                      >
                        {isWeatherLoading ? 'Lade...' : 'Auto-Fill'}
                      </button>
                    )}
                  </div>
                  <input 
                    key={`weather-${data.weather_info}`} // Forces remount with new default value when updated
                    type="text" 
                    defaultValue={data.weather_info || ''} 
                    onBlur={(e) => {
                      if (e.target.value !== data.weather_info) {
                        handleDataChange('weather_info', e.target.value);
                      }
                    }}
                    placeholder={data.location_lat && data.shoot_date ? "Sonnig, 20°C" : "Sonnig, 20°C"}
                    className="w-full bg-transparent text-sm border border-transparent hover:border-border focus:border-primary rounded p-1 focus:outline-none print:border-none print:p-0"
                    disabled={!isAdminOrPJM}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-muted-foreground uppercase flex items-center gap-1 text-red-400 print:text-red-600">
                      <Icon path="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" className="w-3 h-3" /> Nächstes Krankenhaus
                    </label>
                    {isAdminOrPJM && (
                      <button 
                        onClick={() => fetchHospital(data.location_lat as string, data.location_lng as string)}
                        className={`text-[10px] font-bold bg-red-400/10 text-red-400 hover:bg-red-400/20 px-2 rounded print:hidden transition-colors ${
                          (!data.location_lat || isHospitalLoading) ? 'opacity-50 cursor-pointer' : ''
                        }`}
                        title="Sucht das nächste Krankenhaus via Koordinaten"
                      >
                        {isHospitalLoading ? 'Suche...' : 'Auto-Fill'}
                      </button>
                    )}
                  </div>
                  <textarea 
                    key={`hospital-${data.hospital_info}`}
                    defaultValue={data.hospital_info || ''} 
                    onBlur={(e) => {
                      if (e.target.value !== data.hospital_info) {
                        handleDataChange('hospital_info', e.target.value);
                      }
                    }}
                    placeholder={data.location_lat ? "Auto-Fill klicken für Krankenhaus..." : "Krankenhaus X... (erst Adresse setzen)"}
                    className="w-full bg-transparent text-sm border border-transparent hover:border-border focus:border-primary rounded resize-none p-1 focus:outline-none print:border-none print:p-0"
                    rows={3}
                    disabled={!isAdminOrPJM}
                  />
                </div>
              </div>
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
             <div className="grid grid-cols-2 gap-x-8 gap-y-4">
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
           <div className="mb-12 print:break-inside-avoid">
             <h2 className="text-sm font-bold text-muted-foreground uppercase mb-2 print:text-gray-500">ALLGEMEINE NOTIZEN</h2>
             <textarea 
               defaultValue={data.general_notes || ''} 
               onBlur={(e) => handleDataChange('general_notes', e.target.value)}
               placeholder="Parkhinweise, Besonderheiten..."
               className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded p-2 focus:outline-none min-h-[100px] print:border-none print:p-0"
               disabled={!isAdminOrPJM}
             />
           </div>

           {/* Drehplan Table */}
           <div className="mb-12 print:break-inside-auto">
             <table className="w-full text-left text-sm print:table">
               <thead className="print:table-header-group">
                 <tr>
                   <td colSpan={7} className="pb-4">
                     <div className="flex justify-between items-end border-b border-border pb-2">
                       <h2 className="text-xl font-bold text-foreground print:text-black uppercase">DREHPLAN</h2>
                       {isAdminOrPJM && (
                         <button onClick={() => {
                           let nextTime = '08:00';
                           if (schedule.length > 0) {
                             const lastItem = schedule[schedule.length - 1];
                             if (lastItem.time_start) {
                               const duration = lastItem.duration_minutes || 0;
                               const parts = lastItem.time_start.split(':');
                               if (parts.length === 2) {
                                 const hours = parseInt(parts[0], 10);
                                 const minutes = parseInt(parts[1], 10);
                                 if (!isNaN(hours) && !isNaN(minutes)) {
                                   const totalMinutes = hours * 60 + minutes + duration;
                                   const nextHours = Math.floor(totalMinutes / 60) % 24;
                                   const nextMins = totalMinutes % 60;
                                   nextTime = `${nextHours.toString().padStart(2, '0')}:${nextMins.toString().padStart(2, '0')}`;
                                 }
                               }
                             }
                           }
                           createScheduleMutation.mutate({ time_start: nextTime, scene_name: 'Neue Szene' });
                         }} className="text-primary text-sm font-medium hover:underline print:hidden">
                           + Szene hinzufügen
                         </button>
                       )}
                     </div>
                   </td>
                 </tr>
                 <tr className="text-xs uppercase text-muted-foreground print:text-gray-500">
                   <th className="py-2 w-12 text-center">Done</th>
                   <th className="py-2 w-20">Bild</th>
                   <th className="py-2 w-20">Zeit</th>
                   <th className="py-2">Szene</th>
                   <th className="py-2 w-20">Nr.</th>
                   <th className="py-2 w-24">Dauer (Min)</th>
                   <th className="py-2 w-10 print:hidden"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border/50 print:table-row-group">
                 {schedule.map(item => (
                   <tr key={item.id} className="group print:break-inside-avoid">
                     <td className="py-2 align-middle text-center">
                        <input 
                          type="checkbox"
                          defaultChecked={item.is_done}
                          onChange={(e) => updateScheduleMutation.mutate({ id: item.id, data: { is_done: e.target.checked } })}
                          disabled={!isAdminOrPJM}
                          className="w-4 h-4 accent-primary cursor-pointer"
                        />
                     </td>
                     <td className="py-2 align-middle">
                        <div className="relative group/img inline-block">
                          {item.image_url ? (
                            <img src={item.image_url} alt="Scene" className="w-12 h-12 object-cover rounded border border-border" />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-[10px] text-muted-foreground border border-dashed border-border">Bild</div>
                          )}
                          {isAdminOrPJM && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center rounded transition-opacity">
                              <button 
                                onClick={() => {
                                  const url = prompt('Bild URL eingeben:', item.image_url || '');
                                  if (url !== null) updateScheduleMutation.mutate({ id: item.id, data: { image_url: url } });
                                }}
                                className="text-white text-[10px] bg-primary px-2 py-1 rounded"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                     </td>
                     <td className="py-2 align-middle font-mono">
                       <input 
                         type="text" 
                         defaultValue={item.time_start || ''} 
                         onBlur={(e) => updateScheduleMutation.mutate({ id: item.id, data: { time_start: e.target.value } })}
                         className="w-16 bg-transparent border-none focus:ring-1 focus:ring-primary rounded p-1 print:p-0 font-bold"
                         disabled={!isAdminOrPJM}
                       />
                     </td>
                     <td className="py-2 align-middle">
                       <input 
                         type="text"
                         defaultValue={item.scene_name || ''} 
                         onBlur={(e) => updateScheduleMutation.mutate({ id: item.id, data: { scene_name: e.target.value } })}
                         className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded p-1 print:p-0 font-medium"
                         placeholder="Szenenname..."
                         disabled={!isAdminOrPJM}
                       />
                     </td>
                     <td className="py-2 align-middle">
                       <input 
                         type="text" 
                         defaultValue={item.scene_number || ''} 
                         onBlur={(e) => updateScheduleMutation.mutate({ id: item.id, data: { scene_number: e.target.value } })}
                         className="w-16 bg-transparent border-none focus:ring-1 focus:ring-primary rounded text-muted-foreground p-1 print:p-0"
                         placeholder="Nr..."
                         disabled={!isAdminOrPJM}
                       />
                     </td>
                     <td className="py-2 align-middle">
                       <input 
                         type="number" 
                         defaultValue={item.duration_minutes || ''} 
                         onBlur={(e) => updateScheduleMutation.mutate({ id: item.id, data: { duration_minutes: parseInt(e.target.value) || 0 } })}
                         className="w-16 bg-transparent border-none focus:ring-1 focus:ring-primary rounded text-muted-foreground p-1 print:p-0 text-center"
                         placeholder="Min"
                         disabled={!isAdminOrPJM}
                       />
                     </td>
                     <td className="py-2 text-right align-middle print:hidden">
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
                     <td colSpan={7} className="py-4 text-muted-foreground italic text-center">Keine Szenen geplant.</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>

           {/* Anfahrt & Parken */}
           <div className="mb-12 print:break-inside-avoid">
             <div className="flex justify-between items-end mb-4 border-b border-border pb-2">
               <h2 className="text-xl font-bold text-foreground print:text-black">ANFAHRT & PARKEN</h2>
             </div>
             {data.location_address ? (
               <div className="w-full h-96 bg-muted rounded border border-border overflow-hidden print:h-[450px] grayscale relative">
                 <iframe 
                   className="absolute top-[calc(-60px)] left-[calc(-20px)] w-[calc(100%+40px)] h-[calc(100%+80px)]"
                   frameBorder="0" style={{border:0}} 
                   src={`https://www.google.com/maps?q=${encodeURIComponent(data.location_address)}&z=16&output=embed`} 
                   allowFullScreen>
                 </iframe>
               </div>
             ) : (
               <p className="text-muted-foreground italic">Bitte Adresse oben eingeben, um die Karte zu laden.</p>
             )}
           </div>

           {/* Hinweise */}
           <div className="print:break-inside-avoid">
             <h2 className="text-sm font-bold text-muted-foreground uppercase mb-2 print:text-gray-500">HINWEISE</h2>
             <textarea 
               defaultValue={data.directions_notes || ''} 
               onBlur={(e) => handleDataChange('directions_notes', e.target.value)}
               placeholder="Hinweise zur Anfahrt, Parkmöglichkeiten..."
               className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded p-2 focus:outline-none min-h-[100px] print:border-none print:p-0"
               disabled={!isAdminOrPJM}
             />
           </div>

        </div>
      </div>
    </div>
  );
};
