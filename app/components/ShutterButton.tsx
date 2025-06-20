import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ShutterButtonProps {
  onPress: () => void;
  isCapturing: boolean;
  disabled?: boolean;
  testNumber?: number;
}

export default function ShutterButton({ 
  onPress, 
  isCapturing, 
  disabled = false, 
  testNumber 
}: ShutterButtonProps) {
  return (
    <View style={styles.container}>
      {testNumber && (
        <Text style={styles.testNumber}>Test #{testNumber}</Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.button,
          isCapturing && styles.capturingButton,
          disabled && styles.disabledButton,
        ]}
        onPress={onPress}
        disabled={disabled || isCapturing}
        activeOpacity={0.8}
      >
        <View style={[
          styles.innerButton,
          isCapturing && styles.capturingInner,
          disabled && styles.disabledInner,
        ]}>
          {isCapturing ? (
            <ActivityIndicator size="large" color="#ffffff" />
          ) : (
            <View style={[
              styles.shutterIcon,
              disabled && styles.disabledIcon,
            ]} />
          )}
        </View>
      </TouchableOpacity>
      
      <Text style={[
        styles.buttonLabel,
        isCapturing && styles.capturingLabel,
        disabled && styles.disabledLabel,
      ]}>
        {isCapturing ? 'Capturing...' : disabled ? 'Disabled' : 'Capture'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  testNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  capturingButton: {
    borderColor: '#28a745',
    backgroundColor: '#f8fff9',
  },
  disabledButton: {
    borderColor: '#ced4da',
    backgroundColor: '#f8f9fa',
    shadowOpacity: 0.1,
  },
  innerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturingInner: {
    backgroundColor: '#28a745',
  },
  disabledInner: {
    backgroundColor: '#adb5bd',
  },
  shutterIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffffff',
  },
  disabledIcon: {
    backgroundColor: '#e9ecef',
  },
  buttonLabel: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
  },
  capturingLabel: {
    color: '#28a745',
  },
  disabledLabel: {
    color: '#adb5bd',
  },
}); 