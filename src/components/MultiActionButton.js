import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../i18n';

const MultiActionButton = ({ status, label, iconName, color, onPress, disabled }) => {
  // Animation effect for urgent statuses
  const isUrgent = status === 'check_in' || status === 'check_out';
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Start pulse animation for urgent statuses
  useEffect(() => {
    if (isUrgent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isUrgent, pulseAnim]);
  
  // Define styles for each status
  const getButtonStyle = () => {
    const baseStyle = [styles.button, { backgroundColor: color }, disabled && styles.disabledButton];
    
    // Add special styles for different statuses
    switch(status) {
      case 'go_work':
        return [...baseStyle, { borderWidth: 0 }];
      case 'check_in':
        return [...baseStyle, { borderWidth: 4, borderColor: '#fff' }];
      case 'check_out':
        return [...baseStyle, { borderWidth: 4, borderColor: '#fff' }];
      case 'complete':
        return [...baseStyle, { borderWidth: 4, borderColor: '#fff' }];
      case 'completed':
        return [...baseStyle, { opacity: 0.7 }];
      default:
        return baseStyle;
    }
  };

  // Get status icon based on status
  const getStatusIcon = () => {
    switch(status) {
      case 'go_work':
        return 'briefcase-outline';
      case 'check_in':
        return 'log-in-outline';
      case 'check_out':
        return 'log-out-outline';
      case 'complete':
        return 'checkmark-done-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      default:
        return iconName || 'time-outline';
    }
  };

  // Get status label based on status
  const getStatusLabel = () => {
    switch(status) {
      case 'go_work':
        return i18n.t('goToWork');
      case 'check_in':
        return i18n.t('checkIn');  
      case 'check_out':
        return i18n.t('checkOut');
      case 'complete':
        return i18n.t('complete');
      case 'completed':
        return i18n.t('workCompleted');
      default:
        return label || '';
    }
  };

  return (
    <View style={styles.buttonWrapper}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Animated.View 
          style={[
            styles.buttonContent,
            isUrgent && { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <Ionicons 
            name={getStatusIcon()} 
            size={35} 
            color="#fff" 
            style={styles.buttonIcon} 
          />
          <Text style={styles.buttonLabel}>{getStatusLabel()}</Text>
        </Animated.View>
      </TouchableOpacity>
      
  
    </View>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    position: 'relative',
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginBottom: 8,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },

});

export default MultiActionButton;
