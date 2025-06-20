# Native Camera Optimization

## Issue

The native camera (using `expo-image-picker`) shows a preview/confirmation screen after taking photos, which:

- Slows down rapid successive photo testing
- Adds user interaction time to benchmark measurements
- Makes timing comparison unfair vs Vision/Expo cameras

## Optimization Attempts

### Settings Applied

```javascript
await ImagePicker.launchCameraAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 1,
  allowsEditing: false, // Skip edit screen
  cameraType: ImagePicker.CameraType.back, // Force back camera
  aspect: [4, 3], // Set aspect ratio
  exif: false, // Skip EXIF processing
  base64: false, // Skip base64 encoding
});
```

### Limitations

Unfortunately, iOS system behavior means:

- **Preview screen is mandatory** - iOS always shows photo preview before returning to app
- **User confirmation required** - User must tap "Use Photo" or "Retake"
- **Cannot bypass system UI** - This is iOS Camera app behavior, not controllable via ImagePicker

## Timing Implications

### Native Camera Timing Includes:

1. **App launch time** (~100-300ms)
2. **Camera initialization** (~200-500ms)
3. **User takes photo** (variable)
4. **User confirms photo** (variable, 1-5 seconds)
5. **Return to app** (~100ms)

### Vision/Expo Camera Timing:

1. **User taps button** (instant - camera already running)
2. **Photo capture & save** (~400-600ms)

## Recommendation

- **Use Native Camera results separately** - Best for "end-to-end UX" comparison
- **Use Vision/Expo Camera** for pure shutter lag comparison
- **Document timing methodology** clearly when sharing results
