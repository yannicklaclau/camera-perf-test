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
import { CameraView as ExpoCamera, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Camera as VisionCamera, useCameraDevice } from 'react-native-vision-camera';
import * as ImagePicker from 'expo-image-picker';

import CameraToggle from '../components/CameraToggle';
import ShutterButton from '../components/ShutterButton';
import { Engine } from '../types/metrics';
import { useBenchmarkContext } from '../hooks/BenchmarkContext';

interface CaptureScreenProps {
  onNavigateToResults: () => void;
}

export default function CaptureScreen({ onNavigateToResults }: CaptureScreenProps) {
  const [currentEngine, setCurrentEngine] = useState<Engine>(Engine.Vision);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const expoCameraRef = useRef<ExpoCamera>(null);
  const visionCameraRef = useRef<VisionCamera>(null);
  const device = useCameraDevice('back');

  const {
    isCapturing,
    currentTestNumber,
    startColdStartTimer,
    stopColdStartTimer,
    startShutterTimer,
    stopShutterTimer,
    recordBenchmarkResult,
  } = useBenchmarkContext();

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

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  // Watch for permission changes and update hasPermissions accordingly
  useEffect(() => {
    const checkPermissions = async () => {
      console.log('🔍 Checking permissions:', {
        camera: cameraPermission?.granted,
        microphone: microphonePermission?.granted,
        platform: Platform.OS
      });
      
      if (Platform.OS === 'ios') {
        const mediaLibraryPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
        console.log('📱 Media library permission:', mediaLibraryPermission.status);
        
        const allPermissionsGranted = 
          cameraPermission?.granted === true && 
          microphonePermission?.granted === true && 
          mediaLibraryPermission.status === 'granted';
          
        console.log('✅ All permissions granted:', allPermissionsGranted);
        setHasPermissions(allPermissionsGranted);
      } else {
        const allPermissionsGranted = 
          cameraPermission?.granted === true && 
          microphonePermission?.granted === true;
          
        console.log('✅ All permissions granted (Android):', allPermissionsGranted);
        setHasPermissions(allPermissionsGranted);
      }
    };
    
    checkPermissions();
  }, [cameraPermission?.granted, microphonePermission?.granted]);

  const requestPermissions = async () => {
    try {
      let cameraResult = cameraPermission;
      let microphoneResult = microphonePermission;
      
      if (!cameraPermission?.granted) {
        cameraResult = await requestCameraPermission();
      }
      if (!microphonePermission?.granted) {
        microphoneResult = await requestMicrophonePermission();
      }
      
      if (Platform.OS === 'ios') {
        const mediaLibraryResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setHasPermissions(
          cameraResult?.granted === true && 
          microphoneResult?.granted === true && 
          mediaLibraryResult.status === 'granted'
        );
      } else {
        setHasPermissions(
          cameraResult?.granted === true && 
          microphoneResult?.granted === true
        );
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      Alert.alert('Permission Error', 'Failed to request camera permissions');
    }
  };

  const handleCapture = async () => {
    if (!isInitialized || isCapturing) return;

    // 📊 SHUTTER LAG TIMING:
    // ⏱️  START: When capture button is pressed
    // ⏱️  END: When photo file is saved and ready
    // 🎯 GOAL: Time from user action to camera ready for next shot
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
        const result = await recordBenchmarkResult(currentEngine, photoUri, {
          shutterLagTime,
        });
        
        console.log(`📸 ${currentEngine} photo captured in ${shutterLagTime.toFixed(0)}ms`);
        console.log('Benchmark result recorded:', result);
      } else {
        console.log('Missing data:', { photoUri, shutterLagTime });
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
        allowsEditing: false, // Skip preview/edit screen
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
            facing='back'
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