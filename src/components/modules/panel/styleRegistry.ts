import type { ComponentType } from 'react'
import PageStyle from '../layout/designBoard/PageStyle'
import WTextStyle from '../widgets/wText/WTextStyle'
import WImageStyle from '../widgets/wImage/WImageStyle'
import WSvgStyle from '../widgets/wSvg/WSvgStyle'
import WRectStyle from '../widgets/wRect/WRectStyle'
import WEllipseStyle from '../widgets/wEllipse/WEllipseStyle'
import WGroupStyle from '../widgets/wGroup/WGroupStyle'
import WQrcodeStyle from '../widgets/wQrcode/WQrcodeStyle'

export const styleComponents: Record<string, ComponentType<any>> = {
  'page-style': PageStyle,
  'w-text-style': WTextStyle,
  'w-image-style': WImageStyle,
  'w-svg-style': WSvgStyle,
  'w-rect-style': WRectStyle,
  'w-ellipse-style': WEllipseStyle,
  'w-group-style': WGroupStyle,
  'w-qrcode-style': WQrcodeStyle,
}
