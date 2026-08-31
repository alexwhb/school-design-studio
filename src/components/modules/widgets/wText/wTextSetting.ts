import { StyleValue } from "vue"
import { type TTextEffect } from './effectStyle'

export type TwTextData = {
  name: string
  type: string
  uuid: number
  editable: boolean,
  left: number
  top: number
  transform: string
  lineHeight: number
  letterSpacing: number
  fontSize: number
  zoom: number
  fontClass: {
    alias: string
    id: number
    value: string
    url: string
  },
  fontFamily: string
  fontWeight: string
  fontStyle: string
  writingMode: StyleProperty.WritingMode
  textDecoration: string
  color: string
  textAlign: StyleProperty.TextAlign
  textAlignLast?: StyleProperty.TextAlign
  text: string
  opacity: number
  backgroundColor: string
  parent: string
  record: {
    width: number
    height: number
    minWidth: number
    minHeight: number
    dir: string
  },
  // Every layer is a partial: a preset stores only the features it uses, and
  // the panel fills the rest in when you open it. See effectStyle.ts.
  textEffects?: TTextEffect[]
  width?: number
  height?: number
  degree?: number
}

export const wTextSetting: TwTextData = {
  name: 'Text',
  type: 'w-text',
  uuid: -1,
  editable: false,
  left: 0,
  top: 0,
  transform: '',
  lineHeight: 1.5,
  letterSpacing: 0,
  fontSize: 24,
  zoom: 1,
  fontClass: {
    alias: 'Inter',
    id: 1,
    value: 'Inter',
    url: '/fonts/inter-400-700.woff2',
  },
  fontFamily: 'Inter',
  fontWeight: 'normal',
  fontStyle: 'normal',
  writingMode: 'horizontal-tb',
  textDecoration: 'none',
  color: '#000000ff',
  textAlign: 'left',
  text: '',
  opacity: 1,
  backgroundColor: '',
  parent: '-1',
  record: {
    width: 0,
    height: 0,
    minWidth: 0,
    minHeight: 0,
    dir: 'horizontal',
  },
}