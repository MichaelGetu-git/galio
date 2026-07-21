import { useState } from 'react';
import MediaGallery from '../MediaGallery';
import Button from '../Button';
import Block from '../Block';

const sampleImages = [
  { uri: 'https://picsum.photos/seed/1/800/600', type: 'image' as const },
  { uri: 'https://picsum.photos/seed/2/800/600', type: 'image' as const },
  { uri: 'https://picsum.photos/seed/3/800/600', type: 'image' as const },
];

function MediaGalleryDemo(props: Partial<React.ComponentProps<typeof MediaGallery>>) {
  const [visible, setVisible] = useState(false);

  return (
    <Block flex center middle style={{ padding: 24 }}>
      <Button onPress={() => setVisible(true)}>Open Gallery</Button>
      <MediaGallery
        visible={visible}
        items={sampleImages}
        onClose={() => setVisible(false)}
        {...props}
      />
    </Block>
  );
}

export default {
  title: 'Galio/MediaGallery',
  component: MediaGallery,
};

export const SingleImage = {
  render: () => (
    <MediaGalleryDemo
      items={[{ uri: 'https://picsum.photos/seed/1/800/600', type: 'image' }]}
    />
  ),
};

export const MultipleImages = {
  render: () => <MediaGalleryDemo />,
};

export const StartFromLast = {
  render: () => <MediaGalleryDemo initialIndex={2} />,
};

export const ZoomDisabled = {
  render: () => <MediaGalleryDemo enableZoom={false} />,
};
