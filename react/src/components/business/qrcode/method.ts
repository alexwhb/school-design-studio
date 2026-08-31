import type { CornerDotType, Options } from 'qr-code-styling'
import type { TQrcodeProps } from './QrCode'

export function generateOption(props: TQrcodeProps): Options {
  return {
    width: props.width,
    height: props.height,
    type: 'canvas',
    data: props.value,
    image: props.image,
    margin: 0,
    qrOptions: {
      typeNumber: 3,
      mode: 'Byte',
      errorCorrectionLevel: 'M',
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 6,
      crossOrigin: 'anonymous',
    },
    backgroundOptions: {
      color: '#ffffff',
    },
    dotsOptions: {
      ...props.dotsOptions,
    },
    cornersSquareOptions: {
      color: props.dotsOptions?.color,
    },
    cornersDotOptions: {
      color: props.dotsOptions?.color,
      type: 'square' as CornerDotType,
    },
  }
}
