/**
 * Defaults for every story in this folder.
 *
 * The draft handling is the important part: a story marked `draft: true` in the
 * CMS must not merely be hidden from the index — it must not be written at all,
 * or it would still sit at a public, crawlable URL and land in the sitemap.
 * So in a production build a draft gets no permalink and no collection entry;
 * while writing locally it renders normally so it can be previewed.
 */

const isProduction = () => process.env.ELEVENTY_RUN_MODE === 'build';

module.exports = {
  layout: 'story.njk',
  ogType: 'article',

  eleventyComputed: {
    permalink: (data) =>
      (data.draft && isProduction()) ? false : `/stories/${data.page.fileSlug}/`,

    eleventyExcludeFromCollections: (data) => Boolean(data.draft && isProduction())
  }
};
