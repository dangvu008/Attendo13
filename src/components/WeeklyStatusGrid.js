import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, FlatList } from 'react-native';
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
      dayName: i === 6 ? 'CN' : `T${i + 2}`, // T2, T3, T4, T5, T6, T7, CN
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
    { code: '--', icon: 'help', color: '#9E9E9E', name: t('status_unknown') }
  ];

  // Status icon mappings
  const getStatusIcon = (status) => {
    const statusObj = allStatuses.find(s => s.code === status);
    if (statusObj) return statusObj;
    
    // Default for unknown or future days
    return { code: '--', icon: 'help', color: '#9E9E9E', name: t('status_unknown') };
  };

  const handleDayPress = (day) => {
    setSelectedDay(day);
    if (day.isFuture) {
      // Không hiển thị chi tiết cho ngày trong tương lai
      return;
    }
    setDetailsModalVisible(true);
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

  // Format hh:mm from ISO string
  const formatTime = (isoString) => {
    if (!isoString) return t('no_data');
    try {
      const date = parseISO(isoString);
      return format(date, 'HH:mm');
    } catch (error) {
      return t('invalid_time');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {t('weekly_status')}
      </Text>
      
      <View style={[styles.grid, { backgroundColor: theme.colors.background }]}>
        {days.map((day) => {
          const dateKey = day.formattedDate;
          // Chỉ hiển thị trạng thái đến ngày hiện tại
          const status = day.isFuture ? '--' : (weeklyStatus[dateKey] || '?');
          const statusInfo = getStatusIcon(status);
          
          return (
            <TouchableOpacity 
              key={dateKey}
              style={[
                styles.dayCell,
                { backgroundColor: theme.colors.surface },
                day.isToday && [styles.todayCell, { backgroundColor: theme.colors.primary + '33' }],
                day.isFuture && styles.futureCell
              ]}
              onPress={() => handleDayPress(day)}
            >
              <Text style={[
                styles.dayName, 
                { color: day.isToday ? theme.colors.primary : theme.colors.textSecondary }
              ]}>
                {day.dayName}
              </Text>
              <Text style={[
                styles.dayNumber, 
                { color: day.isToday ? theme.colors.primary : theme.colors.text }
              ]}>
                {day.day}
              </Text>
              <View style={[
                styles.statusIconContainer, 
                { backgroundColor: day.isToday ? statusInfo.color : statusInfo.color + '80' }
              ]}>
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
      
      {/* Chú thích trạng thái */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
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
        
        <View style={styles.legendRow}>
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
      </View>

      {/* Modal Chi tiết */}
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
                {selectedDay ? `${selectedDay.dayName} ${selectedDay.day}/${format(selectedDay.date, 'MM/yyyy')}` : ''} 
                {' - '}
                {selectedDay ? getStatusIcon(weeklyStatus[selectedDay.formattedDate] || '?').name : ''}
              </Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {selectedDay && statusDetails && statusDetails[selectedDay.formattedDate] ? (
                <>
                  <Text style={[styles.detailLabel, { color: theme.colors.text }]}>
                    {t('check_in_time')}:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
                    {formatTime(statusDetails[selectedDay.formattedDate].checkInTime)}
                  </Text>
                  
                  <Text style={[styles.detailLabel, { color: theme.colors.text }]}>
                    {t('check_out_time')}:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
                    {formatTime(statusDetails[selectedDay.formattedDate].checkOutTime)}
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
                  {t('no_data_available')}
                </Text>
              )}
              
              {!selectedDay?.isFuture && (
                <TouchableOpacity 
                  style={[styles.changeStatusButton, { backgroundColor: theme.colors.primary }]}
                  onPress={openStatusModal}
                >
                  <Text style={styles.changeStatusButtonText}>
                    {t('change_status')}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Modal chọn trạng thái */}
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
            
            <FlatList
              data={allStatuses}
              keyExtractor={(item) => item.code}
              style={styles.statusList}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.statusOption}
                  onPress={() => handleStatusChange(item.code)}
                >
                  <View style={[styles.statusColorDot, { backgroundColor: item.color }]}>
                    {item.fontAwesome ? (
                      <FontAwesome5 name={item.icon} size={14} color="#fff" />
                    ) : (
                      <MaterialIcons name={item.icon} size={14} color="#fff" />
                    )}
                  </View>
                  <Text style={[styles.statusOptionText, { color: theme.colors.text }]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    padding: 8,
    margin: 2,
    height: 80,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#4a86f7',
  },
  futureCell: {
    opacity: 0.7,
  },
  dayName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  todayText: {
    color: '#4a86f7',
  },
  statusIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  legend: {
    marginTop: 10,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
    flex: 1,
    minWidth: '22%',
    maxWidth: '48%',
  },
  legendIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  detailValue: {
    fontSize: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  changeStatusButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  changeStatusButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusColorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOptionText: {
    fontSize: 16,
  },
});

export default WeeklyStatusGrid;
