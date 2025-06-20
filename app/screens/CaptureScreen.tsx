import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Camera as ExpoCamera } from 'expo-camera';
import { Camera as VisionCamera, useCameraDevices } from 'react-native-vision-camera';
import * as ImagePicker from 'expo-image-picker';

import CameraToggle from '../components/CameraToggle';
import ShutterButton from '../components/ShutterButton';
import { Engine } from '../types/metrics';
import { useCameraMetrics } from '../hooks/useCameraMetrics';

interface CaptureScreenProps {
  onNavigateToResults: () => void;
}

export default function CaptureScreen({ onNavigateToResults }: CaptureScreenProps) {
  const [currentEngine, setCurrentEngine] = useState<Engine>(Engine.Vision);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const expoCameraRef = useRef<ExpoCamera>(null);
  const visionCameraRef = useRef<VisionCamera>(null);
  const devices = useCameraDevices();
  const device = devices.back;

  const {
    isCapturing,
    currentTestNumber,
    startColdStartTimer,
    stopColdStartTimer,
    startShutterTimer,
    stopShutterTimer,
    recordBenchmarkResult,
  } = useCameraMetrics();

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    if (hasPermissions) {
      startColdStartTimer();
      const timeout = setTimeout(() => {
        setIsInitialized(true);
        const coldStartTime = stopColdStartTimer();
        if (coldStartTime) {
          console.log(`Cold start time for ${currentEngine}: ${coldStartTime}ms`);
        }
      }, 100); // Small delay to simulate initialization

      return () => clearTimeout(timeout);
    }
  }, [currentEngine, hasPermissions, startColdStartTimer, stopColdStartTimer]);

  const requestPermissions = async () => {
    try {
      const { status: cameraStatus } = await ExpoCamera.requestCameraPermissionsAsync();
      const { status: audioStatus } = await ExpoCamera.requestMicrophonePermissionsAsync();
      
      if (Platform.OS === 'ios') {
        const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setHasPermissions(cameraStatus === 'granted' && audioStatus === 'granted' && mediaLibraryStatus === 'granted');
      } else {
        setHasPermissions(cameraStatus === 'granted' && audioStatus === 'granted');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      Alert.alert('Permission Error', 'Failed to request camera permissions');
    }
  };

  const handleCapture = async () => {
    if (!isInitialized || isCapturing) return;

    startShutterTimer();

    try {
      let photoUri: string | undefined;

      switch (currentEngine) {
        case Engine.Native:
          photoUri = await captureWithNativeCamera();
          break;
        case Engine.Expo:
          photoUri = await captureWithExpoCamera();
          break;
        case Engine.Vision:
          photoUri = await captureWithVisionCamera();
          break;
      }

      const shutterLagTime = stopShutterTimer();

      if (photoUri && shutterLagTime) {
        await recordBenchmarkResult(currentEngine, photoUri, {
          shutterLagTime,
        });
        
        Alert.alert(
          'Capture Complete',
          `Photo captured in ${shutterLagTime.toFixed(0)}ms`,
          [
            { text: 'Continue', style: 'default' },
            { text: 'View Results', onPress: onNavigateToResults },
          ]
        );
      }
    } catch (error) {
      stopShutterTimer();
      console.error('Capture failed:', error);
      Alert.alert('Capture Failed', `Error: ${error}`);
    }
  };

  const captureWithNativeCamera = async (): Promise<string | undefined> => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
    } catch (error) {
      console.error('Native camera capture failed:', error);
    }
    return undefined;
  };

  const captureWithExpoCamera = async (): Promise<string | undefined> => {
    if (!expoCameraRef.current) return undefined;

    try {
      const photo = await expoCameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });
      return photo.uri;
    } catch (error) {
      console.error('Expo camera capture failed:', error);
    }
    return undefined;
  };

  const captureWithVisionCamera = async (): Promise<string | undefined> => {
    if (!visionCameraRef.current) return undefined;

    try {
      const photo = await visionCameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'off',
      });
      return `file://${photo.path}`;
    } catch (error) {
      console.error('Vision camera capture failed:', error);
    }
    return undefined;
  };

  const renderCamera = () => {
    if (!hasPermissions) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>Camera permissions required</Text>
        </View>
      );
    }

    if (!isInitialized) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>Initializing camera...</Text>
        </View>
      );
    }

    switch (currentEngine) {
      case Engine.Native:
        return (
          <View style={styles.cameraContainer}>
            <Text style={styles.nativeCameraText}>
              Native Camera{'\n'}
              (Will launch system camera on capture)
            </Text>
          </View>
        );

      case Engine.Expo:
        return (
          <ExpoCamera
            ref={expoCameraRef}
            style={styles.camera}
            type={ExpoCamera.Constants.Type.back}
            autoFocus={ExpoCamera.Constants.AutoFocus.on}
          />
        );

      case Engine.Vision:
        if (!device) {
          return (
            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>No camera device available</Text>
            </View>
          );
        }
        
        return (
          <VisionCamera
            ref={visionCameraRef}
            style={styles.camera}
            device={device}
            isActive={true}
            photo={true}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Camera Benchmark</Text>
        <Text style={styles.subtitle}>
          Test {currentTestNumber} • {currentEngine}
        </Text>
      </View>

      <CameraToggle
        currentEngine={currentEngine}
        onEngineChange={(engine) => {
          if (!isCapturing) {
            setCurrentEngine(engine);
            setIsInitialized(false);
          }
        }}
        disabled={isCapturing}
      />

      <View style={styles.cameraSection}>
        {renderCamera()}
      </View>

      <ShutterButton
        onPress={handleCapture}
        isCapturing={isCapturing}
        disabled={!isInitialized}
        testNumber={currentTestNumber}
      />
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
  cameraSection: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeCameraText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  messageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  messageText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
}); 