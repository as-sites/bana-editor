/**
 * BANA Word style name constants and mappings.
 *
 * BANA (Braille Authority of North America) specifies a set of Word paragraph
 * and character styles that Duxbury DBT recognises and translates into
 * appropriate braille formatting.
 *
 * Style names here are based on the publicly available BANA guidelines and
 * common practice. They should be validated against an actual BANA .dotx
 * template if one becomes available.
 *
 * TODO: Obtain and inspect the official BANA .dotx template to verify these
 *       style names and attributes.
 * TODO: Validate that Duxbury DBT correctly processes documents using these
 *       styles.
 *
 * Reference: https://www.brailleauthority.org/
 */

/**
 * Word paragraph style names used by BANA documents.
 * These are the styleId values as they appear in styles.xml.
 */
export const BANA_STYLES = {
  // ── Body text ──────────────────────────────────────────────────────────────
  /** Standard body text / Normal style */
  Normal: 'Normal',

  // ── Headings ───────────────────────────────────────────────────────────────
  Heading1: 'Heading1',
  Heading2: 'Heading2',
  Heading3: 'Heading3',
  Heading4: 'Heading4',
  Heading5: 'Heading5',

  // ── Transcriber's Note ─────────────────────────────────────────────────────
  /**
   * Paragraph style for Transcriber's Notes.
   * TODO: Confirm the exact style name used in BANA templates.
   */
  TranscribersNote: 'TransNote',

  // ── Page indicators ────────────────────────────────────────────────────────
  /**
   * Paragraph style for Print Page indicators.
   * TODO: Confirm the exact style name used in BANA templates.
   */
  PrintPageIndicator: 'PrintPage',

  // ── Lists ──────────────────────────────────────────────────────────────────
  ListBullet: 'ListBullet',
  ListNumber: 'ListNumber',

  // ── Poetry / Verse ─────────────────────────────────────────────────────────
  /**
   * TODO: Add poetry/verse styles when implementing those block types.
   */
} as const

export type BanaStyleName = (typeof BANA_STYLES)[keyof typeof BANA_STYLES]

/**
 * Mapping from internal HeadingLevel to BANA Word style name.
 */
export const HEADING_STYLE_MAP: Record<number, string> = {
  1: BANA_STYLES.Heading1,
  2: BANA_STYLES.Heading2,
  3: BANA_STYLES.Heading3,
  4: BANA_STYLES.Heading4,
  5: BANA_STYLES.Heading5,
  6: BANA_STYLES.Heading5, // Level 6 falls back to 5 (BANA only defines 5)
}
