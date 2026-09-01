import type { ComponentType } from 'react'
import TempListWrap from './wrap/TempListWrap'
import GraphListWrap from './wrap/GraphListWrap'
import TextListWrap from './wrap/TextListWrap'
import PhotoListWrap from './wrap/PhotoListWrap'
import ToolsListWrap from './wrap/ToolsListWrap'
import UserWrap from './wrap/UserWrap'

export const panelComponents: Record<string, ComponentType<any>> = {
  'temp-list-wrap': TempListWrap,
  'graph-list-wrap': GraphListWrap,
  'text-list-wrap': TextListWrap,
  'photo-list-wrap': PhotoListWrap,
  'tools-list-wrap': ToolsListWrap,
  'user-wrap': UserWrap,
}
