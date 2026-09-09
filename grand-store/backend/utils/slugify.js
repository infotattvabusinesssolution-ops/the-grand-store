/**
 * Converts a string into a URL-friendly and SEO-safe slug.
 * Handles accented characters, punctuation, and multiple spaces.
 * Example: "Glenfiddich 12 Year Old Single Malt (750ml)" -> "glenfiddich-12-year-old-single-malt-750ml"
 */
const slugify = (text = '') => {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics / accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove special characters
    .replace(/[\s_-]+/g, '-') // convert spaces & underscores to single hyphen
    .replace(/^-+|-+$/g, ''); // strip leading & trailing hyphens
};

module.exports = { slugify };
