import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../i18n';

const MultiActionButton = ({ status, label, iconName, color, onPress, disabled }) => {
  // Animation effect for urgent statuses
  const isUrgent = status === 'check_in' || status === 'check_out';
  
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

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        <Ionicons name={iconName} size={35} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonLabel}>{i18n.t(label)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
