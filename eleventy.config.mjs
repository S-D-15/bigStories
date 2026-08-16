/**
 * Field Notes — build configuration.
 *
 * One dependency (@11ty/eleventy). Everything below is what turns a markdown
 * file written in /admin/ into: a story page, a reader fragment, an index row,
 * an RSS item, a sitemap entry and a JSON-LD record — with no hand-editing.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WORDS_PER_MINUTE = 200;

/** Text out of markdown/HTML, good enough for counting and for meta text. */
function toText(input) {
  return String(input || '')
    .replace(/```[\s\S]*?```/g, ' ')        // fenced code
    .replace(/<[^>]+>/g, ' ')               // tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')  // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')// links -> label
    .replace(/^---[\s\S]*?---/, ' ')        // front matter, if any slipped in
    .replace(/[#>*_`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(input) {
  const t = toText(input);
  return t ? t.split(' ').length : 0;
}

function pad(n, width) {
  return String(n).padStart(width, '0');
}

/** Dates in front matter are plain YYYY-MM-DD; read them as UTC, never local. */
function asDate(value) {
  if (value instanceof Date) return value;
  const s = String(value || '');
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  const d = new Date(s);
  return isNaN(d) ? new Date() : d;
}

export default function (eleventyConfig) {

  /* ---------- assets ---------- */

  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addPassthroughCopy({ 'src/admin': 'admin' });

  // The CMS ships its own HTML — copy it, never run it through the templating.
  eleventyConfig.ignores.add('src/admin/**');

  eleventyConfig.addWatchTarget('src/assets/');

  /* ---------- markdown ---------- */

  eleventyConfig.amendLibrary('md', (md) => md.set({
    html: true,      // let the writer paste an embed if she ever needs to
    breaks: false,
    linkify: true
  }));

  /* ---------- the stories collection ---------- */

  // Drafts stay visible while writing locally, never in a production build.
  // src/stories/stories.11tydata.js also strips their permalink in production,
  // so a draft has no public URL at all — this filter is the second line only.
  const showDrafts = process.env.ELEVENTY_RUN_MODE !== 'build';

  eleventyConfig.addCollection('stories', (api) => {
    const all = api.getFilteredByGlob('src/stories/*.md')
      .filter((item) => showDrafts || item.data.draft !== true)
      .sort((a, b) => asDate(a.data.date) - asDate(b.data.date)); // oldest first

    const total = all.length;

    all.forEach((item, i) => {
      // FN 001 is the first story ever published, so numbering runs with time.
      item.data.fn = pad(i + 1, 3);

      const source = item.rawInput || item.template?.frontMatter?.content || '';
      const words = countWords(source);
      item.data.words = words;
      item.data.readingTime = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
      item.data.position = { index: i, total };
    });

    return all.reverse(); // newest first for display
  });

  /* ---------- the notes collection ---------- */

  // Every note that should appear in the grid, including ones still being
  // written. Reading time is computed the same way as for stories.
  eleventyConfig.addCollection('notes', (api) => {
    const all = api.getFilteredByGlob('src/notes/*.md')
      .filter((item) => showDrafts || item.data.draft !== true);

    all.forEach((item) => {
      const source = item.rawInput || '';
      const words = countWords(source);
      item.data.words = words;
      item.data.readingTime = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
      item.data.isPublished = item.data.status === 'published';
    });

    return all.sort((a, b) => asDate(b.data.date) - asDate(a.data.date)); // newest first
  });

  // Only the readable ones get a reader fragment.
  eleventyConfig.addCollection('notesPublished', (api) =>
    api.getFilteredByGlob('src/notes/*.md')
      .filter((item) => item.data.status === 'published')
      .filter((item) => showDrafts || item.data.draft !== true)
      .sort((a, b) => asDate(b.data.date) - asDate(a.data.date)));

  /* ---------- date filters ---------- */

  // "1 Jun 2026" — matches the format already used across the site.
  eleventyConfig.addFilter('niceDate', (value) => {
    const d = asDate(value);
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  });

  // "2026-06-01" for <time datetime> and JSON-LD.
  eleventyConfig.addFilter('isoDate', (value) => asDate(value).toISOString().slice(0, 10));

  // Full ISO 8601 for sitemap lastmod.
  eleventyConfig.addFilter('isoStamp', (value) => asDate(value).toISOString());

  // RFC-822 for RSS 2.0 <pubDate>.
  eleventyConfig.addFilter('rfc822', (value) => {
    const d = asDate(value);
    return `${DAYS[d.getUTCDay()]}, ${pad(d.getUTCDate(), 2)} ${MONTHS[d.getUTCMonth()]} `
         + `${d.getUTCFullYear()} ${pad(d.getUTCHours(), 2)}:${pad(d.getUTCMinutes(), 2)}:`
         + `${pad(d.getUTCSeconds(), 2)} +0000`;
  });

  eleventyConfig.addFilter('year', (value) => asDate(value).getUTCFullYear());

  /* ---------- text filters ---------- */

  eleventyConfig.addFilter('readingTime', (input) =>
    Math.max(1, Math.round(countWords(input) / WORDS_PER_MINUTE)));

  eleventyConfig.addFilter('plain', toText);

  // Meta descriptions: one clean sentence-ish blob, never mid-word.
  // Named metaText, not truncate, so it never shadows Nunjucks' own filter.
  eleventyConfig.addFilter('metaText', (input, len = 160) => {
    const t = toText(input);
    if (t.length <= len) return t;
    const cut = t.slice(0, len);
    return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '') + '…';
  });

  /* ---------- url filters ---------- */

  eleventyConfig.addFilter('absolute', function (urlPath) {
    const base = (this.ctx?.site?.url || '').replace(/\/+$/, '');
    return base + (String(urlPath || '/').startsWith('/') ? urlPath : '/' + urlPath);
  });

  /* ---------- misc ---------- */

  eleventyConfig.addFilter('jsonify', (value) => JSON.stringify(value));

  eleventyConfig.setLiquidOptions({ jsTruthy: true });

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data'
    },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    templateFormats: ['njk', 'md', 'html']
  };
}
