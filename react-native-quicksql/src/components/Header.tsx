import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  isRunning: boolean;
  onExecute: () => void;
  tablesCount: number;
  attributesCount: number;
  onOpenSchema: () => void;
  onOpenHistory: () => void;
  onOpenSaved: () => void;
  onOpenAi: () => void;
  activeView: string;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  isFocusMode,
  onToggleFocusMode,
  isRunning,
  onExecute,
  tablesCount,
  attributesCount,
  onOpenSchema,
  onOpenHistory,
  onOpenSaved,
  onOpenAi,
  activeView
}) => {
  const bg = darkMode ? '#0a0a0a' : '#ffffff';
  const border = darkMode ? '#262626' : '#e5e5e5';
  const textColor = darkMode ? '#f5f5f5' : '#171717';

  // If focus mode is active, render only the floating tiny unhide button
  if (isFocusMode) {
    return (
      <View style={styles.floatingUnhideContainer}>
        <TouchableOpacity 
          style={[styles.tinyUnhideButton, { backgroundColor: darkMode ? '#ffffff' : '#171717' }]}
          onPress={onToggleFocusMode}
          activeOpacity={0.8}
        >
          <Ionicons name="eye" size={18} color="#059669" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg, borderBottomColor: border }]}>
      {/* Top Bar: Brand & Primary Actions */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Ionicons name="server" size={16} color="#ffffff" />
          </View>
          <View>
            <Text style={[styles.brandText, { color: textColor }]}>QuickSQL</Text>
            <Text style={styles.taglineText}>Light · Fast · Smooth</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {/* Focus Mode (Hide) Toggle */}
          <TouchableOpacity 
            style={[styles.iconButton, { borderColor: border }]}
            onPress={onToggleFocusMode}
            accessibilityLabel="Hide options (Focus mode)"
          >
            <Ionicons name="eye-off-outline" size={18} color={darkMode ? '#a3a3a3' : '#525252'} />
          </TouchableOpacity>

          {/* Dark Mode Toggle */}
          <TouchableOpacity 
            style={[styles.iconButton, { borderColor: border }]}
            onPress={onToggleDarkMode}
          >
            <Ionicons 
              name={darkMode ? "sunny" : "moon"} 
              size={18} 
              color={darkMode ? "#fbbf24" : "#525252"} 
            />
          </TouchableOpacity>

          {/* Primary Execute Button */}
          <TouchableOpacity 
            style={[styles.executeButton, isRunning && styles.executeButtonDisabled]}
            onPress={onExecute}
            disabled={isRunning}
            activeOpacity={0.85}
          >
            {isRunning ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="play" size={14} color="#ffffff" style={{ marginRight: 4 }} />
            )}
            <Text style={styles.executeText}>{isRunning ? 'Running...' : 'Execute'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Tabs Bar */}
      <View style={[styles.navBar, { borderTopColor: border }]}>
        <TouchableOpacity 
          style={[styles.navTab, activeView === 'editor' && styles.navTabActive]}
          onPress={() => {}}
        >
          <Ionicons name="code-slash" size={14} color={activeView === 'editor' ? '#059669' : '#737373'} />
          <Text style={[styles.navLabel, activeView === 'editor' && styles.navLabelActive]}>Editor</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navTab, activeView === 'schema' && styles.navTabActive]}
          onPress={onOpenSchema}
        >
          <Ionicons name="layers-outline" size={14} color={activeView === 'schema' ? '#059669' : '#737373'} />
          <Text style={[styles.navLabel, activeView === 'schema' && styles.navLabelActive]}>
            Tables ({tablesCount})
          </Text>
          {attributesCount > 0 && (
            <View style={styles.attrBadge}>
              <Text style={styles.attrBadgeText}>{attributesCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navTab, activeView === 'history' && styles.navTabActive]}
          onPress={onOpenHistory}
        >
          <Ionicons name="time-outline" size={14} color={activeView === 'history' ? '#059669' : '#737373'} />
          <Text style={[styles.navLabel, activeView === 'history' && styles.navLabelActive]}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navTab, activeView === 'saved' && styles.navTabActive]}
          onPress={onOpenSaved}
        >
          <Ionicons name="bookmark-outline" size={14} color={activeView === 'saved' ? '#059669' : '#737373'} />
          <Text style={[styles.navLabel, activeView === 'saved' && styles.navLabelActive]}>Saved</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navTab, activeView === 'ai' && styles.navTabActive]}
          onPress={onOpenAi}
        >
          <Ionicons name="sparkles" size={14} color={activeView === 'ai' ? '#059669' : '#d97706'} />
          <Text style={[styles.navLabel, activeView === 'ai' && styles.navLabelActive]}>Groq AI</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingTop: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  taglineText: {
    fontSize: 9,
    color: '#059669',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  executeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  executeButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  executeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  navBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingHorizontal: 4,
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  navTabActive: {
    borderBottomColor: '#059669',
  },
  navLabel: {
    fontSize: 11,
    color: '#737373',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#059669',
    fontWeight: 'bold',
  },
  attrBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 2,
  },
  attrBadgeText: {
    color: '#1d4ed8',
    fontSize: 9,
    fontWeight: 'bold',
  },
  floatingUnhideContainer: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 999,
  },
  tinyUnhideButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
