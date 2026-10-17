import React from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EditorTab } from '../types';

interface SqlEditorProps {
  tabs: EditorTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onCloseTab: (id: string) => void;
  query: string;
  onChangeQuery: (text: string) => void;
  darkMode: boolean;
  isFocusMode: boolean;
  isSchemaOpen: boolean;
  onToggleSchema: () => void;
  tablesCount: number;
  attributesCount: number;
}

export const SqlEditor: React.FC<SqlEditorProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onCloseTab,
  query,
  onChangeQuery,
  darkMode,
  isFocusMode,
  isSchemaOpen,
  onToggleSchema,
  tablesCount,
  attributesCount
}) => {
  const bg = darkMode ? '#171717' : '#ffffff';
  const border = darkMode ? '#262626' : '#e5e5e5';
  const textColor = darkMode ? '#f5f5f5' : '#171717';
  const tabBgActive = darkMode ? '#262626' : '#f3f4f6';
  const tabBgInactive = darkMode ? '#121212' : '#fafafa';

  // Quick insertion helpers
  const handleInsertSnippet = (snip: string) => {
    onChangeQuery(query ? `${query}\n${snip}` : snip);
  };

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: border }]}>
      {/* Tab Bar: Hidden if in Zen Focus Mode */}
      {!isFocusMode && (
        <View style={[styles.tabBar, { backgroundColor: darkMode ? '#0a0a0a' : '#f9fafb', borderBottomColor: border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {tabs.map(t => {
              const isActive = t.id === activeTabId;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.tabItem,
                    { backgroundColor: isActive ? tabBgActive : tabBgInactive, borderColor: border },
                    isActive && styles.tabItemActive
                  ]}
                  onPress={() => onSelectTab(t.id)}
                >
                  <Text style={[styles.tabText, { color: isActive ? '#059669' : '#737373' }]}>
                    {t.title}
                  </Text>
                  {tabs.length > 1 && (
                    <TouchableOpacity onPress={() => onCloseTab(t.id)} style={styles.closeTabBtn}>
                      <Ionicons name="close" size={12} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.addTabBtn} onPress={onAddTab}>
              <Ionicons name="add" size={16} color="#737373" />
            </TouchableOpacity>

            {/* Tables & Attributes dedicated Tab button (expands and minimises) */}
            <TouchableOpacity 
              style={[
                styles.schemaToggleTab, 
                isSchemaOpen && styles.schemaToggleTabActive,
                { borderColor: border }
              ]}
              onPress={onToggleSchema}
            >
              <Ionicons name="server" size={12} color={isSchemaOpen ? '#059669' : '#737373'} />
              <Text style={[styles.schemaToggleLabel, isSchemaOpen && { color: '#059669' }]}>
                Tables ({tablesCount})
              </Text>
              <Text style={styles.schemaColBadge}>({attributesCount} cols)</Text>
              <Ionicons 
                name={isSchemaOpen ? "chevron-down" : "chevron-forward"} 
                size={12} 
                color={isSchemaOpen ? '#059669' : '#9ca3af'} 
              />
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* SQL Editor Area */}
      <View style={styles.editorBody}>
        <TextInput
          style={[
            styles.textInput, 
            { 
              color: textColor,
              backgroundColor: darkMode ? '#121212' : '#ffffff' 
            }
          ]}
          multiline
          placeholder="-- Write SQL queries here... (e.g. SELECT * FROM users;)"
          placeholderTextColor="#737373"
          value={query}
          onChangeText={onChangeQuery}
          autoCapitalize="none"
          autoCorrect={false}
          textAlignVertical="top"
        />
      </View>

      {/* Helper Snippets Bar */}
      <View style={[styles.snippetBar, { borderTopColor: border, backgroundColor: darkMode ? '#0f0f0f' : '#f9fafb' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.snippetScroll}>
          <TouchableOpacity style={styles.snippetBtn} onPress={() => handleInsertSnippet('SELECT * FROM ')}>
            <Text style={styles.snippetText}>SELECT *</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.snippetBtn} onPress={() => handleInsertSnippet('CREATE TABLE ')}>
            <Text style={styles.snippetText}>CREATE TABLE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.snippetBtn} onPress={() => handleInsertSnippet('INSERT INTO ')}>
            <Text style={styles.snippetText}>INSERT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.snippetBtn} onPress={() => handleInsertSnippet('WHERE ')}>
            <Text style={styles.snippetText}>WHERE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.snippetBtn} onPress={() => handleInsertSnippet('ORDER BY id DESC;')}>
            <Text style={styles.snippetText}>ORDER BY</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderBottomWidth: 1,
  },
  tabBar: {
    borderBottomWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tabsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  tabItemActive: {
    borderColor: '#059669',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeTabBtn: {
    padding: 2,
  },
  addTabBtn: {
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schemaToggleTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  schemaToggleTabActive: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  schemaToggleLabel: {
    fontSize: 10,
    color: '#525252',
    fontWeight: '600',
  },
  schemaColBadge: {
    fontSize: 9,
    color: '#059669',
    fontWeight: 'bold',
  },
  editorBody: {
    flex: 1,
  },
  textInput: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 13,
    padding: 12,
    lineHeight: 18,
  },
  snippetBar: {
    borderTopWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  snippetScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  snippetBtn: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  snippetText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});
