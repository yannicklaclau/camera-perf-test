# Camera Benchmark Timing Methodology

## Shutter Lag Definition

**Shutter lag** is measured from when the capture button is pressed until the photo file is saved and the camera is ready for the next shot.

## Timing by Engine

### 🎯 Vision Camera (`react-native-vision-camera`)

- **Start**: User taps capture button
- **End**: `takePhoto()` promise resolves with file path
- **Advantage**: Fastest, optimized native implementation
- **Preview**: Live camera preview always visible

### 📷 Expo Camera (`expo-camera`)

- **Start**: User taps capture button
- **End**: `takePictureAsync()` promise resolves with file URI
- **Advantage**: Good performance with Expo integration
- **Preview**: Live camera preview always visible

### 📱 Native Camera (iOS Camera App via `expo-image-picker`)

- **Start**: User taps capture button
- **End**: User confirms photo and ImagePicker returns file URI
- **Includes**: Camera app launch time + capture time + user confirmation
- **Note**: This timing is not directly comparable to other engines due to:
  - Cold start of system camera app
  - User interaction required (tap shutter in camera app)
  - Preview/confirmation screen (even with `allowsEditing: false`)

## Timing Considerations

### Multiple Photos

- **Successive shots**: Remove popup between captures for rapid testing
- **Camera readiness**: All engines should be ready immediately after file save

### Fair Comparison Notes

- Vision Camera and Expo Camera: Always-on preview = instant capture
- Native Camera: Includes app launch overhead (~100-300ms typical)
- For fairest comparison, consider separate metrics:
  - **Pure shutter lag**: Vision/Expo only
  - **End-to-end capture**: All engines including native

## Recommendations for Testing

1. Take multiple shots in succession to test camera recovery time
2. Consider separate benchmarks for "instant capture" vs "launch + capture"
3. Test in consistent lighting conditions
4. Use same photo composition/distance for comparable file sizes
