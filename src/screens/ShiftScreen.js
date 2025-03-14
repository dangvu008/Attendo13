import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
  TouchableWithoutFeedback,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useShift } from '../context/ShiftContext';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';

const ShiftScreen = () => {
  const { shifts, addShift, updateShift, deleteShift, applyShift } = useShift();
  const { theme } = useTheme();
  const { t } = useLocalization();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [newShift, setNewShift] = useState({
    name: '',
    startWorkTime: '',
    endWorkTime: '',
    active: true
  });

  // Handle add new shift
  const handleAddShift = () => {
    setEditingShift(null);
    setNewShift({
      name: '',
      startWorkTime: '',
      endWorkTime: '',
      active: true
    });
    setModalVisible(true);
  };

  // Handle edit existing shift
  const handleEditShift = (shift) => {
    setEditingShift(shift);
    setNewShift({
      name: shift.name,
      startWorkTime: shift.startWorkTime,
      endWorkTime: shift.endWorkTime,
      active: shift.active
    });
    setModalVisible(true);
  };

  // Handle delete shift
  const handleDeleteShift = (shiftId) => {
    Alert.alert(
      t('confirm'),
      t('delete_shift_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), onPress: () => deleteShift(shiftId), style: 'destructive' }
      ]
    );
  };

  // Handle save shift
  const handleSaveShift = () => {
    // Validate inputs
    if (!newShift.name.trim()) {
      Alert.alert(t('error'), t('shift_name_required'));
      return;
    }
    
    if (!newShift.startWorkTime.trim() || !newShift.endWorkTime.trim()) {
      Alert.alert(t('error'), t('shift_times_required'));
      return;
    }
    
    if (editingShift) {
      // Update existing shift
      updateShift({
        ...editingShift,
        ...newShift
      });
    } else {
      // Add new shift
      addShift({
        id: Date.now().toString(),
        ...newShift
      });
    }
    
    setModalVisible(false);
  };

  // Apply shift as current
  const handleApplyShift = (shift) => {
    applyShift(shift);
    Alert.alert(
      t('success'),
      t('shift_applied')
    );
  };

  // Render shift item
  const renderShiftItem = ({ item }) => {
    const isCurrentShift = item.active;
    
    return (
      <View style={[
        styles.shiftItem,
        { backgroundColor: theme.colors.surface }
      ]}>
        <View style={styles.shiftHeader}>
          <Text style={[styles.shiftName, { color: theme.colors.text }]}>{item.name}</Text>
          {isCurrentShift && (
            <View style={[styles.currentBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.currentBadgeText}>{t('current')}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.shiftTimes}>
          <View style={styles.timeItem}>
            <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>{t('shift_start_time')}:</Text>
            <Text style={[styles.timeValue, { color: theme.colors.text }]}>{item.startWorkTime || '--:--'}</Text>
          </View>
          
          <View style={styles.timeItem}>
            <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>{t('shift_end_time')}:</Text>
            <Text style={[styles.timeValue, { color: theme.colors.text }]}>{item.endWorkTime || '--:--'}</Text>
          </View>
        </View>
        
        <View style={styles.shiftActions}>
          {!isCurrentShift && (
            <TouchableOpacity 
              style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleApplyShift(item)}
            >
              <Text style={styles.applyButtonText}>{t('apply')}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: theme.colors.primary }]}
            onPress={() => handleEditShift(item)}
          >
            <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: theme.colors.error }]}
            onPress={() => handleDeleteShift(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.headerTitle}>{t('shifts_title')}</Text>
      </View>
      
      <FlatList
        data={shifts}
        renderItem={renderShiftItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.shiftsList}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.disabled} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('no_shifts')}
            </Text>
          </View>
        )}
      />
      
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddShift}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
      
      {/* Add/Edit Shift Modal */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    {editingShift ? t('edit_shift') : t('new_shift')}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{t('shift_name')}</Text>
                    <TextInput
                      style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                      value={newShift.name}
                      onChangeText={(text) => setNewShift({ ...newShift, name: text })}
                      placeholder={t('shift_name_placeholder')}
                      placeholderTextColor={theme.colors.placeholder}
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{t('shift_start_time')}</Text>
                    <TextInput
                      style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                      value={newShift.startWorkTime}
                      onChangeText={(text) => setNewShift({ ...newShift, startWorkTime: text })}
                      placeholder="08:00"
                      placeholderTextColor={theme.colors.placeholder}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{t('shift_end_time')}</Text>
                    <TextInput
                      style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                      value={newShift.endWorkTime}
                      onChangeText={(text) => setNewShift({ ...newShift, endWorkTime: text })}
                      placeholder="17:00"
                      placeholderTextColor={theme.colors.placeholder}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  
                  <View style={styles.switchGroup}>
                    <Text style={[styles.switchLabel, { color: theme.colors.text }]}>{t('set_as_active')}</Text>
                    <Switch
                      value={newShift.active}
                      onValueChange={(value) => setNewShift({ ...newShift, active: value })}
                      trackColor={{ false: '#767577', true: theme.colors.primaryLight }}
                      thumbColor={newShift.active ? theme.colors.primary : '#f4f3f4'}
                    />
                  </View>
                </ScrollView>
                
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: theme.colors.disabled }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleSaveShift}
                  >
                    <Text style={styles.saveButtonText}>{t('save')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  shiftsList: {
    padding: 16,
    paddingBottom: 80,
  },
  shiftItem: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shiftName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shiftTimes: {
    marginBottom: 12,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  shiftActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
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
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  switchLabel: {
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ShiftScreen;
