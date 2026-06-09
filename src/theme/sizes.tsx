import { Dimensions } from 'react-native';

import { BASE, STATIC_SIZES } from './staticSizes';

const { height, width } = Dimensions.get('screen');

const SIZES = {
  ...STATIC_SIZES,
  CARD_WIDTH: width - (BASE * 2),
  NAVBAR_TITLE_HEIGHT: height * 0.07,
  NAVBAR_LEFT_HEIGHT: height * 0.07,
  NAVBAR_RIGHT_HEIGHT: height * 0.07,
};

export { BASE };
export default SIZES;
