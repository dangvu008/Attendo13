import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import { useShift } from '../context/ShiftContext';

const MonthlyStatsScreen = ({ navigation }) => {
  const { theme } = useTheme() || {};
  const { t, locale } = useLocalization() || { locale: 'vi', t: key => key };
  const { workEntries, getMonthlyWorkStats } = useShift() || {};
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Define the column properties
  const columns = [
    { id: 'date', label: t('date'), width: 80 },
    { id: 'dayOfWeek', label: t('day_of_week'), width: 60 },
    { id: 'checkIn', label: t('check_in'), width: 70 },
    { id: 'checkOut', label: t('check_out'), width: 70 },
    { id: 'regularHours', label: t('regular_hours'), width: 70 },
    { id: 'ot150', label: 'OT 150%', width: 70 },
    { id: 'ot200', label: 'OT 200%', width: 70 },
    { id: 'ot300', label: 'OT 300%', width: 70 }
  ];

  // Load monthly data
  useEffect(() => {
    const loadMonthlyData = async () => {
      setIsLoading(true);
      try {
        // In a real app, fetch from API or local storage
        // For now, we'll generate fake data
        const data = generateFakeMonthData(currentMonth);
        setMonthlyData(data);
      } catch (error) {
        console.error('Error loading monthly data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMonthlyData();
  }, [currentMonth]);

  // Change month handlers
  const handlePreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  // Generate fake data for a month
  const generateFakeMonthData = (date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return daysInMonth.map(day => {
      const dayOfWeek = getDay(day);
      // Weekend (0 = Sunday, 6 = Saturday)
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Randomly determine if there's work on this day (more likely on weekdays)
      const hasWork = Math.random() < (isWeekend ? 0.3 : 0.8);
      
      if (hasWork) {
        // Generate random check-in time between 7:00 and 9:30
        const checkInHour = Math.floor(Math.random() * 2) + 7;
        const checkInMinute = Math.floor(Math.random() * 60);
        const checkInTime = `${checkInHour.toString().padStart(2, '0')}:${checkInMinute.toString().padStart(2, '0')}`;
        
        // Generate random check-out time between 16:30 and 20:00
        const checkOutHour = Math.floor(Math.random() * 4) + 16;
        const checkOutMinute = Math.floor(Math.random() * 60);
        const checkOutTime = `${checkOutHour.toString().padStart(2, '0')}:${checkOutMinute.toString().padStart(2, '0')}`;
        
        // Calculate work hours - simplistic calculation for demo
        const regularHours = 8;
        
        // Calculate overtime based on random values
        const hasOT = Math.random() < 0.4;
        const ot150 = hasOT ? (Math.random() * 2).toFixed(1) : '-';
        const ot200 = hasOT && Math.random() < 0.3 ? (Math.random() * 1.5).toFixed(1) : '-';
        const ot300 = hasOT && Math.random() < 0.1 ? (Math.random() * 1).toFixed(1) : '-';
        
        return {
          date: format(day, 'dd/MM/yyyy'),
          dayOfWeek: format(day, 'EEEE', { locale: vi }).substring(0, 5),
          checkIn: checkInTime,
          checkOut: checkOutTime,
          regularHours: regularHours.toString(),
          ot150: ot150,
          ot200: ot200,
          ot300: ot300
        };
      } else {
        // No work on this day
        return {
          date: format(day, 'dd/MM/yyyy'),
          dayOfWeek: format(day, 'EEEE', { locale: vi }).substring(0, 5),
          checkIn: '--:--',
          checkOut: '--:--',
          regularHours: '-',
          ot150: '-',
          ot200: '-',
          ot300: '-'
        };
      }
    });
  };

  // Format the month title
  const formatMonthTitle = (date) => {
    try {
      return `${t('monthly_stats')} ${format(date, 'MM/yyyy')}`;
    } catch (error) {
      console.error('Error formatting month title:', error);
      return `${t('monthly_stats')}`;
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalRegularHours = 0;
    let totalOT150 = 0;
    let totalOT200 = 0;
    let totalOT300 = 0;
    
    monthlyData.forEach(day => {
      if (day.regularHours !== '-') {
        totalRegularHours += parseFloat(day.regularHours);
      }
      
      if (day.ot150 !== '-') {
        totalOT150 += parseFloat(day.ot150);
      }
      
      if (day.ot200 !== '-') {
        totalOT200 += parseFloat(day.ot200);
      }
      
      if (day.ot300 !== '-') {
        totalOT300 += parseFloat(day.ot300);
      }
    });
    
    return {
      regularHours: totalRegularHours.toFixed(1),
      ot150: totalOT150.toFixed(1),
      ot200: totalOT200.toFixed(1),
      ot300: totalOT300.toFixed(1)
    };
  };

  const totals = calculateTotals();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme?.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme?.colors.primary }]}>
        <Text style={styles.headerTitle}>{formatMonthTitle(currentMonth)}</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Month Navigation */}
      <View style={[styles.monthNavigation, { backgroundColor: theme?.colors.card }]}>
        <TouchableOpacity onPress={handlePreviousMonth}>
          <Ionicons name="chevron-back" size={24} color={theme?.colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.monthTitle, { color: theme?.colors.text }]}>
          {format(currentMonth, 'MMMM yyyy', { locale: vi })}
        </Text>
        
        <TouchableOpacity onPress={handleNextMonth}>
          <Ionicons name="chevron-forward" size={24} color={theme?.colors.text} />
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme?.colors.primary} />
        </View>
      ) : (
        <ScrollView horizontal>
          <ScrollView>
            {/* Table Header */}
            <View style={styles.tableContainer}>
              <View style={styles.tableRow}>
                {columns.map(column => (
                  <View key={column.id} style={[styles.tableHeaderCell, { width: column.width, backgroundColor: theme?.colors.primary }]}>
                    <Text style={styles.tableHeaderText}>{column.label}</Text>
                  </View>
                ))}
              </View>
              
              {/* Table Rows */}
              {monthlyData.map((dayData, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.tableRow, 
                    { backgroundColor: index % 2 === 0 ? theme?.colors.card : theme?.colors.background }
                  ]}
                >
                  <View style={[styles.tableCell, { width: columns[0].width }]}>
                    <Text style={[styles.tableCellText, { color: theme?.colors.text }]}>{dayData.date}</Text>
                  </View>
                  
                  <View style={[styles.tableCell, { width: columns[1].width }]}>
                    <Text style={[styles.tableCellText, { color: theme?.colors.text }]}>{dayData.dayOfWeek}</Text>
                  </View>
                  
                  <View style={[styles.tableCell, { width: columns[2].width }]}>
                    <Text style={[styles.tableCellText, { color: theme?.colors.text }]}>{dayData.checkIn}</Text>
                  </View>
                  
                  <View style={[styles.tableCell, { width: columns[3].width }]}>
                    <Text style={[styles.tableCellText, { color: theme?.colors.text }]}>{dayData.checkOut}</Text>
                  </View>
                  
                  <View style={[styles.tableCell, { width: columns[4].width }]}>
                    <Text style={[styles.tableCellText, { color: theme?.colors.text }]}>{dayData.regularHours}</Text>
                  </View>
                  
                  <View style={[styles.tableCell, { width: columns[5].width }]}>
                    <Text style={[styles.tableCellText, { color: theme?.colors.text }]}>{dayData.ot150}</Text>
                  </View>
                  
                  <View style={[styles.tableCell, { width: columns[6].width }]}>
                    <Text style={[styles.tableCellText, { color: theme?.colors.text }]}>{dayData.ot200}</Text>
                  </View>
                  
                  <View style={[styles.tableCell, { width: columns[7].width }]}>
                    <Text style={[styles.tableCellText, { color: theme?.colors.text }]}>{dayData.ot300}</Text>
                  </View>
                </View>
              ))}
              
              {/* Totals Row */}
              <View style={[styles.tableRow, { backgroundColor: theme?.colors.card }]}>
                <View style={[styles.tableCell, { width: columns[0].width + columns[1].width + columns[2].width + columns[3].width }]}>
                  <Text style={[styles.tableTotalText, { color: theme?.colors.text }]}>{t('total')}</Text>
                </View>
                
                <View style={[styles.tableCell, { width: columns[4].width }]}>
                  <Text style={[styles.tableTotalText, { color: theme?.colors.text }]}>{totals.regularHours}</Text>
                </View>
                
                <View style={[styles.tableCell, { width: columns[5].width }]}>
                  <Text style={[styles.tableTotalText, { color: theme?.colors.text }]}>{totals.ot150}</Text>
                </View>
                
                <View style={[styles.tableCell, { width: columns[6].width }]}>
                  <Text style={[styles.tableTotalText, { color: theme?.colors.text }]}>{totals.ot200}</Text>
                </View>
                
                <View style={[styles.tableCell, { width: columns[7].width }]}>
                  <Text style={[styles.tableTotalText, { color: theme?.colors.text }]}>{totals.ot300}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: 4,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableContainer: {
    paddingBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderCell: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 14,
  },
  tableCell: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCellText: {
    fontSize: 14,
  },
  tableTotalText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MonthlyStatsScreen;
