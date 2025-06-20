export enum Engine {
  Native = 'Native',
  Expo = 'ExpoCamera', 
  Vision = 'VisionCamera'
}

export interface TimingMetrics {
  coldStartTime?: number;
  shutterLagTime?: number;
  measurementTimestamp: number;
}

export interface FileMetrics {
  uri: string;
  width: number;
  height: number;
  fileSize: number; // bytes
  format: string;
  codec?: string;
}

export interface BenchmarkResult {
  engine: Engine;
  timingMetrics: TimingMetrics;
  fileMetrics?: FileMetrics;
  testNumber: number;
  deviceInfo: {
    platform: string;
    model?: string;
    osVersion?: string;
  };
}

export interface BenchmarkState {
  currentEngine: Engine;
  isCapturing: boolean;
  results: BenchmarkResult[];
  currentTestNumber: number;
} 