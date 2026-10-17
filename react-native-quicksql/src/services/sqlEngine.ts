import alasql from 'alasql';
import { TableSchema, QueryResult } from '../types';

export class SqlEngineService {
  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) return;
    try {
      alasql('CREATE DATABASE IF NOT EXISTS quicksql_db;');
      alasql('USE quicksql_db;');
      this.initialized = true;
    } catch (e) {
      console.warn('SQL Engine init warning:', e);
    }
  }

  public async executeScript(script: string): Promise<QueryResult[]> {
    await this.init();
    const statements = script
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    if (statements.length === 0) {
      return [{
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: 0,
        query: script,
        timestamp: Date.now()
      }];
    }

    const results: QueryResult[] = [];

    for (const stmt of statements) {
      const start = Date.now();
      try {
        const rawRes = alasql(stmt);
        const duration = Date.now() - start;

        if (Array.isArray(rawRes)) {
          let columns: string[] = [];
          if (rawRes.length > 0 && typeof rawRes[0] === 'object' && rawRes[0] !== null) {
            columns = Object.keys(rawRes[0]);
          }
          results.push({
            columns,
            rows: rawRes,
            rowCount: rawRes.length,
            executionTimeMs: duration,
            query: stmt,
            timestamp: Date.now()
          });
        } else if (typeof rawRes === 'number') {
          results.push({
            columns: ['affected_rows'],
            rows: [{ affected_rows: rawRes }],
            rowCount: rawRes,
            executionTimeMs: duration,
            query: stmt,
            timestamp: Date.now()
          });
        } else {
          results.push({
            columns: ['status'],
            rows: [{ status: 'Query executed successfully' }],
            rowCount: 1,
            executionTimeMs: duration,
            query: stmt,
            timestamp: Date.now()
          });
        }
      } catch (err: any) {
        const duration = Date.now() - start;
        results.push({
          columns: ['error'],
          rows: [],
          rowCount: 0,
          executionTimeMs: duration,
          error: err?.message || String(err),
          query: stmt,
          timestamp: Date.now()
        });
      }
    }

    return results;
  }

  public async getSchema(): Promise<TableSchema[]> {
    await this.init();
    try {
      const tablesRaw = alasql('SHOW TABLES;');
      if (!Array.isArray(tablesRaw)) return [];

      const schemas: TableSchema[] = [];

      for (const t of tablesRaw) {
        const tableName = t.tableid || Object.values(t)[0];
        if (!tableName || String(tableName).startsWith('sqlite_')) continue;

        try {
          const countRaw = alasql(`SELECT COUNT(*) AS total FROM \`${tableName}\`;`);
          const rowCount = Array.isArray(countRaw) && countRaw[0] ? (countRaw[0].total || 0) : 0;

          // Inspect sample row or structure
          const sample = alasql(`SELECT * FROM \`${tableName}\` LIMIT 1;`);
          const columns: Array<{ name: string; type: string; isPrimary?: boolean }> = [];

          if (Array.isArray(sample) && sample[0]) {
            Object.keys(sample[0]).forEach((k, idx) => {
              let type: string = typeof val;
              if (type === 'number') type = Number.isInteger(val) ? 'INTEGER' : 'DECIMAL';
              else if (type === 'string') type = 'VARCHAR';
              else if (type === 'boolean') type = 'BOOLEAN';
              else type = 'TEXT';

              columns.push({
                name: k,
                type: type.toUpperCase(),
                isPrimary: idx === 0 && k.toLowerCase().includes('id')
              });
            });
          }

          schemas.push({
            name: String(tableName),
            columns,
            rowCount
          });
        } catch (e) {
          schemas.push({
            name: String(tableName),
            columns: [],
            rowCount: 0
          });
        }
      }

      return schemas;
    } catch (e) {
      return [];
    }
  }

  public async resetDatabase(): Promise<void> {
    try {
      alasql('DROP DATABASE IF EXISTS quicksql_db;');
      this.initialized = false;
      await this.init();
    } catch (e) {
      console.warn('Reset DB error:', e);
    }
  }
}

export const sqlEngine = new SqlEngineService();
