import sys
import re

filepath = "d:/PX TOOLS/APPs/PX-Flow/components/documents/CallSheetEditor.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Define the markers
m_contacts = "           {/* Contacts Tables */}"
m_notes = "           {/* General Notes and Catering */}"
m_drehplan = "           {/* Drehplan Table */}"
m_grid = "           {/* Grid Info */}"
m_maps = "           {/* Anfahrt & Parken */}"
m_hinweise = "           {/* Hinweise */}"
m_end = "        </div>\n      </div>\n    </div>\n  );\n};\n"

# Split the content
pre_content = content.split(m_contacts)[0]

# Contacts block spans until notes block
contacts_block = m_contacts + content.split(m_contacts)[1].split(m_notes)[0]

# Notes block spans until drehplan block
notes_block = m_notes + content.split(m_notes)[1].split(m_drehplan)[0]

# Drehplan block spans until grid block
drehplan_block = m_drehplan + content.split(m_drehplan)[1].split(m_grid)[0]

# Grid block spans until maps block
grid_block = m_grid + content.split(m_grid)[1].split(m_maps)[0]

# Maps block spans until hinweise block
maps_block = m_maps + content.split(m_maps)[1].split(m_hinweise)[0]

# Hinweise block spans until end
hinweise_block = m_hinweise + content.split(m_hinweise)[1].split(m_end)[0]

post_content = m_end + content.split(m_end)[1] if len(content.split(m_end)) > 1 else m_end

def create_contact_section(cat_id, title):
    return f"""
           {{/* {title} Contacts */}}
           {{(() => {{
             const catContacts = contacts.filter(c => (c.category || 'crew') === '{cat_id}');
             if (!isAdminOrPJM && catContacts.length === 0) return null;
             return (
               <div className="mb-8 print:break-inside-avoid">
                 <div className="flex justify-between items-end mb-4 border-b border-border pb-2">
                   <h2 className="text-lg font-bold text-foreground print:text-black uppercase">{title}</h2>
                   {{isAdminOrPJM && (
                     <button onClick={{() => createContactMutation.mutate({{ name: 'Neuer Kontakt', role: 'Rolle', category: '{cat_id}' as any, phone: '' }})}} className="text-primary text-sm font-medium hover:underline print:hidden">
                       + Hinzufügen
                     </button>
                   )}}
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                   {{catContacts.map(contact => (
                     <div key={{contact.id}} className="flex items-start justify-between border-b border-border/50 pb-2 group print:break-inside-avoid">
                       <div className="w-full mr-2">
                         <div className="flex gap-2 mb-1">
                           <ContactAutocomplete
                             value={{contact.name || ''}}
                             onChange={{(newName) => updateContactMutation.mutate({{ id: contact.id, data: {{ name: newName }} }})}}
                             onSelectCallback={{(data) => updateContactMutation.mutate({{ id: contact.id, data }})}}
                             profiles={{teamProfiles}}
                             freelancers={{freelancers}}
                             clientContacts={{clientContacts}}
                             disabled={{!isAdminOrPJM}}
                           />
                           <input 
                             type="text" 
                             defaultValue={{contact.role || ''}} 
                             onBlur={{(e) => updateContactMutation.mutate({{ id: contact.id, data: {{ role: e.target.value }} }})}}
                             className="text-muted-foreground bg-transparent focus:ring-1 focus:ring-primary rounded outline-none w-1/2 text-right italic print:p-0"
                             placeholder="Rolle..."
                             disabled={{!isAdminOrPJM}}
                           />
                         </div>
                         <div className="flex gap-2">
                           <input 
                             type="text" 
                             defaultValue={{contact.phone || ''}} 
                             onBlur={{(e) => updateContactMutation.mutate({{ id: contact.id, data: {{ phone: e.target.value }} }})}}
                             className="text-sm bg-transparent focus:ring-1 focus:ring-primary rounded outline-none w-1/2 print:p-0"
                             placeholder="Tel..."
                             disabled={{!isAdminOrPJM}}
                           />
                           <input 
                             type="text" 
                             defaultValue={{contact.email || ''}} 
                             onBlur={{(e) => updateContactMutation.mutate({{ id: contact.id, data: {{ email: e.target.value }} }})}}
                             className="text-sm text-primary bg-transparent focus:ring-1 focus:ring-primary rounded outline-none w-1/2 text-right print:p-0"
                             placeholder="Email..."
                             disabled={{!isAdminOrPJM}}
                           />
                         </div>
                       </div>
                       {{isAdminOrPJM && (
                         <button onClick={{() => deleteContactMutation.mutate(contact.id)}} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 mt-1 print:hidden">
                           <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
                         </button>
                       )}}
                     </div>
                   ))}}
                   {{catContacts.length === 0 && (
                     <div className="text-sm text-muted-foreground italic print:hidden col-span-2">Keine Einträge in {title}</div>
                   )}}
                 </div>
               </div>
             );
           }})()}}
"""

kunde_contacts = create_contact_section('kunde', 'Kunde')
darsteller_contacts = create_contact_section('darsteller', 'Darsteller')
bts_contacts = create_contact_section('bts', 'BTS')
crew_contacts = create_contact_section('crew', 'Crew')

three_columns_grid = """
           {/* Project Info 3-Columns */}
           <div className="grid grid-cols-3 gap-8 mb-12 print:break-inside-avoid">
             <div>
               <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 print:text-gray-500">KUNDE</label>
               <input 
                 type="text" 
                 defaultValue={data.client_name || project?.client_id || ''} 
                 onBlur={(e) => handleDataChange('client_name', e.target.value)}
                 placeholder="Kundenname..."
                 className="w-full bg-transparent font-bold text-lg border-b border-border focus:border-primary focus:outline-none pb-1 print:border-none print:p-0"
                 disabled={!isAdminOrPJM}
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 print:text-gray-500">PRODUKT</label>
               <input 
                 type="text" 
                 defaultValue={data.project_name || project?.title || ''} 
                 onBlur={(e) => handleDataChange('project_name', e.target.value)}
                 placeholder="Projektname..."
                 className="w-full bg-transparent font-bold text-lg border-b border-border focus:border-primary focus:outline-none pb-1 print:border-none print:p-0"
                 disabled={!isAdminOrPJM}
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 print:text-gray-500">PRODUCER VOR ORT</label>
               <input 
                 type="text" 
                 defaultValue={data.pjm_name || teamProfiles.find(p => p.id === project?.pjm_id)?.full_name || ''} 
                 onBlur={(e) => handleDataChange('pjm_name', e.target.value)}
                 placeholder="Producer Name..."
                 className="w-full bg-transparent font-bold text-lg border-b border-border focus:border-primary focus:outline-none pb-1 print:border-none print:p-0"
                 disabled={!isAdminOrPJM}
               />
             </div>
           </div>
"""

job_title_block = """
           {/* Job-Titel */}
           <div className="mb-12 print:break-inside-avoid">
             <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 print:text-gray-500">JOB-TITEL</label>
             <input 
               type="text" 
               defaultValue={data.job_title || (project ? `${project.project_number} - ${project.title}` : '')} 
               onBlur={(e) => handleDataChange('job_title', e.target.value)}
               placeholder="Job-Titel..."
               className="w-full bg-transparent font-bold text-xl border-b border-border focus:border-primary focus:outline-none pb-1 print:border-none print:p-0"
               disabled={!isAdminOrPJM}
             />
           </div>
"""

new_anreise_block = """
           {/* Anreise */}
           <div className="mb-12 print:break-inside-avoid">
             <h2 className="text-xl font-bold text-foreground uppercase mb-4 print:text-black border-b border-border pb-2">ANREISE</h2>
             <textarea 
               defaultValue={data.directions_notes || ''} 
               onBlur={(e) => handleDataChange('directions_notes', e.target.value)}
               placeholder="Hinweise zur Anfahrt, Parkmöglichkeiten..."
               className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded p-2 focus:outline-none min-h-[100px] print:border-none print:p-0"
               disabled={!isAdminOrPJM}
             />
           </div>
"""

new_produktion_block = """
           {/* Produktionshinweise */}
           <div className="mb-12 print:break-inside-avoid">
             <h2 className="text-xl font-bold text-foreground uppercase mb-4 print:text-black border-b border-border pb-2">PRODUKTIONSHINWEISE</h2>
             <textarea 
               defaultValue={data.general_notes || ''} 
               onBlur={(e) => handleDataChange('general_notes', e.target.value)}
               placeholder="Parkhinweise, Besonderheiten..."
               className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded p-2 focus:outline-none min-h-[100px] print:border-none print:p-0"
               disabled={!isAdminOrPJM}
             />
           </div>
"""

catering_block = """
           {/* Catering */}
           <div className="mb-12 print:break-inside-avoid">
             <h2 className="text-sm font-bold text-muted-foreground uppercase mb-2 print:text-gray-500 flex items-center gap-1 border-b border-border pb-2">
               <Icon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" className="w-4 h-4 text-primary print:hidden" />
               CATERING / MITTAGESSEN (ANZAHL PERSONEN)
             </h2>
             <textarea 
               defaultValue={data.catering_info || ''} 
               onBlur={(e) => handleDataChange('catering_info', e.target.value)}
               placeholder="z.B. 15 Personen (davon 2 Vegetarier)..."
               className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded p-2 focus:outline-none min-h-[100px] print:border-none print:p-0 font-medium"
               disabled={!isAdminOrPJM}
             />
           </div>
"""

new_content = (
    pre_content + 
    three_columns_grid + 
    grid_block + 
    kunde_contacts + 
    job_title_block + 
    darsteller_contacts + 
    bts_contacts + 
    crew_contacts + 
    drehplan_block + 
    maps_block + 
    new_anreise_block + 
    new_produktion_block + 
    post_content
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"Original length: {len(content)}")
print(f"New length: {len(new_content)}")
