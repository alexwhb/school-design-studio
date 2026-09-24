/**
 * The read-only widgets, by type: what page thumbnails, the presenter, the
 * exports' copies and the viewer draw with. Kept apart from `registry.ts`,
 * whose editing widgets bring the store, Moveable and the rest of the editor
 * with them. Nothing imported here may reach for the store.
 */
import type { ComponentType } from 'react';
import type { WidgetProps } from './types';
export declare const staticWidgetComponents: Record<string, ComponentType<WidgetProps>>;
