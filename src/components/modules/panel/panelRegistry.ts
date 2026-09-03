import type { ComponentType } from 'react'
import TempListWrap from './wrap/TempListWrap'
import GraphListWrap from './wrap/GraphListWrap'
import TextListWrap from './wrap/TextListWrap'
import PhotoListWrap from './wrap/PhotoListWrap'
import BrandWrap from './wrap/BrandWrap'

export const panelComponents: Record<string, ComponentType<any>> = {
  'temp-list-wrap': TempListWrap,
  'graph-list-wrap': GraphListWrap,
  'text-list-wrap': TextListWrap,
  'photo-list-wrap': PhotoListWrap,
  'brand-wrap': BrandWrap,
}
