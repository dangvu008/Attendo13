import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';

const NoteItem = ({ note, onEdit, onDelete, theme }) => {
  // Format the reminder time to display
  const formatReminderTime = (dateTimeString) => {
    try {
      if (!dateTimeString) return 'Không có nhắc nhở';
      
      // Parse the ISO string
      const date = parseISO(dateTimeString);
      return `Nhắc nhở: ${format(date, 'dd/MM/yyyy HH:mm')}`;
    } catch (error) {
      console.error('Error formatting reminder time:', error);
      return dateTimeString || 'Thời gian không hợp lệ';
    }
  };
  
  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.surface,
      borderLeftColor: theme.colors.primary
    }]}>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {note.title}
        </Text>
        <Text style={[styles.content, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {note.content}
        </Text>
        <Text style={[styles.reminderTime, { color: theme.colors.textTertiary || '#888' }]}>
          {formatReminderTime(note.reminderTime)}
        </Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Ionicons name="pencil" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <Ionicons name="trash" size={18} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  content: {
    fontSize: 14,
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  actions: {
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  actionButton: {
    padding: 6,
  },
});

export default NoteItem;
