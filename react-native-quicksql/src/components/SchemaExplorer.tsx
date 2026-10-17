import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TableSchema } from '../types';

interface SchemaExplorerProps {
  schemas: TableSchema[];
  darkMode: boolean;
  onClose: () => void;
  onInsertText: (text: string) => void;
}

export const SchemaExplorer: React.FC<SchemaExplorerProps> = ({
  schemas,
  darkMode,
  onClose,
  onInsertText
}) => {
  const [activeTab, setActiveTab] = useState<'tables' | 'attributes'>('tables');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const totalAttributes = schemas.reduce((acc, s) => acc + s.columns.length, 0);

  const toggleExpand = (tableName: string) => {
    setExpanded(prev => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const handleExpandAll = () => {
    const all: Record<string, boolean> = {};
    schemas.forEach(s => { all[s.name] = true; });
    setExpanded(all);
  };

  const handleCollapseAll = () => {
    setExpanded({});
  };

  const bg = darkMode ? '#121212' : '#ffffff';
  const border = darkMode ? '#262626' : '#e5e5e5';
  const textColor = darkMode ? '#f5f5f5' : '#171717';
  const subTextColor = darkMode ? '#a3a3a3' : '#737373';
  const itemBg = darkMode ? '#1e1e1e' : '#f9fafb';

  // Filter schemas
  const filteredSchemas = schemas.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.columns.some(c => c.name.toLowerCase().includes(q));
  });

  // Flattened attributes list
  const allAttributes = schemas.flatMap(s => 
    s.columns.map(c => ({
      tableName: s.name,
      columnName: c.name,
      type: c.type,
      isPrimary: c.isPrimary
    }))
  ).filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return a.columnName.toLowerCase().includes(q) || a.tableName.toLowerCase().includes(q);
  });

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: border }]}>
      {/* Top Header */}
      <View style={[styles.headerRow, { borderBottomColor: border }]}>
        <View style={styles.titleWithCounters}>
          <Ionicons name="server" size={16} color="#059669" />
          <Text style={[styles.title, { color: textColor }]}>Tables & Attributes</Text>
          <View style={styles.pillGreen}>
            <Text style={styles.pillTextGreen}>{schemas.length} Tables</Text>
          </View>
          <View style={styles.pillBlue}>
            <Text style={styles.pillTextBlue}>{totalAttributes} Attrs</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onClose} style={styles.minimizeBtn}>
          <Ionicons name="contract-outline" size={16} color={subTextColor} />
          <Text style={[styles.minimizeText, { color: subTextColor }]}>Minimise</Text>
        </TouchableOpacity>
      </View>

      {/* Internal Tabs: Tables vs All Attributes */}
      <View style={[styles.tabBar, { borderBottomColor: border }]}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'tables' && styles.tabBtnActive]}
          onPress={() => setActiveTab('tables')}
        >
          <Ionicons name="grid-outline" size={14} color={activeTab === 'tables' ? '#059669' : subTextColor} />
          <Text style={[styles.tabBtnText, activeTab === 'tables' && styles.tabBtnTextActive]}>
            Tables ({schemas.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'attributes' && styles.tabBtnActive]}
          onPress={() => setActiveTab('attributes')}
        >
          <Ionicons name="list-outline" size={14} color={activeTab === 'attributes' ? '#059669' : subTextColor} />
          <Text style={[styles.tabBtnText, activeTab === 'attributes' && styles.tabBtnTextActive]}>
            All Attributes ({totalAttributes})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search and Expand/Minimise Controls */}
      <View style={styles.searchRow}>
        <View style={[styles.searchInputWrapper, { backgroundColor: darkMode ? '#262626' : '#f3f4f6' }]}>
          <Ionicons name="search" size={14} color="#9ca3af" />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder={activeTab === 'tables' ? "Search tables/attributes..." : "Search all attributes..."}
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {activeTab === 'tables' && (
          <TouchableOpacity 
            style={[styles.toggleAllBtn, { borderColor: border }]}
            onPress={Object.keys(expanded).length > 0 ? handleCollapseAll : handleExpandAll}
          >
            <Text style={styles.toggleAllText}>
              {Object.keys(expanded).length > 0 ? 'Minimise All' : 'Expand All'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content List */}
      <ScrollView style={styles.scrollArea}>
        {activeTab === 'tables' ? (
          filteredSchemas.length === 0 ? (
            <Text style={[styles.emptyText, { color: subTextColor }]}>No tables found.</Text>
          ) : (
            filteredSchemas.map(s => {
              const isExp = !!expanded[s.name];
              return (
                <View key={s.name} style={[styles.tableCard, { backgroundColor: itemBg, borderColor: border }]}>
                  {/* Table Header: Click expands and minimises */}
                  <TouchableOpacity 
                    style={styles.tableHeader} 
                    onPress={() => toggleExpand(s.name)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.tableNameRow}>
                      <Ionicons name={isExp ? "chevron-down" : "chevron-forward"} size={14} color="#059669" />
                      <Text style={[styles.tableName, { color: textColor }]}>{s.name}</Text>
                      <Text style={[styles.tableRowCount, { color: subTextColor }]}>({s.rowCount} rows)</Text>
                    </View>
                    <Text style={styles.attrCountBadge}>{s.columns.length} attrs</Text>
                  </TouchableOpacity>

                  {/* Attributes List */}
                  {isExp && (
                    <View style={[styles.columnsList, { borderTopColor: border }]}>
                      {s.columns.map(col => (
                        <TouchableOpacity
                          key={col.name}
                          style={styles.columnRow}
                          onPress={() => onInsertText(`"${s.name}"."${col.name}"`)}
                        >
                          <View style={styles.columnNameRow}>
                            {col.isPrimary && <Ionicons name="key" size={12} color="#f59e0b" style={{ marginRight: 4 }} />}
                            <Text style={[styles.columnName, { color: textColor }]}>{col.name}</Text>
                          </View>
                          <Text style={styles.columnType}>{col.type}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )
        ) : (
          /* All Attributes Flat Tab */
          allAttributes.length === 0 ? (
            <Text style={[styles.emptyText, { color: subTextColor }]}>No attributes match.</Text>
          ) : (
            allAttributes.map((a, i) => (
              <TouchableOpacity
                key={`${a.tableName}_${a.columnName}_${i}`}
                style={[styles.flatAttrRow, { backgroundColor: itemBg, borderColor: border }]}
                onPress={() => onInsertText(`"${a.tableName}"."${a.columnName}"`)}
              >
                <View>
                  <Text style={[styles.flatAttrName, { color: textColor }]}>{a.columnName}</Text>
                  <Text style={[styles.flatAttrTable, { color: subTextColor }]}>in {a.tableName}</Text>
                </View>
                <Text style={styles.columnType}>{a.type}</Text>
              </TouchableOpacity>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderTopWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  titleWithCounters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  pillGreen: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  pillTextGreen: {
    color: '#047857',
    fontSize: 9,
    fontWeight: 'bold',
  },
  pillBlue: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  pillTextBlue: {
    color: '#1d4ed8',
    fontSize: 9,
    fontWeight: 'bold',
  },
  minimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  minimizeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#059669',
  },
  tabBtnText: {
    fontSize: 11,
    color: '#737373',
  },
  tabBtnTextActive: {
    color: '#059669',
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRadius: 6,
    height: 30,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 11,
    paddingVertical: 0,
  },
  toggleAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  toggleAllText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 10,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 20,
  },
  tableCard: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
  },
  tableNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  tableRowCount: {
    fontSize: 10,
  },
  attrCountBadge: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  columnsList: {
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  columnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  columnNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  columnName: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  columnType: {
    fontSize: 9,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  flatAttrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 6,
  },
  flatAttrName: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  flatAttrTable: {
    fontSize: 9,
  },
});
