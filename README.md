# Camera Benchmark Test Harness

A React Native app for benchmarking camera performance across Apple's native Camera app, Expo Camera, and react-native-vision-camera on iOS devices.

## Features

- **Multi-Engine Testing**: Compare Native Camera, Expo Camera, and VisionCamera
- **Performance Metrics**: Measure cold-start latency and shutter-to-file time
- **File Analysis**: Capture resolution, file size, and format details
- **Export Results**: Generate CSV and JSON reports for analysis
- **Real Device Testing**: Designed for iPhone testing with USB/Wi-Fi

## Quick Start

### Prerequisites

- macOS with Xcode installed
- iOS device or Simulator
- Node.js 18+ and npm
- Expo CLI: `npm install -g @expo/cli`

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **For iOS development, install pods:**

   ```bash
   cd ios && pod install && cd ..
   ```

3. **Start the development server:**

   ```bash
   npx expo start
   ```

4. **Run on device:**
   - Scan QR code with Expo Go app, or
   - Press `i` to run in iOS Simulator, or
   - Press `a` to run on Android device/emulator

## Running Benchmarks

### 1. Setup Your Testing Environment

- **Hardware**: Use a single iPhone model for consistent results
- **Lighting**: Use consistent lighting (tripod + constant light source recommended)
- **Focus**: Lock exposure and focus to eliminate scene variability

### 2. Conduct Tests

1. **Launch the app** and grant camera permissions
2. **Select camera engine** using the toggle (Native/Expo/VisionCamera)
3. **Take photos** using the shutter button - timing is measured automatically
4. **Repeat tests** - aim for 5-10 samples per engine for statistical significance
5. **Switch engines** and repeat the process

### 3. Analyze Results

1. **View Results screen** to see summary statistics and detailed measurements
2. **Export data** in CSV format for spreadsheet analysis
3. **Export JSON** for programmatic analysis or archival

## Understanding the Metrics

### Cold-Start Latency

- **What it measures**: Time from engine selection to first preview frame
- **Why it matters**: User experience when switching camera modes
- **Typical ranges**:
  - VisionCamera: 600-1000ms
  - Expo Camera: 2-3s (managed workflow)
  - Native: ~0s (system app)

### Shutter-to-File Time

- **What it measures**: Time from shutter press to file written
- **Why it matters**: Responsiveness and user experience
- **Typical ranges**:
  - Native: Fastest (benefits from ISP fusion)
  - VisionCamera: Close to native with `qualityPrioritization: 'speed'`
  - Expo Camera: Slower, extra 200-400ms write time

### File Properties

- **Resolution**: Width × Height in pixels
- **File Size**: Bytes on disk (varies by codec and quality)
- **Format**: HEIC/JPEG/PNG depending on settings

## Expected Results

| Engine            | Launch Time    | Shutter Lag          | Avg File Size | Notes                 |
| ----------------- | -------------- | -------------------- | ------------- | --------------------- |
| **Native Camera** | 0s (system)    | ★ Fastest            | 2-4 MB HEIC   | Deep Fusion/Smart HDR |
| **VisionCamera**  | 0.6-1.0s       | Very close to native | 1.5-3 MB      | Configurable quality  |
| **Expo Camera**   | 2-3s (managed) | +200-400ms slower    | 1-2 MB JPEG   | Great for prototypes  |

_Results based on iPhone 15 running iOS 18_

## Advanced Configuration

### VisionCamera Settings

Edit `app/screens/CaptureScreen.tsx` to adjust VisionCamera photo settings:

```typescript
const photo = await visionCameraRef.current.takePhoto({
  qualityPrioritization: "quality", // or 'speed'
  flash: "off",
  // photoCodec: 'hevc', // Force HEIC
});
```

### Expo Camera Settings

Adjust quality settings in the same file:

```typescript
const photo = await expoCameraRef.current.takePictureAsync({
  quality: 1, // 0-1 (1 = highest quality)
  skipProcessing: false, // true for faster capture
});
```

## Troubleshooting

### TypeScript Errors

If you see module resolution errors, run:

```bash
npx expo install --fix
```

### Camera Permissions

- Ensure all camera permissions are granted in Settings > Privacy
- Restart the app after granting permissions

### Vision Camera Issues

- Make sure you're testing on a physical device (not simulator)
- Check that pods are properly installed: `cd ios && pod install`

### Performance Issues

- Close other apps to free memory
- Use airplane mode to avoid network interference during timing
- Let device cool between test sessions to avoid thermal throttling

## Exporting and Analysis

### CSV Export

- Contains all timing and file metrics
- Import into Excel/Google Sheets for charts and statistical analysis
- Headers: Engine, Test Number, Cold Start, Shutter Lag, File Size, Resolution, Format

### JSON Export

- Complete raw data including device info and timestamps
- Useful for programmatic analysis or custom dashboards
- Preserves full precision of measurements

## Best Practices

1. **Consistent Environment**: Same lighting, distance, and subject
2. **Multiple Samples**: Take 5-10 photos per engine for averages
3. **Cool Down**: Let device rest between intensive test sessions
4. **Document Setup**: Note device model, iOS version, lighting conditions
5. **Statistical Analysis**: Use averages and note outliers

## Architecture

```
app/
├── components/
│   ├── CameraToggle.tsx     # Engine selection UI
│   └── ShutterButton.tsx    # Capture button with timing
├── screens/
│   ├── CaptureScreen.tsx    # Main camera interface
│   └── ResultsScreen.tsx    # Results display & export
├── hooks/
│   └── useCameraMetrics.ts  # Timing and data management
├── types/
│   └── metrics.d.ts         # TypeScript definitions
└── utils/
    └── fileStats.ts         # File analysis utilities
```

## Contributing

This benchmark is designed to be lightweight and focused. When adding features:

- Keep dependencies minimal
- Prioritize measurement accuracy over UI polish
- Document any changes that might affect timing
- Test on multiple device models when possible

## License

MIT License - Feel free to modify for your specific benchmarking needs.
