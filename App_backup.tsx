import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import { BenchmarkProvider } from './app/hooks/BenchmarkContext';
import CaptureScreen from './app/screens/CaptureScreen';
import ResultsScreen from './app/screens/ResultsScreen';

type Screen = 'capture' | 'results';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('capture');

  const navigateToResults = () => setCurrentScreen('results');
  const navigateToCapture = () => setCurrentScreen('capture');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'capture':
        return <CaptureScreen onNavigateToResults={navigateToResults} />;
      case 'results':
        return <ResultsScreen onNavigateToCapture={navigateToCapture} />;
      default:
        return <CaptureScreen onNavigateToResults={navigateToResults} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Navigation Bar */}
      <View style={styles.navigationBar}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentScreen === 'capture' && styles.activeNavButton,
          ]}
          onPress={navigateToCapture}
        >
          <Text style={[
            styles.navButtonText,
            currentScreen === 'capture' && styles.activeNavButtonText,
          ]}>
            Capture
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.navButton,
            currentScreen === 'results' && styles.activeNavButton,
          ]}
          onPress={navigateToResults}
        >
          <Text style={[
            styles.navButtonText,
            currentScreen === 'results' && styles.activeNavButtonText,
          ]}>
            Results
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {renderScreen()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  navigationBar: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingTop: 50, // Account for status bar
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeNavButton: {
    backgroundColor: '#007AFF',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6c757d',
  },
  activeNavButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});
