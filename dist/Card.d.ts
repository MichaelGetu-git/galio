import { JSX } from "react";
import { ImageStyle, ViewStyle } from "react-native";
interface CardProps {
    avatar?: string;
    title?: string;
    titleColor?: string;
    caption?: string;
    captionColor?: string;
    location?: string;
    locationColor?: string;
    footerStyle?: ViewStyle;
    image?: string;
    imageBlockStyle?: ViewStyle;
    imageStyle?: ImageStyle;
    borderless?: boolean;
    card?: boolean;
    shadow?: boolean;
    children?: React.ReactNode;
    style?: ViewStyle;
    neutral?: boolean;
    fullBackgroundImage?: boolean;
    authorImageSrc?: string;
    authorTitle?: string;
    authorSubTitle?: string;
    onPress?: () => void;
    rightSideComponent?: React.ReactNode;
    flex?: boolean;
    shadowColor?: string;
    className?: string;
    imageClassName?: string;
    footerClassName?: string;
    imageBlockClassName?: string;
}
declare function Card({ avatar, title, titleColor, caption, captionColor, location, locationColor, borderless, footerStyle, image, imageBlockStyle, imageStyle, children, card, shadow, style, neutral, fullBackgroundImage, authorImageSrc, authorTitle, authorSubTitle, onPress, rightSideComponent, flex, shadowColor, className, imageClassName, footerClassName, imageBlockClassName }: CardProps): JSX.Element;
declare const WrappedCard: typeof Card;
export default WrappedCard;
//# sourceMappingURL=Card.d.ts.map