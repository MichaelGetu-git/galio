const {LIGHT_COLORS}=require('./dist/theme/colors');
const SIZES=require('./dist/theme/sizes').default;

module.exports={
    theme:{
        extend:{
            colors:{
               galio:{
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

                white:LIGHT_COLORS.white,
                black:LIGHT_COLORS.black,
               }, 
            },
            borderRadius:{
            'galio-card': SIZES.CARD_BORDER_RADIUS,
            'galio-input': SIZES.INPUT_BORDER_RADIUS,
            'galio-base': SIZES.BORDER_RADIUS,
            'galio-rounded':SIZES.INPUT_ROUNDED,
            },

            spacing:{
            'galio-base': SIZES.BASE,
            'galio-btn-h': SIZES.BUTTON_HEIGHT,
            'galio-input-h': SIZES.INPUT_HEIGHT, 
            'galio-navbar-h': SIZES.NAVBAR_HEIGHT,
            },
            fontSize:{
            'galio-h1': SIZES.H1,
            'galio-h2': SIZES.H2,
            'galio-h3': SIZES.H3,
            'galio-h4': SIZES.H4,
            'galio-h5': SIZES.H5,
            'galio-h6': SIZES.H6,
            'galio-body': SIZES.BODY,
            'galio-small': SIZES.SMALL,
            }
        }
    }
}