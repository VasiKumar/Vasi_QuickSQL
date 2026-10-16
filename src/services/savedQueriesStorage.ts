import { SavedQuery } from '../types';

const STORAGE_KEY = 'sql_studio_saved_queries_v2';
const OLD_STORAGE_KEY = 'sql_studio_saved_queries_v1';
const FOLDERS_KEY = 'sql_studio_folders_v1';

const DEFAULT_FOLDERS = ['Default', 'Analytics', 'Reports', 'Schema & Migrations', 'Playground'];

const DEFAULT_SAVED_QUERIES: SavedQuery[] = [
  {
    id: 'saved_1',
    title: 'Customer Spending Ranking (Postgres CTE)',
    description: 'Calculates lifetime revenue, order count, and average order value per customer.',
    query: `WITH customer_stats AS (
  SELECT 
    c.id,
    c.first_name || ' ' || c.last_name AS full_name,
    c.country,
    COUNT(o.id) AS total_orders,
    SUM(o.total_amount) AS total_spent
  FROM customers c
  JOIN orders o ON c.id = o.customer_id
  GROUP BY c.id, c.first_name, c.last_name, c.country
)
SELECT 
  full_name,
  country,
  total_orders,
  ROUND(total_spent, 2) AS total_spent,
  ROUND(total_spent / total_orders, 2) AS avg_order_value
FROM customer_stats
ORDER BY total_spent DESC;`,
    tags: ['CTE', 'Aggregations', 'E-Commerce'],
    folder: 'Analytics',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2
  },
  {
    id: 'saved_2',
    title: 'Monthly Order Revenue Trend',
    description: 'Summarizes order counts, total revenue, and average basket size.',
    query: `SELECT 
  SUBSTRING(order_date, 1, 7) AS order_month,
  COUNT(id) AS total_orders,
  ROUND(SUM(total_amount), 2) AS monthly_revenue,
  ROUND(AVG(total_amount), 2) AS avg_ticket_size
FROM orders
GROUP BY SUBSTRING(order_date, 1, 7)
ORDER BY order_month ASC;`,
    tags: ['Analytics', 'Time-Series', 'E-Commerce'],
    folder: 'Reports',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000
  },
  {
    id: 'saved_3',
    title: 'Products with Inventory Health Alert',
    description: 'Conditional status classification using CASE WHEN statements.',
    query: `SELECT 
  p.name AS product_name,
  cat.name AS category,
  p.price,
  p.stock_quantity,
  p.rating,
  CASE 
    WHEN p.stock_quantity <= 10 THEN 'CRITICAL_REORDER'
    WHEN p.stock_quantity <= 25 THEN 'LOW_STOCK'
    ELSE 'HEALTHY'
  END AS inventory_status
FROM products p
JOIN categories cat ON p.category_id = cat.id
ORDER BY p.stock_quantity ASC;`,
    tags: ['CASE', 'JOIN', 'Inventory'],
    folder: 'Reports',
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 43200000
  }
];

export const savedQueriesStorage = {
  getFolders(): string[] {
    try {
      const data = localStorage.getItem(FOLDERS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load folders', e);
    }
    return DEFAULT_FOLDERS;
  },

  createFolder(name: string): string[] {
    const trimmed = name.trim();
    if (!trimmed) return this.getFolders();
    const current = this.getFolders();
    if (!current.includes(trimmed)) {
      const updated = [...current, trimmed];
      try {
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    }
    return current;
  },

  renameFolder(oldName: string, newName: string): string[] {
    const trimmedNew = newName.trim();
    if (!trimmedNew || oldName === 'Default') return this.getFolders();

    const current = this.getFolders();
    const updated = current.map(f => f === oldName ? trimmedNew : f);
    try {
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(updated));
    } catch (e) {}

    // Update queries in this folder
    const queries = this.getSavedQueries();
    const updatedQueries = queries.map(q => q.folder === oldName ? { ...q, folder: trimmedNew } : q);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueries));
    } catch (e) {}

    return updated;
  },

  deleteFolder(folderName: string): string[] {
    if (folderName === 'Default') return this.getFolders();
    const current = this.getFolders();
    const updated = current.filter(f => f !== folderName);
    try {
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(updated));
    } catch (e) {}

    // Move queries in deleted folder to 'Default'
    const queries = this.getSavedQueries();
    const updatedQueries = queries.map(q => q.folder === folderName ? { ...q, folder: 'Default' } : q);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueries));
    } catch (e) {}

    return updated;
  },

  getSavedQueries(): SavedQuery[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // Check legacy migration
      const oldData = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldData) {
        const oldParsed = JSON.parse(oldData);
        if (Array.isArray(oldParsed)) {
          const migrated = oldParsed.map(q => ({
            ...q,
            folder: q.folder || 'Default'
          }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
      // Initialize with default queries
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SAVED_QUERIES));
      return DEFAULT_SAVED_QUERIES;
    } catch (e) {
      console.warn('Failed to load saved queries', e);
      return DEFAULT_SAVED_QUERIES;
    }
  },

  saveQuery(query: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'>, idToUpdate?: string): SavedQuery {
    const list = this.getSavedQueries();
    const now = Date.now();
    const targetFolder = query.folder && query.folder.trim() ? query.folder.trim() : 'Default';

    // Auto add folder if not present
    this.createFolder(targetFolder);

    if (idToUpdate) {
      const index = list.findIndex(q => q.id === idToUpdate);
      if (index !== -1) {
        const updated: SavedQuery = {
          ...list[index],
          ...query,
          folder: targetFolder,
          updatedAt: now
        };
        list[index] = updated;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return updated;
      }
    }

    const newQuery: SavedQuery = {
      ...query,
      folder: targetFolder,
      id: 'saved_' + now + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: now,
      updatedAt: now
    };

    const updatedList = [newQuery, ...list];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.error('LocalStorage write failed for saved queries', e);
    }

    return newQuery;
  },

  renameQuery(id: string, newTitle: string): SavedQuery | null {
    const list = this.getSavedQueries();
    const index = list.findIndex(q => q.id === id);
    if (index === -1) return null;

    const updated = {
      ...list[index],
      title: newTitle.trim() || list[index].title,
      updatedAt: Date.now()
    };
    list[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return updated;
  },

  moveQuery(id: string, targetFolder: string): SavedQuery | null {
    const list = this.getSavedQueries();
    const index = list.findIndex(q => q.id === id);
    if (index === -1) return null;

    this.createFolder(targetFolder);
    const updated = {
      ...list[index],
      folder: targetFolder,
      updatedAt: Date.now()
    };
    list[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return updated;
  },

  deleteQuery(id: string): void {
    const list = this.getSavedQueries();
    const filtered = list.filter(q => q.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to delete saved query', e);
    }
  },

  exportToJson(): string {
    const list = this.getSavedQueries();
    return JSON.stringify(list, null, 2);
  },

  importFromJson(jsonStr: string): { importedCount: number } {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      throw new Error('Import data must be a JSON array of queries');
    }

    const current = this.getSavedQueries();
    const existingIds = new Set(current.map(c => c.id));
    let count = 0;

    const merged = [...current];

    for (const item of parsed) {
      if (item && item.title && item.query) {
        const id = item.id && !existingIds.has(item.id) ? item.id : 'saved_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const folder = item.folder || 'Default';
        this.createFolder(folder);
        merged.unshift({
          id,
          title: String(item.title),
          query: String(item.query),
          description: item.description ? String(item.description) : undefined,
          tags: Array.isArray(item.tags) ? item.tags : ['Imported'],
          folder,
          createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
          updatedAt: Date.now()
        });
        existingIds.add(id);
        count++;
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return { importedCount: count };
  }
};
