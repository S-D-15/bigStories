/**
 * Defaults for every note in this folder.
 *
 * Notes have three states, and the important one is `writing`: the note is
 * announced on the front page with the pulsing "Writing now" dot, but it is
 * not readable yet, so it must not have a page. The original site said this
 * in a comment — "Do not link them before the page exists" — and this is that
 * rule, enforced by the build instead of by remembering.
 *
 *   status: writing    → shown in the grid, not clickable, no page
 *   status: published  → shown, clickable, page + reader fragment built
 *   draft: true        → not shown at all
 *
 * As with stories, both hidden states still render locally so they can be
 * previewed; only a production build withholds the permalink.
 */

const isProduction = () => process.env.ELEVENTY_RUN_MODE === 'build';

module.exports = {
  layout: 'note.njk',
  ogType: 'article',

  eleventyComputed: {
    permalink: (data) => {
      const notReadable = data.draft || data.status !== 'published';
      return (notReadable && isProduction()) ? false : `/notes/${data.page.fileSlug}/`;
    },

    // A note being written still belongs in the grid — only a draft disappears.
    eleventyExcludeFromCollections: (data) => Boolean(data.draft && isProduction())
  }
};
