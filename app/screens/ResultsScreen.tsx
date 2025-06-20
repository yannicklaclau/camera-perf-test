import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Clipboard from '@react-native-clipboard/clipboard';

import { useBenchmarkContext } from '../hooks/BenchmarkContext';
import { Engine, BenchmarkResult } from '../types/metrics';
import { formatFileSize, exportResultsToCSV } from '../utils/fileStats';

interface ResultsScreenProps {
  onNavigateToCapture: () => void;
}

export default function ResultsScreen({ onNavigateToCapture }: ResultsScreenProps) {
  const { results, resetBenchmarks, getAverageMetrics } = useBenchmarkContext();

  const handleCopyCSV = async () => {
    try {
      const csvContent = exportResultsToCSV(results);
      Clipboard.setString(csvContent);
      Alert.alert('Copied!', 'CSV data copied to clipboard');
    } catch (error) {
      console.error('Copy failed:', error);
      Alert.alert('Copy Failed', 'Could not copy CSV to clipboard');
    }
  };

  const handleCopyJSON = async () => {
    try {
      const jsonContent = JSON.stringify(results, null, 2);
      Clipboard.setString(jsonContent);
      Alert.alert('Copied!', 'JSON data copied to clipboard');
    } catch (error) {
      console.error('Copy failed:', error);
      Alert.alert('Copy Failed', 'Could not copy JSON to clipboard');
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvContent = exportResultsToCSV(results);
      const fileUri = `${FileSystem.documentDirectory}benchmark-results-${Date.now()}.csv`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Benchmark Results',
        });
      } else {
        Alert.alert('Export Complete', `Results saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Could not export results');
    }
  };

  const handleExportJSON = async () => {
    try {
      const jsonContent = JSON.stringify(results, null, 2);
      const fileUri = `${FileSystem.documentDirectory}benchmark-results-${Date.now()}.json`;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Benchmark Results',
        });
      } else {
        Alert.alert('Export Complete', `Results saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Could not export results');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Results',
      'Are you sure you want to clear all benchmark results?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetBenchmarks },
      ]
    );
  };

  const renderSummaryCard = (engine: Engine) => {
    const metrics = getAverageMetrics(engine);
    const engineResults = results.filter(r => r.engine === engine);
    
    if (engineResults.length === 0) return null;

    return (
      <View key={engine} style={styles.summaryCard}>
        <Text style={styles.engineTitle}>{engine}</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Tests</Text>
            <Text style={styles.metricValue}>{metrics.count}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Avg Shutter Lag</Text>
            <Text style={styles.metricValue}>
              {metrics.avgShutterLag > 0 ? `${metrics.avgShutterLag.toFixed(0)}ms` : 'N/A'}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Avg File Size</Text>
            <Text style={styles.metricValue}>
              {metrics.avgFileSize > 0 ? formatFileSize(metrics.avgFileSize) : 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderResultRow = (result: BenchmarkResult, index: number) => (
    <View key={`${result.engine}-${result.testNumber}-${index}`} style={styles.resultRow}>
      <Text style={styles.cellText}>{result.testNumber}</Text>
      <Text style={styles.cellText}>{result.engine}</Text>
      <Text style={styles.cellText}>
        {result.timingMetrics.shutterLagTime 
          ? `${result.timingMetrics.shutterLagTime.toFixed(0)}ms`
          : 'N/A'
        }
      </Text>
      <Text style={styles.cellText}>
        {result.fileMetrics?.fileSize 
          ? formatFileSize(result.fileMetrics.fileSize)
          : 'N/A'
        }
      </Text>
      <Text style={styles.cellText}>
        {result.fileMetrics 
          ? `${result.fileMetrics.width}×${result.fileMetrics.height}`
          : 'N/A'
        }
      </Text>
      <Text style={styles.cellText}>
        {result.fileMetrics?.format || 'N/A'}
      </Text>
    </View>
  );

  if (results.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Benchmark Results</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No benchmark results yet</Text>
          <TouchableOpacity style={styles.button} onPress={onNavigateToCapture}>
            <Text style={styles.buttonText}>Start Testing</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Benchmark Results</Text>
        <Text style={styles.subtitle}>{results.length} tests completed</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          {[Engine.Native, Engine.Expo, Engine.Vision].map(renderSummaryCard)}
        </View>

        {/* Detailed Results Table */}
        <View style={styles.tableSection}>
          <Text style={styles.sectionTitle}>Detailed Results</Text>
          
          {/* Table Header */}
          <View style={[styles.resultRow, styles.headerRow]}>
            <Text style={styles.headerText}>Test #</Text>
            <Text style={styles.headerText}>Engine</Text>
            <Text style={styles.headerText}>Shutter Lag</Text>
            <Text style={styles.headerText}>File Size</Text>
            <Text style={styles.headerText}>Resolution</Text>
            <Text style={styles.headerText}>Format</Text>
          </View>

          {/* Table Data */}
          {results.map(renderResultRow)}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
          <Text style={styles.secondaryButtonText}>Reset</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyCSV}>
          <Text style={styles.copyButtonText}>📋 CSV</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyJSON}>
          <Text style={styles.copyButtonText}>📋 JSON</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleExportCSV}>
          <Text style={styles.buttonText}>💾 Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  engineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  tableSection: {
    marginBottom: 24,
  },
  resultRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerRow: {
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
  },
  cellText: {
    flex: 1,
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 70,
  },
  copyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 