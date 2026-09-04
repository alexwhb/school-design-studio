/**
 * The widget a dropped thing becomes.
 *
 * Returns null when the drop should not happen after all — the host was asked
 * for a copy of a stock photograph and could not take one, and putting the
 * remote address in instead would be putting in the thing it refuses.
 */
export default function (type: string, item: TCommonItemData, data: Record<string, any>): Promise<Record<string, any> | null>;
