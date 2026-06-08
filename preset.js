const {LIGHT_COLORS}=require('./src/theme/colors');
const SIZES=require('./src/theme/sizes');

module.exports={
    theme:{
        extend:{
            colors:{
               galio:{
                primary: LIGHT_COLORS.primary,
                primaryHover: LIGHT_COLORS.primaryHover,
                success: LIGHT_COLORS.success,
                error: LIGHT_COLORS.error,
                warning: LIGHT_COLORS.warning,
                info: LIGHT_COLORS.info,
                background: LIGHT_COLORS.background,
                surface: LIGHT_COLORS.surface,
                text: LIGHT_COLORS.text,
                border: LIGHT_COLORS.border,
               } 
            },
            borderRadius:{
            'galio-card': SIZES.CARD_BORDER_RADIUS,
            'galio-input': SIZES.INPUT_BORDER_RADIUS,
            'galio-base': SIZES.BORDER_RADIUS,
            },
            spacing:{
            'galio-base': SIZES.BASE,
            'galio-btn-h': SIZES.BUTTON_HEIGHT,
            'galio-input-h': SIZES.INPUT_HEIGHT, 
            }
        }
    }
}