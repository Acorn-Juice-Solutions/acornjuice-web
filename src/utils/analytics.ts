/**
 * Google Analytics 4 measurement ID for acornjuice.com.
 *
 * TODO(manual-actions §7): once the new GA4 data stream is created inside the
 * shared property (the one already used by AccuVideo), replace this placeholder
 * with the real `G-XXXXXXXXXX`. Until it is set, the value stays empty and no
 * analytics script is loaded even after consent.
 */
export const GA_MEASUREMENT_ID = '';

export function analyticsEnabled(): boolean {
  return GA_MEASUREMENT_ID.trim().length > 0;
}
