import Accordion from '../Accordion';

const accordionData = [
  { title: 'Getting Started', content: 'Galio is a free React Native UI kit.' },
  { title: 'Theming', content: 'Use GalioProvider to customize colors and sizes.' },
  { title: 'Animations', content: 'Accordion expand/collapse runs on the UI thread via Reanimated 3.' },
];

export default {
  title: 'Galio/Accordion',
  component: Accordion,
};

export const Default = {
  args: {
    dataArray: accordionData,
    shadow: 'md',
  },
};

export const OpenFirstSection = {
  args: {
    dataArray: accordionData,
    opened: 0,
    shadow: 'lg',
  },
};

export const WithIcons = {
  args: {
    dataArray: [
      {
        title: 'Profile',
        content: 'Manage your account settings.',
        icon: { name: 'person', family: 'material' },
      },
      {
        title: 'Notifications',
        content: 'Configure push and email alerts.',
        icon: { name: 'notifications', family: 'material' },
      },
    ],
  },
};
