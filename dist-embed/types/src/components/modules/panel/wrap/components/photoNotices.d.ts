import type { TImageListError } from '../../../../../api/material';
/**
 * Why a photo list came back empty, in words. Shared by every panel that asks
 * Unsplash for pictures, so the Photos panel and the background library explain
 * a missing key the same way.
 */
export declare const PHOTO_NOTICES: Record<TImageListError, string>;
