import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';
import { FileMetrics } from '../types/metrics';

export async function getFileStats(uri: string): Promise<Partial<FileMetrics>> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    if (!fileInfo.exists) {
      throw new Error(`File does not exist: ${uri}`);
    }

    const stats: Partial<FileMetrics> = {
      uri,
      fileSize: fileInfo.size || 0,
      format: getFileFormat(uri),
    };

    // Try to get image dimensions if possible
    try {
      const dimensions = await getImageDimensions(uri);
      stats.width = dimensions.width;
      stats.height = dimensions.height;
    } catch (error) {
      console.warn('Could not get image dimensions:', error);
    }

    return stats;
  } catch (error) {
    console.error('Error getting file stats:', error);
    return {
      uri,
      fileSize: 0,
      format: 'unknown',
      width: 0,
      height: 0,
    };
  }
}

function getFileFormat(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'JPEG';
    case 'heic':
      return 'HEIC';
    case 'png':
      return 'PNG';
    default:
      return extension || 'unknown';
  }
}

async function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width: number, height: number) => {
        resolve({ width, height });
      },
      (error: any) => {
        reject(error);
      }
    );
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function exportResultsToCSV(results: any[]): string {
  if (results.length === 0) return '';

  const headers = [
    'Engine',
    'Test Number',
    'Cold Start (ms)',
    'Shutter Lag (ms)',
    'File Size (bytes)',
    'Resolution',
    'Format',
    'Timestamp'
  ];

  const csvContent = [
    headers.join(','),
    ...results.map(result => [
      result.engine,
      result.testNumber,
      result.timingMetrics.coldStartTime || '',
      result.timingMetrics.shutterLagTime || '',
      result.fileMetrics?.fileSize || '',
      result.fileMetrics ? `${result.fileMetrics.width}x${result.fileMetrics.height}` : '',
      result.fileMetrics?.format || '',
      new Date(result.timingMetrics.measurementTimestamp).toISOString()
    ].join(','))
  ].join('\n');

  return csvContent;
} 