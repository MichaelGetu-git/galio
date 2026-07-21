import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

let RNVideo: any = null;
try {
  RNVideo = require('react-native-video').default;
} catch {}

// react-native-video v6's precompiled build renders a legacy Paper view via
// `requireNativeComponent('RCTVideo')`. That call does NOT throw at import time
// — it throws "View config not found for component RCTVideo" later, during
// commit, if the RCTVideo view manager isn't in the running binary (e.g. the app
// wasn't rebuilt after adding the dependency, or Fabric codegen didn't register
// it). A render-phase throw still flashes a redbox in dev even with an error
// boundary, so we detect availability UP FRONT: `requireNativeComponent`
// requires exactly this view-config lookup to succeed, so mirroring it here lets
// us render the placeholder instead of ever mounting the throwing component.
const RCT_VIDEO_REGISTERED =
  typeof UIManager.getViewManagerConfig === 'function' &&
  UIManager.getViewManagerConfig('RCTVideo') != null;

const VIDEO_AVAILABLE = !!RNVideo && RCT_VIDEO_REGISTERED;

interface VideoPlayerProps {
  uri: string;
  style?: any;
}

/**
 * A build can ship the react-native-video JS but NOT its native view — e.g. the
 * app binary was built before the dependency was added, or Fabric codegen for it
 * is missing. Rendering <RCTVideo> then throws "View config not found for
 * component RCTVideo" during commit, which the `try/catch` around require cannot
 * catch (it's a render-phase error, not an import error). This error boundary
 * converts that hard crash into a graceful placeholder, with no need to probe
 * native availability up front (which is unreliable under the New Architecture).
 */
class VideoErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    // Swallow: the native video view isn't available in this build.
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function VideoUnavailable({ style, message }: { style?: any; message: string }) {
  return (
    <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#999', textAlign: 'center' }}>{message}</Text>
    </View>
  );
}

export function VideoPlayer({ uri, style }: VideoPlayerProps) {
  const [paused, setPaused] = useState(true);

  // No JS module, OR the native RCTVideo view isn't in this build. Either way,
  // mounting <RNVideo> would crash — show the placeholder instead. This check is
  // proactive (before render), so no redbox flashes in dev.
  if (!VIDEO_AVAILABLE) {
    const message = !RNVideo
      ? 'Video requires\nreact-native-video'
      : 'Video unavailable\n(native module not in this build)';
    return <VideoUnavailable style={style} message={message} />;
  }

  return (
    <VideoErrorBoundary
      fallback={
        <VideoUnavailable
          style={style}
          message={'Video unavailable\n(native module not in this build)'}
        />
      }
    >
      <View style={style}>
        <RNVideo
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          paused={paused}
          resizeMode="contain"
          repeat
        />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setPaused(!paused)}
          accessibilityRole="button"
          accessibilityLabel={paused ? 'Play video' : 'Pause video'}
        >
          {paused && (
            <View style={styles.playButton}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          )}
        </Pressable>
      </View>
    </VideoErrorBoundary>
  );
}

const styles = StyleSheet.create({
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -30,
    marginTop: -30,
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 24,
  },
});
