import React, { createContext, useContext, ReactNode } from 'react';
import { useCameraMetrics } from './useCameraMetrics';
import { Engine, BenchmarkResult, TimingMetrics } from '../types/metrics';

interface BenchmarkContextType {
  isCapturing: boolean;
  results: BenchmarkResult[];
  currentTestNumber: number;
  startColdStartTimer: () => void;
  stopColdStartTimer: () => number | undefined;
  startShutterTimer: () => void;
  stopShutterTimer: () => number | undefined;
  recordBenchmarkResult: (engine: Engine, photoUri?: string, timingOverrides?: Partial<TimingMetrics>) => Promise<BenchmarkResult>;
  resetBenchmarks: () => void;
  getAverageMetrics: (engine?: Engine) => {
    avgColdStart: number;
    avgShutterLag: number;
    avgFileSize: number;
    count: number;
  };
}

const BenchmarkContext = createContext<BenchmarkContextType | null>(null);

interface BenchmarkProviderProps {
  children: ReactNode;
}

export function BenchmarkProvider({ children }: BenchmarkProviderProps) {
  const metrics = useCameraMetrics();

  return (
    <BenchmarkContext.Provider value={metrics}>
      {children}
    </BenchmarkContext.Provider>
  );
}

export function useBenchmarkContext() {
  const context = useContext(BenchmarkContext);
  if (!context) {
    throw new Error('useBenchmarkContext must be used within a BenchmarkProvider');
  }
  return context;
} 