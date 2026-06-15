import { useState } from 'react';
import Toast from '../Toast';
import Button from '../Button';
import Block from '../Block';

function ToastDemo(props: Partial<React.ComponentProps<typeof Toast>>) {
  const [visible, setVisible] = useState(false);

  return (
    <Block>
      <Button onPress={() => setVisible(true)}>Show Toast</Button>
      <Toast {...props} isShow={visible}>
        {props.children ?? 'Action completed successfully'}
      </Toast>
    </Block>
  );
}

export default {
  title: 'Galio/Toast',
  component: Toast,
};

export const Primary = {
  render: () => <ToastDemo color="primary" />,
};

export const Success = {
  render: () => <ToastDemo color="success">Saved!</ToastDemo>,
};

export const Error = {
  render: () => <ToastDemo color="error">Something went wrong</ToastDemo>,
};

export const BottomPosition = {
  render: () => (
    <ToastDemo color="info" positionIndicator="bottom" positionOffset={80}>
      Bottom toast
    </ToastDemo>
  ),
};

export const Round = {
  render: () => (
    <ToastDemo color="warning" round>
      Round toast
    </ToastDemo>
  ),
};

export const AlwaysVisible = {
  args: {
    isShow: true,
    children: 'Persistent toast for visual review',
    color: 'primary',
  },
};
