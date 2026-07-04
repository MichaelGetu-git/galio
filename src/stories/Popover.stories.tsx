import { useState } from 'react';
import Popover from '../Popover';
import Button from '../Button';
import Block from '../Block';
import Text from '../Text';

function PopoverDemo(props: Partial<React.ComponentProps<typeof Popover>>) {
  const [visible, setVisible] = useState(false);

  return (
    <Block flex center middle style={{ padding: 24 }}>
      <Popover
        visible={visible}
        trigger={
          <Button onPress={() => setVisible(true)}>
            Show Popover
          </Button>
        }
        onClose={() => setVisible(false)}
        {...props}
      >
        <Block style={{ minWidth: 120 }}>
          <Text bold>Popover Title</Text>
          <Text style={{ marginTop: 4 }}>This is the popover content.</Text>
        </Block>
      </Popover>
    </Block>
  );
}

export default {
  title: 'Galio/Popover',
  component: Popover,
};

export const AutoPlacement = {
  render: () => <PopoverDemo />,
};

export const TopPlacement = {
  render: () => <PopoverDemo placement="top" />,
};

export const BottomPlacement = {
  render: () => <PopoverDemo placement="bottom" />,
};

export const LeftPlacement = {
  render: () => <PopoverDemo placement="left" />,
};

export const RightPlacement = {
  render: () => <PopoverDemo placement="right" />,
};
