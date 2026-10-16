import alasql from 'alasql';
import { QueryResult, TableSchema } from '../types';
import { SAMPLE_DATASETS } from './sampleDatasets';

class SqlEngine {
  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true; // Synchronously guard immediately against any recursion or concurrent runs

    try {
      alasql.options.modifier = undefined;
      try {
        alasql('SET postgresql = ON');
      } catch (e) {
        // Safe fallback
      }
    } catch (err) {
      console.warn('Note initializing SQL engine:', err);
    }
  }

  /**
   * Resets the entire in-memory database
   */
  public async resetDatabase(): Promise<void> {
    try {
      const tables = alasql('SHOW TABLES') as { tableid: string }[];
      if (Array.isArray(tables)) {
        for (const t of tables) {
          try {
            alasql(`DROP TABLE IF EXISTS \`${t.tableid}\``);
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Error clearing database tables:', err);
    }
  }

  /**
   * Splits an SQL script into discrete statements, handling quotes and semicolons
   */
  private splitStatements(sql: string): string[] {
    const statements: string[] = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inLineComment = false;
    let inBlockComment = false;

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const nextChar = sql[i + 1] || '';

      // Check comments
      if (!inSingleQuote && !inDoubleQuote) {
        if (!inLineComment && !inBlockComment && char === '-' && nextChar === '-') {
          inLineComment = true;
          i++;
          continue;
        }
        if (inLineComment && (char === '\n' || char === '\r')) {
          inLineComment = false;
          continue;
        }
        if (!inLineComment && !inBlockComment && char === '/' && nextChar === '*') {
          inBlockComment = true;
          i++;
          continue;
        }
        if (inBlockComment && char === '*' && nextChar === '/') {
          inBlockComment = false;
          i++;
          continue;
        }
      }

      if (inLineComment || inBlockComment) {
        continue;
      }

      // Check quotes
      if (char === "'" && !inDoubleQuote) {
        if (inSingleQuote && nextChar === "'") {
          // Escaped single quote
          current += "''";
          i++;
          continue;
        }
        inSingleQuote = !inSingleQuote;
        current += char;
        continue;
      }

      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        current += char;
        continue;
      }

      if (char === ';' && !inSingleQuote && !inDoubleQuote) {
        const trimmed = current.trim();
        if (trimmed) {
          statements.push(trimmed);
        }
        current = '';
        continue;
      }

      current += char;
    }

    const trimmed = current.trim();
    if (trimmed) {
      statements.push(trimmed);
    }

    return statements;
  }

  /**
   * Executes one or multiple SQL statements and returns performance telemetry and tabular results
   */
  public async executeScript(script: string): Promise<QueryResult[]> {
    await this.init();
    return this.executeStatementsInternal(script);
  }

  /**
   * Internal execution of statements without re-triggering init()
   */
  private async executeStatementsInternal(script: string): Promise<QueryResult[]> {
    const rawStatements = this.splitStatements(script);
    if (rawStatements.length === 0) {
      return [
        {
          statement: '',
          columns: [],
          rows: [],
          rowCount: 0,
          executionTimeMs: 0,
          isSelect: false,
          message: 'No SQL statements found to execute.'
        }
      ];
    }

    const results: QueryResult[] = [];

    for (const stmt of rawStatements) {
      // Yield to event loop so the UI updates and user touches are never blocked
      await new Promise(resolve => setTimeout(resolve, 0));

      const startTime = performance.now();
      const isSelect = /^\s*(SELECT|WITH|SHOW|DESCRIBE|EXPLAIN)\b/i.test(stmt);

      try {
        // Execute through AlaSQL
        const res = alasql(stmt);
        const duration = Math.round((performance.now() - startTime) * 100) / 100;

        if (Array.isArray(res)) {
          // Row array result (e.g. SELECT)
          const rows = res;
          let columns: string[] = [];

          if (rows.length > 0 && typeof rows[0] === 'object' && rows[0] !== null) {
            columns = Object.keys(rows[0]);
          }

          results.push({
            statement: stmt,
            columns,
            rows,
            rowCount: rows.length,
            executionTimeMs: Math.max(0.1, duration),
            isSelect: true
          });
        } else {
          // Non-SELECT statement like INSERT, UPDATE, CREATE TABLE, etc.
          const affectedCount = typeof res === 'number' ? res : 0;
          let actionLabel = 'Statement executed successfully';

          if (/^\s*CREATE\s+TABLE/i.test(stmt)) actionLabel = 'Table created successfully';
          else if (/^\s*INSERT\s+INTO/i.test(stmt)) actionLabel = affectedCount > 0 ? `${affectedCount} row(s) inserted` : 'Row(s) inserted successfully';
          else if (/^\s*UPDATE\b/i.test(stmt)) actionLabel = affectedCount > 0 ? `${affectedCount} row(s) updated` : 'Table updated successfully';
          else if (/^\s*DELETE\b/i.test(stmt)) actionLabel = affectedCount > 0 ? `${affectedCount} row(s) deleted` : 'Row(s) deleted successfully';
          else if (/^\s*DROP\s+TABLE/i.test(stmt)) actionLabel = 'Table dropped successfully';

          results.push({
            statement: stmt,
            columns: ['status', 'message'],
            rows: [{ status: 'OK', message: actionLabel }],
            rowCount: affectedCount,
            executionTimeMs: Math.max(0.1, duration),
            isSelect: false,
            message: actionLabel
          });
        }
      } catch (err: any) {
        const duration = Math.round((performance.now() - startTime) * 100) / 100;
        const errorMessage = err?.message || String(err) || 'Unknown SQL execution error';

        results.push({
          statement: stmt,
          columns: ['error'],
          rows: [{ error: errorMessage }],
          rowCount: 0,
          executionTimeMs: Math.max(0.1, duration),
          error: errorMessage,
          isSelect
        });

        // Break on first error in multi-statement script so subsequent dependent statements don't produce cascading noise
        break;
      }
    }

    return results;
  }

  /**
   * Introspects database schema: list of tables, column definitions, and row counts
   */
  public async getSchema(): Promise<TableSchema[]> {
    await this.init();

    try {
      const showTables = alasql('SHOW TABLES') as { tableid: string }[];
      if (!Array.isArray(showTables)) return [];

      const schemas: TableSchema[] = [];

      for (const t of showTables) {
        const tableName = t.tableid;
        try {
          // Fetch row count
          const countRes = alasql(`SELECT COUNT(*) AS total FROM \`${tableName}\``) as { total: number }[];
          const rowCount = countRes && countRes[0] ? Number(countRes[0].total) : 0;

          // Fetch table columns
          const sample = alasql(`SELECT * FROM \`${tableName}\` LIMIT 1`) as Record<string, any>[];
          const columns = sample && sample[0] ? Object.keys(sample[0]).map(col => {
            const val = sample[0][col];
            let type = 'STRING';
            if (typeof val === 'number') type = Number.isInteger(val) ? 'INT' : 'DECIMAL';
            else if (typeof val === 'boolean') type = 'BOOLEAN';
            else if (val instanceof Date) type = 'DATE';
            return {
              name: col,
              type,
              isPrimary: col.toLowerCase() === 'id'
            };
          }) : [];

          // If no rows, try reading from table definition if available
          if (columns.length === 0) {
            const db = (alasql as any).databases[(alasql as any).useid];
            if (db && db.tables && db.tables[tableName] && db.tables[tableName].columns) {
              const defCols = db.tables[tableName].columns;
              for (const c of defCols) {
                columns.push({
                  name: c.columnid,
                  type: c.dbtypeid || 'STRING',
                  isPrimary: c.pk || c.columnid.toLowerCase() === 'id'
                });
              }
            }
          }

          schemas.push({
            name: tableName,
            rowCount,
            columns
          });
        } catch (e) {
          console.warn(`Could not introspect table ${tableName}`, e);
        }
      }

      return schemas;
    } catch (err) {
      console.error('Error getting schema:', err);
      return [];
    }
  }

  /**
   * Retrieves sample data from a specific table
   */
  public async getTableSample(tableName: string, limit = 10): Promise<{ columns: string[]; rows: any[] }> {
    await this.init();
    try {
      const rows = alasql(`SELECT * FROM \`${tableName}\` LIMIT ${limit}`) as Record<string, any>[];
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
      return { columns, rows };
    } catch (e) {
      return { columns: [], rows: [] };
    }
  }

  /**
   * Imports raw CSV text into a newly created or overwritten table
   */
  public async importCsv(tableName: string, csvContent: string): Promise<{ rowCount: number }> {
    await this.init();

    // Clean table name: allow alphanumeric and underscore
    const safeName = tableName.trim().replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() || 'imported_data';
    
    // Parse CSV lines
    const lines = csvContent.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 1) {
      throw new Error('CSV file is empty');
    }

    // Parse header
    const headers = this.parseCsvLine(lines[0]).map((h, i) => {
      const clean = h.trim().replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      return clean || `col_${i + 1}`;
    });

    // Parse rows
    const rows: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const row: Record<string, any> = {};
      headers.forEach((h, idx) => {
        const raw = values[idx] !== undefined ? values[idx].trim() : '';
        // Type inference
        if (raw === '') {
          row[h] = null;
        } else if (!isNaN(Number(raw)) && !/^0\d+/.test(raw)) {
          row[h] = Number(raw);
        } else if (raw.toLowerCase() === 'true') {
          row[h] = true;
        } else if (raw.toLowerCase() === 'false') {
          row[h] = false;
        } else {
          row[h] = raw;
        }
      });
      rows.push(row);
    }

    // Drop table if exists and recreate
    alasql(`DROP TABLE IF EXISTS \`${safeName}\``);
    alasql(`CREATE TABLE \`${safeName}\``);
    (alasql as any).tables[safeName].data = rows;

    return { rowCount: rows.length };
  }

  /**
   * Imports JSON array of objects into a table
   */
  public async importJson(tableName: string, jsonContent: string): Promise<{ rowCount: number }> {
    await this.init();

    const safeName = tableName.trim().replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() || 'imported_json';
    let data: any;

    try {
      data = JSON.parse(jsonContent);
    } catch (e: any) {
      throw new Error(`Invalid JSON format: ${e.message}`);
    }

    if (!Array.isArray(data)) {
      if (typeof data === 'object' && data !== null) {
        // Maybe it's wrapped in an object like { data: [...] } or { rows: [...] }
        const arrayProp = Object.values(data).find(v => Array.isArray(v));
        if (arrayProp && Array.isArray(arrayProp)) {
          data = arrayProp;
        } else {
          data = [data];
        }
      } else {
        throw new Error('JSON data must be an array of objects or records');
      }
    }

    alasql(`DROP TABLE IF EXISTS \`${safeName}\``);
    alasql(`CREATE TABLE \`${safeName}\``);
    (alasql as any).tables[safeName].data = data;

    return { rowCount: data.length };
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  }
}

export const sqlEngine = new SqlEngine();
