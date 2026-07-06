import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { Avatar } from './ui/Avatar';
import { getProfiles } from '../services/api/profiles';
import type { Profile } from '../types/supabase';
import { useAuth } from '../lib/AuthContext';
import { 
  getKitchenDutyData, 
  saveKitchenDuties, 
  saveKitchenParticipants,
  type WeekDuty 
} from '../services/api/kitchenDuty';

// Local storage key (retained for migration check)
const STORAGE_KEY = 'px_kitchen_duty_plan';
const PARTICIPANTS_KEY = 'px_kitchen_duty_participants';

// Date helpers
function getWeekDates(weekNumber: number, year: number) {
  const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = new Date(simple);
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  const monday = new Date(ISOweekStart);
  const sunday = new Date(ISOweekStart);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}

function getWeekNumber(d: Date) {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

export const KitchenDutyPlanner: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentWeek = getWeekNumber(new Date());

  const { profile } = useAuth();
  const canEdit = profile?.role === 'GF' || profile?.role === 'superadmin';

  // Fetch profiles (employees)
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: getProfiles,
  });

  // Fetch kitchen duty data from database
  const { data: kdData, isLoading: kdLoading } = useQuery({
    queryKey: ['kitchen-duty'],
    queryFn: getKitchenDutyData,
  });

  // State
  const [duties, setDuties] = useState<WeekDuty[]>([]);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [editingWeek, setEditingWeek] = useState<WeekDuty | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Sync state with backend, migrating localStorage if necessary
  useEffect(() => {
    if (!profilesLoading && !kdLoading && kdData) {
      const dbDuties = kdData.duties || [];
      const dbParticipants = kdData.participants || [];
      
      const localDutiesStr = localStorage.getItem(STORAGE_KEY);
      const localParticipantsStr = localStorage.getItem(PARTICIPANTS_KEY);

      let finalDuties = dbDuties;
      let finalParticipants = dbParticipants;
      let migrated = false;

      // 1. If database duties are empty but local storage has duties, migrate them
      if (dbDuties.length === 0 && localDutiesStr) {
        try {
          finalDuties = JSON.parse(localDutiesStr);
          saveKitchenDuties(finalDuties);
          migrated = true;
        } catch (e) {
          console.error('Failed to parse local kitchen duties', e);
        }
      }

      // 2. If database participants are empty but local storage has participants, migrate them
      if (dbParticipants.length === 0 && localParticipantsStr) {
        try {
          finalParticipants = JSON.parse(localParticipantsStr);
          saveKitchenParticipants(finalParticipants);
          migrated = true;
        } catch (e) {
          console.error('Failed to parse local kitchen participants', e);
        }
      }

      // 3. Seed initial empty duties if database and local storage are both empty
      if (finalDuties.length === 0) {
        finalDuties = Array.from({ length: 52 }, (_, i) => ({
          weekNumber: i + 1,
          year: currentYear,
          assignedIds: [],
        }));
        saveKitchenDuties(finalDuties);
      }

      // 4. Seed initial participants if database and local storage are both empty
      if (finalParticipants.length === 0 && profiles.length > 0) {
        finalParticipants = profiles
          .filter(p => p.role !== 'client' && p.role !== 'guest')
          .map(p => p.id);
        saveKitchenParticipants(finalParticipants);
      }

      setDuties(finalDuties);
      setParticipantIds(finalParticipants);

      if (migrated) {
        console.log('Successfully migrated kitchen duty data from localStorage to DB');
      }
    }
  }, [kdData, profiles, profilesLoading, kdLoading, currentYear]);

  // Save to state and persist to database
  const saveDuties = async (newDuties: WeekDuty[]) => {
    setDuties(newDuties);
    try {
      await saveKitchenDuties(newDuties);
    } catch (e) {
      console.error('Failed to save duties to DB', e);
    }
  };

  const saveParticipants = async (newParticipants: string[]) => {
    setParticipantIds(newParticipants);
    try {
      await saveKitchenParticipants(newParticipants);
    } catch (e) {
      console.error('Failed to save participants to DB', e);
    }
  };

  // Toggle participant
  const toggleParticipant = (id: string) => {
    const next = participantIds.includes(id)
      ? participantIds.filter(pid => pid !== id)
      : [...participantIds, id];
    saveParticipants(next);
  };

  // Select all or none participants
  const selectAllParticipants = () => {
    const all = profiles.filter(p => p.role !== 'client' && p.role !== 'guest').map(p => p.id);
    saveParticipants(all);
  };

  const selectNoneParticipants = () => {
    saveParticipants([]);
  };

  // Auto distribute duties
  const autoDistribute = () => {
    if (participantIds.length < 4) {
      alert('Bitte wähle mindestens 4 Teilnehmer für den Küchendienst aus.');
      return;
    }

    // Shuffle active participants
    const shuffled = [...participantIds].sort(() => Math.random() - 0.5);
    let participantIndex = 0;

    const newDuties = duties.map(duty => {
      // Only distribute from current week onwards, keep past ones
      if (duty.year < currentYear || (duty.year === currentYear && duty.weekNumber < currentWeek)) {
        return duty;
      }

      const assignedIds: string[] = [];
      for (let i = 0; i < 4; i++) {
        assignedIds.push(shuffled[participantIndex]);
        participantIndex = (participantIndex + 1) % shuffled.length;
      }

      return {
        ...duty,
        assignedIds,
      };
    });

    saveDuties(newDuties);
  };

  // Clear duties
  const clearDuties = () => {
    if (window.confirm('Möchtest du wirklich alle zukünftigen Zuweisungen zurücksetzen?')) {
      const newDuties = duties.map(duty => {
        if (duty.year < currentYear || (duty.year === currentYear && duty.weekNumber < currentWeek)) {
          return duty;
        }
        return {
          ...duty,
          assignedIds: [],
        };
      });
      saveDuties(newDuties);
    }
  };

  // Update specific week duty
  const handleSaveWeekDuty = (assignedIds: string[]) => {
    if (editingWeek) {
      const newDuties = duties.map(d =>
        d.weekNumber === editingWeek.weekNumber && d.year === editingWeek.year
          ? { ...d, assignedIds }
          : d
      );
      saveDuties(newDuties);
      setEditingWeek(null);
    }
  };

  if (profilesLoading || kdLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-muted-foreground text-xl">Küchendienst-Planer lädt...</div>
      </div>
    );
  }

  // Filter duties for selected year
  const yearDuties = duties.filter(d => d.year === selectedYear);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card border border-border p-6 rounded-xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🧹 Küchendienst-Planer</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Plane und verteile wöchentliche Küchendienste für Teams aus jeweils 4 Mitarbeitern.
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted/40 transition-colors text-foreground font-medium text-sm"
            >
              <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" className="w-4 h-4" />
              <span>Teilnehmer verwalten ({participantIds.length})</span>
            </button>
            <button
              onClick={autoDistribute}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 transition-colors font-medium text-sm"
            >
              <Icon path="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17m-.5 3.5v5H16.2c-.3 0-.6-.1-.8-.3l-3.4-3.4" className="w-4 h-4" />
              <span>Automatisch verteilen</span>
            </button>
            <button
              onClick={clearDuties}
              className="flex items-center space-x-2 px-4 py-2 border border-destructive/20 text-destructive hover:bg-destructive/5 rounded-lg transition-colors font-medium text-sm"
            >
              <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-4 h-4" />
              <span>Zurücksetzen</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Year selector & list of weeks */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <h2 className="text-lg font-bold text-foreground">Wochenübersicht {selectedYear}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedYear(y => y - 1)}
              className="p-1.5 border border-border rounded-lg bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <Icon path="M15 19l-7-7 7-7" className="w-4 h-4" />
            </button>
            <span className="font-bold px-3 py-1 text-sm text-foreground bg-muted/50 rounded-lg">{selectedYear}</span>
            <button
              onClick={() => setSelectedYear(y => y + 1)}
              className="p-1.5 border border-border rounded-lg bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <Icon path="M9 5l7 7-7 7" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weeks list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {yearDuties.map(duty => {
            const { monday, sunday } = getWeekDates(duty.weekNumber, duty.year);
            const isCurrent = duty.weekNumber === currentWeek && duty.year === currentYear;
            const hasTeam = duty.assignedIds.length > 0;

            const formatDate = (d: Date) =>
              d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

            return (
              <div
                key={duty.weekNumber}
                className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">
                      KW {duty.weekNumber}
                      {isCurrent && <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground rounded-full">Aktuell</span>}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(monday)} - {formatDate(sunday)}
                    </span>
                  </div>

                  {/* Team Avatars */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {hasTeam ? (
                      duty.assignedIds.map(id => {
                        const profile = profiles.find(p => p.id === id);
                        return (
                          <div
                            key={id}
                            className="flex items-center space-x-1.5 bg-muted/45 border border-border/60 py-1 px-2 rounded-lg"
                            title={profile?.full_name || 'Unbekannt'}
                          >
                            <Avatar avatarPath={profile?.avatar_url} alt={profile?.full_name || ''} size="sm" />
                            <span className="text-xs font-semibold text-foreground truncate max-w-[70px]">
                              {profile?.full_name?.split(' ')[0] || 'Unbekannt'}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-xs text-muted-foreground italic flex items-center space-x-1 py-1">
                        <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-3.5 h-3.5" />
                        <span>Kein Dienst eingeteilt</span>
                      </span>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="mt-4 pt-3 border-t border-border/50 flex justify-end">
                    <button
                      onClick={() => setEditingWeek(duty)}
                      className="text-xs text-primary font-bold hover:underline flex items-center space-x-1"
                    >
                      <Icon path="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" className="w-3.5 h-3.5" />
                      <span>{hasTeam ? 'Bearbeiten' : 'Zuweisen'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Week Assignment Modal */}
      {editingWeek && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">
                Küchendienst für KW {editingWeek.weekNumber} bearbeiten
              </h3>
              <button
                onClick={() => setEditingWeek(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <Icon path="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-muted-foreground">
                Wähle genau 4 Mitarbeiter aus, die in dieser Woche für den Küchendienst eingeteilt werden sollen.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {profiles
                  .filter(p => p.role !== 'client' && p.role !== 'guest')
                  .map(profile => {
                    const isSelected = editingWeek.assignedIds.includes(profile.id);
                    const handleToggle = () => {
                      let nextIds = [...editingWeek.assignedIds];
                      if (isSelected) {
                        nextIds = nextIds.filter(id => id !== profile.id);
                      } else {
                        if (nextIds.length >= 4) {
                          alert('Maximal 4 Mitarbeiter können für einen Küchendienst eingeteilt werden.');
                          return;
                        }
                        nextIds.push(profile.id);
                      }
                      setEditingWeek({ ...editingWeek, assignedIds: nextIds });
                    };

                    return (
                      <button
                        key={profile.id}
                        onClick={handleToggle}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all text-left ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-foreground font-medium'
                            : 'border-border bg-muted/20 hover:bg-muted/40 text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Avatar avatarPath={profile.avatar_url} alt={profile.full_name || ''} size="sm" />
                          <span className="text-sm text-foreground">{profile.full_name}</span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-card'
                          }`}
                        >
                          {isSelected && <Icon path="M5 13l4 4L19 7" className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
            <div className="flex items-center justify-end p-5 bg-muted/30 border-t border-border space-x-3">
              <span className="text-xs text-muted-foreground mr-auto">
                {editingWeek.assignedIds.length} von 4 ausgewählt
              </span>
              <button
                onClick={() => setEditingWeek(null)}
                className="px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted/45 text-sm font-medium text-foreground transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleSaveWeekDuty(editingWeek.assignedIds)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-sm font-medium transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config Participants Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Küchendienst-Teilnehmer verwalten</h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <Icon path="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-muted-foreground">
                Lege fest, welche Team-Mitglieder grundsätzlich am Küchendienst teilnehmen und bei der automatischen Verteilung berücksichtigt werden.
              </p>
              
              <div className="flex space-x-3 mb-2">
                <button
                  onClick={selectAllParticipants}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Alle auswählen
                </button>
                <span className="text-muted-foreground/30">|</span>
                <button
                  onClick={selectNoneParticipants}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Keine auswählen
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {profiles
                  .filter(p => p.role !== 'client' && p.role !== 'guest')
                  .map(profile => {
                    const isParticipant = participantIds.includes(profile.id);
                    return (
                      <button
                        key={profile.id}
                        onClick={() => toggleParticipant(profile.id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all text-left ${
                          isParticipant
                            ? 'border-primary bg-primary/5 text-foreground font-medium'
                            : 'border-border bg-muted/20 hover:bg-muted/40 text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Avatar avatarPath={profile.avatar_url} alt={profile.full_name || ''} size="sm" />
                          <div>
                            <p className="text-sm text-foreground">{profile.full_name}</p>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center ${
                            isParticipant
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-card'
                          }`}
                        >
                          {isParticipant && <Icon path="M5 13l4 4L19 7" className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
            <div className="flex items-center justify-end p-5 bg-muted/30 border-t border-border">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-sm font-medium transition-colors"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
