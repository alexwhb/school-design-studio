import type { TImageListError } from '@/api/material'

/**
 * Why a photo list came back empty, in words. Shared by every panel that asks
 * Unsplash for pictures, so the Photos panel and the background library explain
 * a missing key the same way.
 */
export const PHOTO_NOTICES: Record<TImageListError, string> = {
  unsplash_key_missing: 'Photo search needs an Unsplash access key. Add UNSPLASH_ACCESS_KEY to .env.local and restart the server — see README.md.',
  unsplash_key_invalid: 'Unsplash rejected the access key. Check UNSPLASH_ACCESS_KEY in .env.local.',
  unsplash_rate_limited: 'Unsplash’s hourly request limit is used up. Try again in a little while.',
  unsplash_unavailable: 'Could not reach Unsplash just now. Check the connection and try again.',
}
