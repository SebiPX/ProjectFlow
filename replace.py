import re

with open("components/documents/CallSheetEditor.tsx", "r", encoding="utf-8") as f:
    text = f.read()

pattern = r'<button onClick=\{\(\) => deleteContactMutation\.mutate\(contact\.id\)\} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 mt-1 print:hidden">\s*<Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />\s*</button>'

replacement = """<div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 print:hidden mt-1">
                            <button onClick={() => handleMoveContact(contact.category || 'crew', catContacts.indexOf(contact), -1)} disabled={catContacts.indexOf(contact) === 0} className="text-muted-foreground hover:text-primary disabled:opacity-30 disabled:hover:text-muted-foreground p-0.5">
                              <Icon path="M5 15l7-7 7 7" className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteContactMutation.mutate(contact.id)} className="text-red-400 hover:text-red-500 p-0.5" title="Löschen">
                              <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleMoveContact(contact.category || 'crew', catContacts.indexOf(contact), 1)} disabled={catContacts.indexOf(contact) === catContacts.length - 1} className="text-muted-foreground hover:text-primary disabled:opacity-30 disabled:hover:text-muted-foreground p-0.5">
                              <Icon path="M19 9l-7 7-7-7" className="w-4 h-4" />
                            </button>
                          </div>"""

text = re.sub(pattern, replacement, text)

# Also fix the createContactMutation.mutate calls
def repl_create(m):
    # m.group(0) is the full match
    # we want to insert `, order_index: catContacts.length` before `})`
    s = m.group(0)
    s = s.replace("phone: '' }", "phone: '', order_index: catContacts.length }")
    return s

pattern_create = r"createContactMutation\.mutate\(\{ name: 'Neuer Kontakt', role: 'Rolle', category: '(?:kunde|darsteller|bts|crew)' as any, phone: '' \}\)"
text = re.sub(pattern_create, repl_create, text)

with open("components/documents/CallSheetEditor.tsx", "w", encoding="utf-8", newline="\n") as f:
    f.write(text)
