import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QueryResult } from '../types';

interface ResultsTableProps {
  result?: QueryResult;
  darkMode: boolean;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ result, darkMode }) => {
  const bg = darkMode ? '#121212' : '#ffffff';
  const border = darkMode ? '#262626' : '#e5e5e5';
  const textColor = darkMode ? '#f5f5f5' : '#171717';
  const headerBg = darkMode ? '#1f1f1f' : '#f9fafb';
  const subTextColor = darkMode ? '#a3a3a3' : '#737373';

  if (!result) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: bg }]}>
        <Ionicons name="terminal-outline" size={32} color={subTextColor} />
        <Text style={[styles.emptyPrompt, { color: subTextColor }]}>
          Execute a SQL query to see results here
        </Text>
      </View>
    );
  }

  if (result.error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: bg }]}>
        <View style={styles.errorHeader}>
          <Ionicons name="alert-circle" size={18} color="#ef4444" />
          <Text style={styles.errorTitle}>SQL Execution Error ({result.executionTimeMs}ms)</Text>
        </View>
        <Text style={styles.errorMessage}>{result.error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Metric Bar */}
      <View style={[styles.metricBar, { borderBottomColor: border, backgroundColor: headerBg }]}>
        <View style={styles.metricLeft}>
          <Ionicons name="checkmark-circle" size={14} color="#059669" />
          <Text style={[styles.metricText, { color: textColor }]}>
            {result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'} returned
          </Text>
        </View>
        <Text style={[styles.durationText, { color: subTextColor }]}>
          {result.executionTimeMs}ms
        </Text>
      </View>

      {/* Grid Table */}
      {result.columns.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyPrompt, { color: subTextColor }]}>No records to display</Text>
        </View>
      ) : (
        <ScrollView horizontal style={styles.horizontalScroll}>
          <View>
            {/* Table Header Row */}
            <View style={[styles.headerRow, { backgroundColor: headerBg, borderBottomColor: border }]}>
              <View style={[styles.cellIndex, { borderRightColor: border }]}>
                <Text style={styles.cellIndexText}>#</Text>
              </View>
              {result.columns.map(col => (
                <View key={col} style={[styles.headerCell, { borderRightColor: border }]}>
                  <Text style={[styles.headerCellText, { color: textColor }]}>{col}</Text>
                </View>
              ))}
            </View>

            {/* Table Data Rows */}
            <ScrollView style={styles.verticalScroll}>
              {result.rows.map((row, idx) => (
                <View 
                  key={idx} 
                  style={[
                    styles.dataRow, 
                    { 
                      borderBottomColor: border,
                      backgroundColor: idx % 2 === 0 ? (darkMode ? '#121212' : '#ffffff') : (darkMode ? '#171717' : '#fafafa')
                    }
                  ]}
                >
                  <View style={[styles.cellIndex, { borderRightColor: border }]}>
                    <Text style={styles.cellIndexText}>{idx + 1}</Text>
                  </View>
                  {result.columns.map(col => {
                    const val = row[col];
                    const displayVal = val === null || val === undefined 
                      ? 'NULL' 
                      : typeof val === 'object' 
                        ? JSON.stringify(val) 
                        : String(val);
                    const isNull = val === null || val === undefined;

                    return (
                      <View key={col} style={[styles.dataCell, { borderRightColor: border }]}>
                        <Text 
                          style={[
                            styles.dataCellText, 
                            { color: isNull ? '#9ca3af' : textColor },
                            isNull && { fontStyle: 'italic' }
                          ]} 
                          numberOfLines={2}
                        >
                          {displayVal}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  emptyPrompt: {
    fontSize: 12,
  },
  errorContainer: {
    flex: 1,
    padding: 12,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  errorMessage: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 6,
  },
  metricBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 11,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  horizontalScroll: {
    flex: 1,
  },
  verticalScroll: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  cellIndex: {
    width: 36,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  cellIndexText: {
    fontSize: 9,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  headerCell: {
    minWidth: 100,
    maxWidth: 200,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRightWidth: 1,
    justifyContent: 'center',
  },
  headerCellText: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  dataCell: {
    minWidth: 100,
    maxWidth: 200,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRightWidth: 1,
    justifyContent: 'center',
  },
  dataCellText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
