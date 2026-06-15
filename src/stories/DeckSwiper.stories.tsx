import DeckSwiper from '../DeckSwiper';
import Block from '../Block';
import Text from '../Text';
import { useColors } from '../theme';

function SampleCard({ label }: { label: string }) {
  const colors = useColors();
  return (
    <Block flex center middle style={{ flex: 1, padding: 24 }}>
      <Text h4 bold style={{ color: colors.onPrimary }}>
        {label}
      </Text>
    </Block>
  );
}

const sampleComponents = [
  <SampleCard key="1" label="Swipe me →" />,
  <SampleCard key="2" label="Card 2" />,
  <SampleCard key="3" label="Card 3" />,
];

export default {
  title: 'Galio/DeckSwiper',
  component: DeckSwiper,
};

export const Default = {
  args: {
    components: sampleComponents,
    swipeThreshold: 110,
  },
};

export const NoNextCardPreview = {
  args: {
    components: sampleComponents,
    showNextCard: false,
  },
};

export const CustomCardWidth = {
  args: {
    components: sampleComponents,
    cardWidth: 280,
  },
};

export const WithCallbacks = {
  args: {
    components: sampleComponents,
    onSwipeLeft: () => console.log('swiped left'),
    onSwipeRight: () => console.log('swiped right'),
  },
};
