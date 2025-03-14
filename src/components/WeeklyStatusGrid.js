import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format, startOfWeek, addDays, isToday, isBefore, parseISO } from 'date-fns';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const WeeklyStatusGrid = ({ weeklyStatus }) => {
  // Generate days for the current week starting from Monday
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Monday
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfCurrentWeek, i);
    return {
      date,
      day: format(date, 'd'),
      dayName: format(date, 'EEE').substring(0, 1).toUpperCase() + format(date, 'EEE').substring(1, 2),
      formattedDate: format(date, 'yyyy-MM-dd'),
      isPast: isBefore(date, today) && !isToday(date),
      isToday: isToday(date),
      isFuture: !isToday(date) && !isBefore(date, today)
    };
  });

  // Status icon mappings
  const getStatusIcon = (status) => {
    switch (status) {
      case '!':
        return { icon: 'warning', color: '#FFC107', name: 'Thiếu chấm công' };
      case '✓':
        return { icon: 'check-circle', color: '#4CAF50', name: 'Đủ công' };
      case '?':
      case '--':
        return { icon: 'help', color: '#9E9E9E', name: 'Chưa cập nhật' };
      case 'P':
        return { icon: 'email', color: '#2196F3', name: 'Nghỉ phép' };
      case 'B':
        return { icon: 'sick', color: '#E91E63', name: 'Nghỉ bệnh', fontAwesome: true };
      case 'H':
        return { icon: 'flag', color: '#673AB7', name: 'Nghỉ lễ' };
      case 'X':
        return { icon: 'close', color: '#F44336', name: 'Vắng không lý do' };
      case 'RV':
        return { icon: 'timelapse', color: '#FF9800', name: 'Vào muộn/Ra sớm' };
      default:
        return { icon: 'help', color: '#9E9E9E', name: 'Chưa cập nhật' };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {days.map((day) => {
          const dateKey = day.formattedDate;
          const status = weeklyStatus[dateKey] || (day.isFuture ? '--' : '?');
          const statusInfo = getStatusIcon(status);
          
          return (
            <TouchableOpacity 
              key={dateKey}
              style={[
                styles.dayCell,
                day.isToday && styles.todayCell,
                day.isFuture && styles.futureCell
              ]}
              disabled={day.isFuture}
            >
              <Text style={[styles.dayName, day.isToday && styles.todayText]}>
                {day.dayName}
              </Text>
              <Text style={[styles.dayNumber, day.isToday && styles.todayText]}>
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
        <View style={styles.legendItem}>
          <View style={[styles.legendIcon, { backgroundColor: '#4CAF50' }]}>
            <MaterialIcons name="check-circle" size={12} color="#fff" />
          </View>
          <Text style={styles.legendText}>Đủ công</Text>
        </View>
        
        <View style={styles.legendItem}>
          <View style={[styles.legendIcon, { backgroundColor: '#FFC107' }]}>
            <MaterialIcons name="warning" size={12} color="#fff" />
          </View>
          <Text style={styles.legendText}>Thiếu chấm công</Text>
        </View>
        
        <View style={styles.legendItem}>
          <View style={[styles.legendIcon, { backgroundColor: '#FF9800' }]}>
            <MaterialIcons name="timelapse" size={12} color="#fff" />
          </View>
          <Text style={styles.legendText}>Vào muộn/Ra sớm</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  dayCell: {
    width: 40,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  todayCell: {
    backgroundColor: '#6200ee',
  },
  futureCell: {
    opacity: 0.5,
  },
  dayName: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  todayText: {
    color: '#fff',
  },
  statusIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9E9E9E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
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
    color: '#555',
  },
});

export default WeeklyStatusGrid;
