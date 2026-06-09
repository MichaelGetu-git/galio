import { LIGHT_COLORS } from './src/theme/colors.tsx';
import { STATIC_SIZES } from './src/theme/staticSizes';

export default {
  theme: {
    extend: {
      colors: {
        galio: {
          primary: LIGHT_COLORS.primary,
          primaryHover: LIGHT_COLORS.primaryHover,
          primaryActive: LIGHT_COLORS.primaryActive,

          success: LIGHT_COLORS.success,
          successHover: LIGHT_COLORS.successHover,

          error: LIGHT_COLORS.error,
          errorHover: LIGHT_COLORS.errorHover,

          warning: LIGHT_COLORS.warning,
          warningHover: LIGHT_COLORS.warningHover,

          info: LIGHT_COLORS.info,
          infoHover: LIGHT_COLORS.infoHover,

          background: LIGHT_COLORS.background,
          surface: LIGHT_COLORS.surface,
          surfaceVariant: LIGHT_COLORS.surfaceVariant,

          text: LIGHT_COLORS.text,
          textSecondary: LIGHT_COLORS.textSecondary,
          textTertiary: LIGHT_COLORS.textTertiary,

          border: LIGHT_COLORS.border,
          divider: LIGHT_COLORS.divider,

          white: LIGHT_COLORS.white,
          black: LIGHT_COLORS.black,
        },
      },
      borderRadius: {
        'galio-card': STATIC_SIZES.CARD_BORDER_RADIUS,
        'galio-input': STATIC_SIZES.INPUT_BORDER_RADIUS,
        'galio-base': STATIC_SIZES.BORDER_RADIUS,
        'galio-rounded': STATIC_SIZES.INPUT_ROUNDED,
      },
      spacing: {
        'galio-base': STATIC_SIZES.BASE,
        'galio-btn-h': STATIC_SIZES.BUTTON_HEIGHT,
        'galio-input-h': STATIC_SIZES.INPUT_HEIGHT,
        'galio-navbar-h': STATIC_SIZES.NAVBAR_HEIGHT,
      },
      fontSize: {
        'galio-h1': STATIC_SIZES.H1,
        'galio-h2': STATIC_SIZES.H2,
        'galio-h3': STATIC_SIZES.H3,
        'galio-h4': STATIC_SIZES.H4,
        'galio-h5': STATIC_SIZES.H5,
        'galio-h6': STATIC_SIZES.H6,
        'galio-body': STATIC_SIZES.BODY,
        'galio-small': STATIC_SIZES.SMALL,
      },
    },
  },
};
