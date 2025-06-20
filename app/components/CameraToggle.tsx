import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Engine } from '../types/metrics';

interface CameraToggleProps {
  currentEngine: Engine;
  onEngineChange: (engine: Engine) => void;
  disabled?: boolean;
}

export default function CameraToggle({ currentEngine, onEngineChange, disabled = false }: CameraToggleProps) {
  const engines = [
    { value: Engine.Native, label: 'Native Camera', description: 'iOS Camera App' },
    { value: Engine.Expo, label: 'Expo Camera', description: 'expo-camera library' },
    { value: Engine.Vision, label: 'Vision Camera', description: 'react-native-vision-camera' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Camera Engine</Text>
      {engines.map((engine) => (
        <TouchableOpacity
          key={engine.value}
          style={[
            styles.option,
            currentEngine === engine.value && styles.selectedOption,
            disabled && styles.disabledOption,
          ]}
          onPress={() => !disabled && onEngineChange(engine.value)}
          disabled={disabled}
        >
          <View style={styles.radioContainer}>
            <View style={[
              styles.radioButton,
              currentEngine === engine.value && styles.radioButtonSelected,
              disabled && styles.radioButtonDisabled,
            ]}>
              {currentEngine === engine.value && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.labelContainer}>
              <Text style={[
                styles.engineLabel,
                currentEngine === engine.value && styles.selectedLabel,
                disabled && styles.disabledLabel,
              ]}>
                {engine.label}
              </Text>
              <Text style={[
                styles.engineDescription,
                disabled && styles.disabledDescription,
              ]}>
                {engine.description}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2c3e50',
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  disabledOption: {
    opacity: 0.5,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#adb5bd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
  },
  radioButtonDisabled: {
    borderColor: '#ced4da',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  labelContainer: {
    flex: 1,
  },
  engineLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 2,
  },
  selectedLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  disabledLabel: {
    color: '#adb5bd',
  },
  engineDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  disabledDescription: {
    color: '#ced4da',
  },
}); 