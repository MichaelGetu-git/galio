import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

let RNVideo: any = null;
try {
  RNVideo = require('react-native-video').default;
} catch {}

interface VideoPlayerProps {
  uri: string;
  style?: any;
}

export function VideoPlayer({ uri, style }: VideoPlayerProps) {
  const [paused, setPaused] = useState(true);

  if (!RNVideo) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#999', textAlign: 'center' }}>
          Video requires{'\n'}react-native-video
        </Text>
      </View>
    );
  }

  return (
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
        accessibilityLabel={paused ? 'Play video' : 'Pause video'}
      >
        {paused && (
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        )}
      </Pressable>
    </View>
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
