import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { Engine, TimingMetrics, BenchmarkResult, FileMetrics } from '../types/metrics';
import { getFileStats } from '../utils/fileStats';

export function useCameraMetrics() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [currentTestNumber, setCurrentTestNumber] = useState(1);
  
  const startTimeRef = useRef<number | null>(null);
  const coldStartTimeRef = useRef<number | null>(null);

  const startColdStartTimer = useCallback(() => {
    coldStartTimeRef.current = performance.now ? performance.now() : Date.now();
  }, []);

  const stopColdStartTimer = useCallback((): number | undefined => {
    if (coldStartTimeRef.current === null) return undefined;
    
    const endTime = performance.now ? performance.now() : Date.now();
    const duration = endTime - coldStartTimeRef.current;
    coldStartTimeRef.current = null;
    
    return duration;
  }, []);

  const startShutterTimer = useCallback(() => {
    startTimeRef.current = performance.now ? performance.now() : Date.now();
    setIsCapturing(true);
  }, []);

  const stopShutterTimer = useCallback((): number | undefined => {
    if (startTimeRef.current === null) return undefined;
    
    const endTime = performance.now ? performance.now() : Date.now();
    const duration = endTime - startTimeRef.current;
    startTimeRef.current = null;
    setIsCapturing(false);
    
    return duration;
  }, []);

  const recordBenchmarkResult = useCallback(async (
    engine: Engine,
    photoUri?: string,
    timingOverrides?: Partial<TimingMetrics>
  ) => {
    const timingMetrics: TimingMetrics = {
      coldStartTime: timingOverrides?.coldStartTime,
      shutterLagTime: timingOverrides?.shutterLagTime,
      measurementTimestamp: Date.now(),
    };

    let fileMetrics: FileMetrics | undefined;
    
    if (photoUri) {
      try {
        const stats = await getFileStats(photoUri);
        if (stats.uri) {
          fileMetrics = stats as FileMetrics;
        }
      } catch (error) {
        console.error('Failed to get file stats:', error);
      }
    }

    const result: BenchmarkResult = {
      engine,
      timingMetrics,
      fileMetrics,
      testNumber: currentTestNumber,
      deviceInfo: {
        platform: Platform.OS,
        model: Platform.constants?.systemName || 'Unknown',
        osVersion: Platform.Version?.toString() || 'Unknown',
      },
    };

    setResults(prev => [...prev, result]);
    setCurrentTestNumber(prev => prev + 1);
    
    return result;
  }, [currentTestNumber]);

  const resetBenchmarks = useCallback(() => {
    setResults([]);
    setCurrentTestNumber(1);
    startTimeRef.current = null;
    coldStartTimeRef.current = null;
    setIsCapturing(false);
  }, []);

  const getAverageMetrics = useCallback((engine?: Engine) => {
    const filteredResults = engine 
      ? results.filter(r => r.engine === engine)
      : results;

    if (filteredResults.length === 0) {
      return {
        avgColdStart: 0,
        avgShutterLag: 0,
        avgFileSize: 0,
        count: 0
      };
    }

    const coldStartTimes = filteredResults
      .map(r => r.timingMetrics.coldStartTime)
      .filter((time): time is number => time !== undefined);
      
    const shutterLagTimes = filteredResults
      .map(r => r.timingMetrics.shutterLagTime)
      .filter((time): time is number => time !== undefined);
      
    const fileSizes = filteredResults
      .map(r => r.fileMetrics?.fileSize)
      .filter((size): size is number => size !== undefined);

    return {
      avgColdStart: coldStartTimes.length > 0 
        ? coldStartTimes.reduce((a, b) => a + b, 0) / coldStartTimes.length
        : 0,
      avgShutterLag: shutterLagTimes.length > 0
        ? shutterLagTimes.reduce((a, b) => a + b, 0) / shutterLagTimes.length  
        : 0,
      avgFileSize: fileSizes.length > 0
        ? fileSizes.reduce((a, b) => a + b, 0) / fileSizes.length
        : 0,
      count: filteredResults.length
    };
  }, [results]);

  return {
    // State
    isCapturing,
    results,
    currentTestNumber,
    
    // Timer functions
    startColdStartTimer,
    stopColdStartTimer,
    startShutterTimer,
    stopShutterTimer,
    
    // Data functions
    recordBenchmarkResult,
    resetBenchmarks,
    getAverageMetrics,
  };
} 