import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  SafeAreaView, 
  Alert 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Header } from './src/components/Header';
import { SqlEditor } from './src/components/SqlEditor';
import { SchemaExplorer } from './src/components/SchemaExplorer';
import { ResultsTable } from './src/components/ResultsTable';
import { sqlEngine } from './src/services/sqlEngine';
import { EditorTab, QueryResult, TableSchema } from './src/types';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [activeView, setActiveView] = useState<'editor' | 'schema' | 'history' | 'saved' | 'ai'>('editor');
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Tabs state
  const [tabs, setTabs] = useState<EditorTab[]>([
    {
      id: 'tab_1',
      title: 'Query 1',
      query: `-- QuickSQL - Light, Fast, and Smooth SQL Studio
-- Write SQL queries below and tap "Execute"

CREATE TABLE users (id INT, name STRING, role STRING);
INSERT INTO users VALUES (1, 'Alice', 'Engineer'), (2, 'Bob', 'Designer');

SELECT * FROM users;
`
    }
  ]);
  const [activeTabId, setActiveTabId] = useState('tab_1');

  // DB & Schema state
  const [schemas, setSchemas] = useState<TableSchema[]>([]);
  const [results, setResults] = useState<QueryResult[]>([]);

  const totalAttributesCount = schemas.reduce((acc, s) => acc + s.columns.length, 0);
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const refreshSchema = useCallback(async () => {
    const list = await sqlEngine.getSchema();
    setSchemas(list);
  }, []);

  useEffect(() => {
    const init = async () => {
      await sqlEngine.init();
      // Execute initial sample queries
      if (activeTab?.query) {
        const initialRes = await sqlEngine.executeScript(activeTab.query);
        setResults(initialRes);
        await refreshSchema();
      }
    };
    init();
  }, []);

  const handleExecute = async () => {
    if (!activeTab?.query?.trim()) return;
    setIsRunning(true);
    try {
      const res = await sqlEngine.executeScript(activeTab.query);
      setResults(res);
      await refreshSchema();
    } catch (e: any) {
      Alert.alert('Execution Error', e?.message || String(e));
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddTab = () => {
    const newId = 'tab_' + Date.now();
    const newTab: EditorTab = {
      id: newId,
      title: `Query ${tabs.length + 1}`,
      query: '-- Write SQL query\n'
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id: string) => {
    if (tabs.length <= 1) return;
    const remaining = tabs.filter(t => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[remaining.length - 1].id);
    }
  };

  const handleUpdateQuery = (text: string) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, query: text } : t));
  };

  const handleInsertText = (text: string) => {
    const cur = activeTab?.query || '';
    handleUpdateQuery(cur ? `${cur} ${text}` : text);
  };

  const bg = darkMode ? '#0a0a0a' : '#f9fafb';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <View style={styles.container}>
        {/* Header with quick actions, focus mode, and branding */}
        <Header
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          isFocusMode={isFocusMode}
          onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
          isRunning={isRunning}
          onExecute={handleExecute}
          tablesCount={schemas.length}
          attributesCount={totalAttributesCount}
          onOpenSchema={() => setIsSchemaOpen(!isSchemaOpen)}
          onOpenHistory={() => Alert.alert('History', 'History panel available')}
          onOpenSaved={() => Alert.alert('Saved Queries', 'Saved queries available')}
          onOpenAi={() => Alert.alert('Groq AI', 'BYOK AI Assistant available')}
          activeView={isSchemaOpen ? 'schema' : 'editor'}
        />

        {/* SQL Editor Area */}
        <View style={styles.editorArea}>
          <SqlEditor
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onAddTab={handleAddTab}
            onCloseTab={handleCloseTab}
            query={activeTab?.query || ''}
            onChangeQuery={handleUpdateQuery}
            darkMode={darkMode}
            isFocusMode={isFocusMode}
            isSchemaOpen={isSchemaOpen}
            onToggleSchema={() => setIsSchemaOpen(!isSchemaOpen)}
            tablesCount={schemas.length}
            attributesCount={totalAttributesCount}
          />
        </View>

        {/* Tables & Attributes Panel: Expands and minimises */}
        {!isFocusMode && isSchemaOpen && (
          <SchemaExplorer
            schemas={schemas}
            darkMode={darkMode}
            onClose={() => setIsSchemaOpen(false)}
            onInsertText={handleInsertText}
          />
        )}

        {/* Query Results Table */}
        <View style={styles.resultsArea}>
          <ResultsTable
            result={results[results.length - 1]}
            darkMode={darkMode}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  editorArea: {
    flex: 5,
  },
  resultsArea: {
    flex: 4,
  },
});
