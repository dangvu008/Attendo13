import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { format, startOfWeek, addDays, isToday, isBefore, parseISO } from 'date-fns';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';

const WeeklyStatusGrid = ({ weeklyStatus, statusDetails, onStatusChange }) => {
  const { theme } = useTheme();
  const { t } = useLocalization();
  const [selectedDay, setSelectedDay] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  // Generate days for the current week starting from Monday
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Monday
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfCurrentWeek, i);
    return {
      date,
      day: format(date, 'd'),
      dayName: format(date, 'EEE').substring(0, 1).toUpperCase(),
      formattedDate: format(date, 'yyyy-MM-dd'),
      isPast: isBefore(date, today) && !isToday(date),
      isToday: isToday(date),
      isFuture: !isToday(date) && !isBefore(date, today)
    };
  });

  // All possible statuses
  const allStatuses = [
    { code: '✓', icon: 'check-circle', color: '#4CAF50', name: t('status_full_work') },
    { code: '!', icon: 'warning', color: '#FFC107', name: t('status_missing_check') },
    { code: 'RV', icon: 'timelapse', color: '#FF9800', name: t('status_early_late') },
    { code: 'P', icon: 'email', color: '#2196F3', name: t('status_leave') },
    { code: 'B', icon: 'sick', color: '#E91E63', name: t('status_sick'), fontAwesome: true },
    { code: 'H', icon: 'flag', color: '#673AB7', name: t('status_holiday') },
    { code: 'X', icon: 'close', color: '#F44336', name: t('status_absent') },
    { code: '?', icon: 'help', color: '#9E9E9E', name: t('status_unknown') }
  ];

  // Status icon mappings
  const getStatusIcon = (status) => {
    const statusObj = allStatuses.find(s => s.code === status);
    if (statusObj) return statusObj;
    
    // Default for '--' or unknown
    return { code: '--', icon: 'help', color: '#9E9E9E', name: t('status_unknown') };
  };

  const handleDayPress = (day) => {
    if (!day.isFuture) {
      setSelectedDay(day);
      setDetailsModalVisible(true);
    }
  };

  const handleStatusChange = (newStatus) => {
    if (selectedDay && onStatusChange) {
      onStatusChange(selectedDay.formattedDate, newStatus);
      setStatusModalVisible(false);
      setDetailsModalVisible(false);
    }
  };

  const openStatusModal = () => {
    setStatusModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.grid, { backgroundColor: theme.colors.background }]}>
        {days.map((day) => {
          const dateKey = day.formattedDate;
          const status = weeklyStatus[dateKey] || (day.isFuture ? '--' : '?');
          const statusInfo = getStatusIcon(status);
          
          return (
            <TouchableOpacity 
              key={dateKey}
              style={[
                styles.dayCell,
                { backgroundColor: theme.colors.surface },
                day.isToday && [styles.todayCell, { backgroundColor: theme.colors.primary }],
                day.isFuture && styles.futureCell
              ]}
              onPress={() => handleDayPress(day)}
              disabled={day.isFuture}
            >
              <Text style={[
                styles.dayName, 
                { color: theme.colors.textSecondary },
                day.isToday && styles.todayText
              ]}>
                {day.dayName}
              </Text>
              <Text style={[
                styles.dayNumber, 
                { color: theme.colors.text },
                day.isToday && styles.todayText
              ]}>
                {day.day}
              </Text>
              <View style={[styles.statusIconContainer, { backgroundColor: statusInfo.color }]}>
                {statusInfo.fontAwesome ? (
                  <FontAwesome5 name={statusInfo.icon} size={14} color="#fff" />
                ) : (
                  <MaterialIcons name={statusInfo.icon} size={14} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Status Legend */}
      <View style={styles.legend}>
        {allStatuses.slice(0, 4).map((status) => (
          <View key={status.code} style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: status.color }]}>
              {status.fontAwesome ? (
                <FontAwesome5 name={status.icon} size={12} color="#fff" />
              ) : (
                <MaterialIcons name={status.icon} size={12} color="#fff" />
              )}
            </View>
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
              {status.name}
            </Text>
          </View>
        ))}
      </View>
      
      {/* Second row of legend */}
      <View style={styles.legend}>
        {allStatuses.slice(4).map((status) => (
          <View key={status.code} style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: status.color }]}>
              {status.fontAwesome ? (
                <FontAwesome5 name={status.icon} size={12} color="#fff" />
              ) : (
                <MaterialIcons name={status.icon} size={12} color="#fff" />
              )}
            </View>
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
              {status.name}
            </Text>
          </View>
        ))}
      </View>

      {/* Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {selectedDay ? format(selectedDay.date, 'dd/MM/yyyy') : ''} - {selectedDay ? 
                  getStatusIcon(weeklyStatus[selectedDay.formattedDate] || '?').name : ''}
              </Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {selectedDay && statusDetails[selectedDay.formattedDate] ? (
                <>
                  <Text style={[styles.detailLabel, { color: theme.colors.text }]}>
                    {t('check_in_time')}:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
                    {statusDetails[selectedDay.formattedDate].checkInTime || t('no_data')}
                  </Text>
                  
                  <Text style={[styles.detailLabel, { color: theme.colors.text }]}>
                    {t('check_out_time')}:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
                    {statusDetails[selectedDay.formattedDate].checkOutTime || t('no_data')}
                  </Text>
                  
                  <Text style={[styles.detailLabel, { color: theme.colors.text }]}>
                    {t('total_hours')}:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
                    {statusDetails[selectedDay.formattedDate].totalHours || t('no_data')}
                  </Text>
                  
                  {statusDetails[selectedDay.formattedDate].note && (
                    <>
                      <Text style={[styles.detailLabel, { color: theme.colors.text }]}>
                        {t('note')}:
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
                        {statusDetails[selectedDay.formattedDate].note}
                      </Text>
                    </>
                  )}
                </>
              ) : (
                <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
                  {t('no_details_available')}
                </Text>
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.footerButton, { backgroundColor: theme.colors.primary }]}
                onPress={openStatusModal}
              >
                <Text style={styles.footerButtonText}>{t('change_status')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={statusModalVisible}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t('select_status')}
              </Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {allStatuses.map((status) => (
                <TouchableOpacity 
                  key={status.code}
                  style={[styles.statusOption, { borderBottomColor: theme.colors.border }]}
                  onPress={() => handleStatusChange(status.code)}
                >
                  <View style={[styles.statusOptionIcon, { backgroundColor: status.color }]}>
                    {status.fontAwesome ? (
                      <FontAwesome5 name={status.icon} size={16} color="#fff" />
                    ) : (
                      <MaterialIcons name={status.icon} size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={[styles.statusOptionText, { color: theme.colors.text }]}>
                    {status.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 8,
    borderRadius: 12,
    padding: 8,
  },
  dayCell: {
    width: 42,
    height: 70,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  todayCell: {
    elevation: 3,
  },
  futureCell: {
    opacity: 0.5,
  },
  dayName: {
    fontSize: 12,
    marginBottom: 2,
    fontWeight: '500',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  todayText: {
    color: '#fff',
  },
  statusIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
    width: '45%',
  },
  legendIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
    maxHeight: 300,
  },
  modalFooter: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  footerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  detailValue: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statusOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusOptionText: {
    fontSize: 16,
  }
});

export default WeeklyStatusGrid;
