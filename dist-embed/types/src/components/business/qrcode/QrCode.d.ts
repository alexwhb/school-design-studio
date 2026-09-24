import { type Options } from 'qr-code-styling';
export type TQrcodeProps = {
    width?: number;
    height?: number;
    image?: string;
    value?: string;
    dotsOptions?: Options['dotsOptions'];
    className?: string;
};
export default function QrCode({ width, height, image, value, dotsOptions, className }: TQrcodeProps): import("react").JSX.Element;
