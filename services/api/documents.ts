import { fetchApi } from './client';

export interface AgencyDocument {
  id: string;
  project_id: string;
  title: string;
  type: 'shotlist' | 'call_sheet' | 'event_sheet';
  created_at: string;
  updated_at: string;
  created_by?: string;
  author_name?: string;
}

export interface ShotlistItem {
  id: string;
  document_id: string;
  order_index: number;
  scene_name: string;
  scene_number: string;
  take: string;
  duration: string;
  framing: string;
  is_vfx?: boolean;
  focal_length?: string;
  framerate?: string;
  camera_type?: string;
  cast_list: string;
  props: string;
  notes: string;
  image_url: string;
}

export interface CallSheetLocation {
  name: string;
  address: string;
  lat?: string;
  lng?: string;
}

export interface CallSheetData {
  document_id: string;
  shoot_date?: string;
  location_name: string;
  location_address: string;
  location_lat?: string;
  location_lng?: string;
  weather_info: string;
  hospital_info: string;
  general_notes: string;
  catering_info?: string;
  directions_notes?: string;
  additional_locations?: CallSheetLocation[];
  client_name?: string;
  project_name?: string;
  pjm_name?: string;
  pjm_phone?: string;
  job_title?: string;
  location_notes?: string;
}

export interface CallSheetSchedule {
  id: string;
  document_id: string;
  time_start: string;
  time_end: string;
  description: string;
  persons: string;
  scene_name?: string;
  scene_number?: string;
  duration_minutes?: number;
  is_done?: boolean;
  image_url?: string;
}

export interface CallSheetContact {
  id: string;
  document_id: string;
  name: string;
  role: string;
  category?: 'crew' | 'kunde' | 'darsteller' | 'bts';
  phone: string;
  email: string;
}

export const getProjectDocuments = (projectId: string) =>
  fetchApi(`/api/documents/project/${projectId}`);

export const createDocument = (projectId: string, title: string, type: 'shotlist' | 'call_sheet') =>
  fetchApi('/api/documents', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId, title, type }),
  });

export const getDocumentDetails = (id: string) =>
  fetchApi(`/api/documents/${id}`);

export const deleteDocument = (id: string) =>
  fetchApi(`/api/documents/${id}`, { method: 'DELETE' });

export const duplicateDocument = (id: string) =>
  fetchApi(`/api/documents/${id}/duplicate`, { method: 'POST' });

export const updateDocumentTitle = (id: string, title: string) =>
  fetchApi(`/api/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title })
  });

// --- Shotlist Specific ---
export const createShotlistItem = (documentId: string, data: Partial<ShotlistItem>) =>
  fetchApi(`/api/documents/${documentId}/shotlist-items`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateShotlistItem = (itemId: string, data: Partial<ShotlistItem>) =>
  fetchApi(`/api/documents/shotlist-items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteShotlistItem = (itemId: string) =>
  fetchApi(`/api/documents/shotlist-items/${itemId}`, { method: 'DELETE' });

// --- Call Sheet Specific ---
export const updateCallSheetData = (documentId: string, data: Partial<CallSheetData>) =>
  fetchApi(`/api/documents/${documentId}/call-sheet-data`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const createCallSheetSchedule = (documentId: string, data: Partial<CallSheetSchedule>) =>
  fetchApi(`/api/documents/${documentId}/schedule`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateCallSheetSchedule = (itemId: string, data: Partial<CallSheetSchedule>) =>
  fetchApi(`/api/documents/schedule/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteCallSheetSchedule = (itemId: string) =>
  fetchApi(`/api/documents/schedule/${itemId}`, { method: 'DELETE' });

export const createCallSheetContact = (documentId: string, data: Partial<CallSheetContact>) =>
  fetchApi(`/api/documents/${documentId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateCallSheetContact = (itemId: string, data: Partial<CallSheetContact>) =>
  fetchApi(`/api/documents/contacts/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteCallSheetContact = (itemId: string) =>
  fetchApi(`/api/documents/contacts/${itemId}`, { method: 'DELETE' });
