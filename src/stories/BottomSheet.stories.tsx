import { useState } from 'react';
import BottomSheet from '../BottomSheet';
import Button from '../Button';
import Block from '../Block';
import Text from '../Text';

function BottomSheetDemo(props: Partial<React.ComponentProps<typeof BottomSheet>>) {
  const [visible, setVisible] = useState(false);

  return (
    <Block flex center middle style={{ padding: 24 }}>
      <Button onPress={() => setVisible(true)}>Open Bottom Sheet</Button>
      <BottomSheet
        visible={visible}
        snapPoints={[100, 300, '80%']}
        onClose={() => setVisible(false)}
        {...props}
      >
        <Block style={{ padding: 16 }}>
          <Text h4>Sheet Content</Text>
          <Text style={{ marginTop: 8 }}>
            This is scrollable content inside the bottom sheet. Add more text to see
            scrolling behavior.
          </Text>
        </Block>
      </BottomSheet>
    </Block>
  );
}

export default {
  title: 'Galio/BottomSheet',
  component: BottomSheet,
};

export const Default = {
  render: () => <BottomSheetDemo />,
};

export const TwoSnapPoints = {
  render: () => (
    <BottomSheetDemo snapPoints={[100, '60%']} initialSnapIndex={1} />
  ),
};

export const FullScreen = {
  render: () => (
    <BottomSheetDemo snapPoints={[0, '100%']} initialSnapIndex={1} />
  ),
};

export const NoOverlay = {
  render: () => <BottomSheetDemo enableOverlay={false} />,
};
