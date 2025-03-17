import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useShift } from '../context/ShiftContext';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import NoteItem from '../components/NoteItem';
import AddNoteModal from '../components/AddNoteModal';

const NotesScreen = () => {
  const { notes, addNote, updateNote, deleteNote } = useShift();
  const { theme } = useTheme();
  const { t } = useLocalization();
  
  const [isAddNoteModalVisible, setIsAddNoteModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notes based on search query
  const filteredNotes = searchQuery
    ? notes.filter(
        note =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes;

  const handleAddNote = () => {
    setSelectedNote(null);
    setIsAddNoteModalVisible(true);
  };

  const handleEditNote = (note) => {
    setSelectedNote(note);
    setIsAddNoteModalVisible(true);
  };

  const handleDeleteNote = (noteId) => {
    Alert.alert(
      t('confirm'),
      t('delete_note_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteNote(noteId);
            if (!success) {
              Alert.alert(t('error'), t('delete_note_error'));
            }
          }
        }
      ]
    );
  };

  const handleSaveNote = (note) => {
    if (!note.title.trim() || !note.content.trim()) {
      Alert.alert(t('error'), t('note_fields_required'));
      return;
    }
    
    Alert.alert(
      t('confirm'),
      t('save_note_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('confirm'), 
          onPress: async () => {
            let success = false;
            if (selectedNote) {
              success = await updateNote({ ...selectedNote, ...note });
            } else {
              success = await addNote(note);
            }
            
            if (success) {
              setIsAddNoteModalVisible(false);
            } else {
              Alert.alert(t('error'), t('save_note_error'));
            }
          }
        }
      ]
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={48} color={theme.colors.disabled} />
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        {t('no_notes_yet')}
      </Text>
      <Text style={[styles.emptySubText, { color: theme.colors.textSecondary }]}>
        {t('add_new_note_hint')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.headerTitle}>{t('notes_title')}</Text>
      </View>
      
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder={t('search')}
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={filteredNotes}
        renderItem={({ item }) => (
          <NoteItem
            note={item}
            onEdit={() => handleEditNote(item)}
            onDelete={() => handleDeleteNote(item.id)}
            theme={theme}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.notesList}
        ListEmptyComponent={renderEmptyComponent}
      />
      
      {/* Add/Edit Note Modal */}
      <AddNoteModal
        visible={isAddNoteModalVisible}
        onClose={() => setIsAddNoteModalVisible(false)}
        onSave={handleSaveNote}
        initialData={selectedNote}
        theme={theme}
        t={t}
      />
      
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddNote}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  notesList: {
    padding: 16,
    paddingBottom: 80, // Extra padding for FAB
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    flexDirection: 'row',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 4,
  },
  addButtonIcon: {
    marginLeft: 4,
  },
});

export default NotesScreen;
