import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import MediaGallery from '../src/MediaGallery';

const TEST_ITEMS = Array.from({ length: 10 }, (_, i) => ({
  uri: `https://picsum.photos/seed/${i}/800/800`,
  type: (i % 3 === 0 ? 'video' : 'image') as 'image' | 'video',
}));

export function MemoryLeakTest() {
  const [visible, setVisible] = useState(false);
  const [running, setRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleRef = useRef(0);

  const scheduleNext = useCallback(() => {
    if (cycleRef.current >= 100) {
      setRunning(false);
      console.log(`[MemoryLeakTest] Completed ${cycleRef.current} cycles`);
      return;
    }
    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, 600);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    cycleRef.current += 1;
    setCycleCount(cycleRef.current);
    console.log(`[MemoryLeakTest] Cycle ${cycleRef.current}/100 — heap used`);
    scheduleNext();
  }, [scheduleNext]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleStart = useCallback(() => {
    cycleRef.current = 0;
    setCycleCount(0);
    setRunning(true);
    console.log('[MemoryLeakTest] Starting 100-cycle leak test');
    scheduleNext();
  }, [scheduleNext]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MediaGallery — Memory Leak Test</Text>
      <Text style={styles.counter}>
        Cycle: {cycleCount} / 100
        {cycleCount === 100 ? ' ✅ COMPLETE' : ''}
      </Text>

      <View style={styles.controls}>
        <Button
          title={running ? 'Running...' : 'Start 100-Cycle Test'}
          onPress={handleStart}
          disabled={running}
        />
      </View>

      <Text style={styles.log}>
        {running
          ? 'Monitoring heap via Flipper Memory plugin...'
          : cycleCount === 100
            ? 'Take a Flipper heap snapshot. Compare against baseline.'
            : 'Press Start to begin.'}
      </Text>

      <MediaGallery
        visible={visible}
        items={TEST_ITEMS}
        onClose={handleClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  counter: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    marginBottom: 24,
  },
  log: {
    fontSize: 13,
    color: '#666',
  },
});

export default MemoryLeakTest;
