/**
 * Propfund brand tokens shared by the logo, theme and diagram accents.
 * HSL channel strings match the CSS variables in app/globals.css; the hex
 * values are the same colours for SVG fills, which can't read CSS variables
 * when a file is exported or used as a favicon.
 */
export const BRAND_NAME = "Propfund";

/** The mark is two googly eyes on a rounded tile — no letter. */
export const BRAND_MARK_GRAD_ID = "propfund-mark-grad";

/** Tile gradient: pink → lilac → sky. */
export const BRAND_PINK = "#f5acd6";
export const BRAND_LILAC = "#c9b6ff";
export const BRAND_SKY = "#a8ddff";
/** Flat tile colour for small sizes and print. */
export const BRAND_LILAC_SOLID = "#d997d2";
/** Pupils and text on light surfaces. */
export const BRAND_INK = "#141413";
export const BRAND_PAPER = "#f8f1f5";

export const BRAND_PINK_HSL = "306 46% 72%";
export const BRAND_LILAC_HSL = "256 100% 86%";
export const BRAND_SKY_HSL = "203 100% 83%";
