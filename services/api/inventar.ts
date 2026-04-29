import { fetchApi } from './client';

export interface InventarItem {
  id: string;
  geraet: string;
  px_nummer?: string;
  aufkleber?: string;
  modell?: string;
  seriennummer?: string;
  ort?: string;
  os?: string;
  status?: string;
  department?: string;
  bild_url?: string;
  gewicht?: number;
}

export const getInventarItems = () =>
  fetchApi('/api/inventar/items');
