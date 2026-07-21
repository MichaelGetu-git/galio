import React, { useCallback, useRef, useState } from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import BottomSheet from '../src/BottomSheet';
import Popover from '../src/Popover';
import MediaGallery from '../src/MediaGallery';

// ── Shared mock assets ──

// A real, streamable sample MP4 for the video-typed slots. Using a picsum
// (image) URL for a 'video' item was the root cause of the black screen and the
// "video where an image should be" report — a VideoPlayer cannot decode a JPEG.
const SAMPLE_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

// Type rule uses `i % 3 === 2` so index 0 (the frame every gallery opens on) and
// index 1 are images. MG-03's single-item slice(0,1) is therefore an image, so
// pinch-zoom + swipe-to-dismiss can actually be exercised.
const GALLERY_ITEMS = Array.from({ length: 10 }, (_, i) => {
  const isVideo = i % 3 === 2;
  return {
    uri: isVideo ? SAMPLE_VIDEO : `https://picsum.photos/seed/gallery${i}/800/800`,
    type: (isVideo ? 'video' : 'image') as 'image' | 'video',
  };
});

// ── Test case wrapper ──

function TestCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function LogLine({ label }: { label: string }) {
  return <Text style={styles.log}>{label}</Text>;
}

// ── BS-01: Scroll + Dismiss ──

function BS01_ScrollDismiss() {
  const [visible, setVisible] = useState(false);

  const handleClose = useCallback(() => {
    setVisible(false);
    console.log('[BS-01] Sheet dismissed after scroll');
  }, []);

  return (
    <TestCard title="BS-01: Scroll to bottom → drag handle to close">
      <Button title="Open BottomSheet (tall content)" onPress={() => setVisible(true)} />
      <BottomSheet
        visible={visible}
        snapPoints={['50%', '90%']}
        initialSnapIndex={0}
        onClose={handleClose}
        enablePanDownToClose
        enableOverlay
      >
        <ScrollView style={{ padding: 16 }}>
          {Array.from({ length: 50 }, (_, i) => (
            <Text key={i} style={{ paddingVertical: 8, fontSize: 14 }}>
              List item {i + 1}
            </Text>
          ))}
        </ScrollView>
      </BottomSheet>
    </TestCard>
  );
}

// ── BS-02: Rapid Toggle ──

function BS02_RapidToggle() {
  const [visible, setVisible] = useState(false);
  const toggleCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    toggleCount.current = 0;
    console.log('[BS-02] Starting rapid toggle ×20');
    const tick = () => {
      if (toggleCount.current >= 20) {
        console.log('[BS-02] Complete');
        return;
      }
      toggleCount.current += 1;
      setVisible((v) => !v);
      timerRef.current = setTimeout(tick, 100);
    };
    tick();
  }, []);

  return (
    <TestCard title="BS-02: Rapid toggle 20× at 100ms intervals">
      <Button title="Run Rapid Toggle" onPress={run} />
      <LogLine label="Watch for frozen states or ANR" />
      <BottomSheet
        visible={visible}
        snapPoints={['50%']}
        onClose={() => setVisible(false)}
        enablePanDownToClose
        enableOverlay
      >
        <View style={{ padding: 24 }}>
          <Text>Toggle cycle: {toggleCount.current}</Text>
        </View>
      </BottomSheet>
    </TestCard>
  );
}

// ── BS-03: Keyboard avoidance ──

function BS03_Keyboard() {
  const [visible, setVisible] = useState(false);

  return (
    <TestCard title="BS-03: TextInput focus → keyboard → dismiss">
      <Button title="Open BottomSheet with TextInput" onPress={() => setVisible(true)} />
      <BottomSheet
        visible={visible}
        snapPoints={['50%']}
        onClose={() => setVisible(false)}
        enablePanDownToClose
        enableOverlay
      >
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ marginBottom: 8 }}>Tap the input below and type:</Text>
          <TextInput
            style={styles.input}
            placeholder="Type here..."
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Second field"
            autoCapitalize="none"
          />
        </View>
      </BottomSheet>
    </TestCard>
  );
}

// ── PV-01: Popover placement after rotation ──

function PV01_Placement() {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<any>(null);

  return (
    <TestCard title="PV-01: Show → rotate device → show again">
      <View ref={triggerRef} collapsable={false}>
        <Button title="Toggle Popover" onPress={() => setVisible((v) => !v)} />
      </View>
      <LogLine label="Test: rotate device while open, dismiss, rotate, re-open" />
      <Popover
        visible={visible}
        trigger={<Text>Anchor</Text>}
        placement="auto"
        triggerRef={triggerRef}
        onClose={() => setVisible(false)}
      >
        <Text style={{ padding: 8 }}>Popover content — rotates with device</Text>
      </Popover>
    </TestCard>
  );
}

// ── PV-02: Popover with scrollable overflow ──

function PV02_Overflow() {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<any>(null);
  const btnRef = useRef<any>(null);

  return (
    <TestCard title="PV-02: Scrollable popover + outside dismiss">
      <View ref={triggerRef} collapsable={false}>
        <View ref={btnRef}>
          <Button title="Open Popover" onPress={() => setVisible(true)} />
        </View>
      </View>
      <Popover
        visible={visible}
        trigger={<Text />}
        triggerRef={btnRef}
        placement="bottom"
        onClose={() => setVisible(false)}
      >
        <ScrollView style={{ maxHeight: 200, width: 200 }}>
          {Array.from({ length: 20 }, (_, i) => (
            <Text key={i} style={{ paddingVertical: 4 }}>
              Menu item {i + 1}
            </Text>
          ))}
        </ScrollView>
      </Popover>
    </TestCard>
  );
}

// ── MG-01: Paging + pinch ──

function MG01_PagingPinch() {
  const [visible, setVisible] = useState(false);

  return (
    <TestCard title="MG-01: Page 3× → pinch-zoom → page again">
      <Button title="Open Gallery" onPress={() => setVisible(true)} />
      <LogLine label="Test: swipe left 3×, pinch zoom, swipe left again" />
      <MediaGallery
        visible={visible}
        items={GALLERY_ITEMS}
        onClose={() => setVisible(false)}
      />
    </TestCard>
  );
}

// ── MG-02: Double-tap zoom ──

function MG02_DoubleTap() {
  const [visible, setVisible] = useState(false);

  return (
    <TestCard title="MG-02: Double-tap to zoom → pan → double-tap to reset">
      <Button title="Open Gallery" onPress={() => setVisible(true)} />
      <LogLine label="Test: double-tap image, pan, double-tap again" />
      <MediaGallery
        visible={visible}
        items={GALLERY_ITEMS.slice(0, 3)}
        onClose={() => setVisible(false)}
      />
    </TestCard>
  );
}

// ── MG-03: Swipe-dismiss while zoomed (should be blocked) ──

function MG03_DismissBlocked() {
  const [visible, setVisible] = useState(false);

  return (
    <TestCard title="MG-03: Pinch-zoom → vertical swipe (should NOT dismiss)">
      <Button title="Open Gallery" onPress={() => setVisible(true)} />
      <LogLine label="Test: pinch to 3×, then swipe down — zoomPan should capture, not dismiss" />
      <MediaGallery
        visible={visible}
        items={GALLERY_ITEMS.slice(0, 1)}
        onClose={() => setVisible(false)}
      />
    </TestCard>
  );
}

// ── MG-04: Rapid open/close 30× ──

function MG04_RapidOpenClose() {
  const [visible, setVisible] = useState(false);
  const countRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState('');

  const run = useCallback(() => {
    countRef.current = 0;
    setStatus('Running...');
    console.log('[MG-04] Starting 30-cycle stress test');
    const tick = () => {
      if (countRef.current >= 30) {
        setStatus('Complete ✅');
        console.log('[MG-04] Complete');
        return;
      }
      countRef.current += 1;
      setVisible((v) => !v);
      timerRef.current = setTimeout(tick, 200);
    };
    tick();
  }, []);

  return (
    <TestCard title="MG-04: Rapid open/close 30× at 200ms">
      <Button title="Run 30× Stress" onPress={run} />
      <LogLine label={status || 'Check for ANR or memory growth'} />
      <MediaGallery
        visible={visible}
        items={GALLERY_ITEMS.slice(0, 3)}
        onClose={() => {
          setVisible(false);
          console.log('[MG-04] onClose fired');
        }}
      />
    </TestCard>
  );
}

// ── Main test harness ──

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionHeader}>{children}</Text>;
}

export function GestureStressTest() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={styles.mainTitle}>Gesture Stress Test Suite</Text>

      <SectionHeader>BottomSheet</SectionHeader>
      <BS01_ScrollDismiss />
      <BS02_RapidToggle />
      <BS03_Keyboard />

      <SectionHeader>Popover</SectionHeader>
      <PV01_Placement />
      <PV02_Overflow />

      <SectionHeader>MediaGallery</SectionHeader>
      <MG01_PagingPinch />
      <MG02_DoubleTap />
      <MG03_DismissBlocked />
      <MG04_RapidOpenClose />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    padding: 20,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    color: '#333',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
  },
  log: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default GestureStressTest;
