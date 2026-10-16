import { QueryHistoryItem } from '../types';

const STORAGE_KEY = 'sql_studio_history_v1';
const MAX_HISTORY = 80;

export const historyStorage = {
  getHistory(): QueryHistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to load query history', e);
      return [];
    }
  },

  addItem(item: Omit<QueryHistoryItem, 'id' | 'timestamp'>): QueryHistoryItem {
    const history = this.getHistory();
    const newItem: QueryHistoryItem = {
      ...item,
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now()
    };

    // Filter out duplicate consecutive identical queries
    const filtered = history.filter(h => h.query.trim() !== newItem.query.trim());
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      // Storage might be full, try trimming to half
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 30)));
      } catch (err) {
        console.error('LocalStorage quota exceeded for history', err);
      }
    }

    return newItem;
  },

  clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear history', e);
    }
  },

  removeItem(id: string): void {
    const history = this.getHistory();
    const updated = history.filter(item => item.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update history', e);
    }
  }
};
