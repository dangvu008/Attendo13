import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';

const NoteItem = ({ note, onEdit, onDelete }) => {
  // Format the reminder time to display
  const formatReminderTime = (dateTimeString) => {
    try {
      if (!dateTimeString) return 'Không có nhắc nhở';
      
      // Parse the ISO string
      const date = parseISO(dateTimeString);
      return `Reminder: ${format(date, 'yyyy-MM-ddTHH:mm')}`;
    } catch (error) {
      console.error('Error formatting reminder time:', error);
      return dateTimeString || 'Invalid date';
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={1}>{note.title}</Text>
        <Text style={styles.content} numberOfLines={2}>{note.content}</Text>
        <Text style={styles.reminderTime}>{formatReminderTime(note.reminderTime)}</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Ionicons name="pencil" size={18} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <Ionicons name="trash" size={18} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    borderLeftWidth: 4,
    borderLeftColor: '#6200ee',
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  content: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 12,
    color: '#888',
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
