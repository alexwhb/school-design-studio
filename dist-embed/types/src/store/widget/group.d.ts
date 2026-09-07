import type { TdWidgetData } from '../types';
/**
 * Puts a saved element group on the page. Like setTemplate, this is the one
 * road every group takes — the Text panel, a drop on the board, `?tempid=`
 * with a group type — so the school's fields are filled in here too.
 */
export declare function addGroup(group: TdWidgetData[]): void;
