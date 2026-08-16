# Field Notes

Founder stories and brand communication, written by Sakshi Suman.

A static site built with [Eleventy](https://www.11ty.dev/), published through a
browser-based CMS, hosted free on Netlify. **No database, no server, no API.**

---

## For the writer — how to publish a story

1. Go to **`https://your-site.com/admin/`**
2. Click **Sign in with GitHub**
3. **Founder Stories → New Story**
4. Fill in: headline, dek, kicker, date, cover image, and the story itself
5. Press **Publish**

The live site updates itself in about a minute. **The web address never changes** —
anyone who has the site URL sees new stories automatically.

Things you never have to touch, because they are worked out automatically:

| | |
|---|---|
| The `FN 001` number | counts up in publication order |
| Reading time | measured from the word count |
| The story's web address | made from the headline |
| The "Read the latest story" button | always points at the newest one |
| RSS feed, sitemap, Google structured data | regenerated on every publish |

**Save as draft** keeps a story completely off the live site — no page, no web
address, nothing for Google to find — until you switch it off.

---

## Setup — done once

### 1. GitHub

Create a free GitHub account for the writer, and a repository for this project.
Push this folder to it.

```bash
git init
git add .
git commit -m "Field Notes"
git branch -M main
git remote add origin https://github.com/OWNER/REPO.git
git push -u origin main
```

Then edit **`src/admin/config.yml`** and replace `OWNER/REPO` on line 13 with the
real repository path.

### 2. Netlify

1. Sign up at [netlify.com](https://www.netlify.com/) with the GitHub account
2. **Add new site → Import an existing project →** pick the repository
3. Build settings are read from `netlify.toml` — accept them
4. Deploy

Every push, and every Publish from `/admin/`, now rebuilds the site automatically.

### 3. Turn on CMS login

In Netlify: **Site configuration → Access & security → OAuth → Install provider →
GitHub.** This is what makes the **Sign in with GitHub** button work.

### 4. Contact form notifications

In Netlify: **Forms → Form notifications → Add notification → Email notification.**
Send `contact` submissions to `sakshisuman2901@gmail.com`.

Netlify stores every submission in the dashboard as well, so nothing is lost if an
email bounces. Spam is caught by a hidden honeypot field plus Netlify's own filter —
no reCAPTCHA, so no third-party scripts and no cookie banner.

> Free tier: 100 form submissions/month, 300 build minutes/month, 100 GB bandwidth.

### 5. Custom domain

Netlify: **Domain management → Add a domain.** Point the registrar's nameservers at
Netlify. HTTPS is issued automatically and free.

Then update **`src/_data/site.json`** → `"url"` to the real domain, and the
`site_url` / `display_url` lines in `src/admin/config.yml`. That one file drives
every canonical tag, social preview, RSS link and structured-data record on the site.

---

## For a developer

```bash
npm install
npm start     # http://localhost:8080, live reload
npm run build # writes _site/
```

### Layout

```
eleventy.config.mjs   collections, date/text filters, FN numbering, reading time
netlify.toml          build command, headers
src/
  _data/site.json     domain, name, author, socials — the single source of truth
  _includes/
    base.njk          <head> (all SEO), nav, footer
    story.njk         standalone story page layout
    story-body.njk    the <article> — shared by the page AND the reader fragment
    page.njk          about / privacy / thanks / 404
    contact-form.njk  shared by /contact/ and the homepage section
    schema-*.njk      JSON-LD
  admin/              the CMS (config.yml is the field definitions)
  assets/             style.css, site.js, icons, uploads/
  stories/*.md        the content
  stories/stories.11tydata.js   per-story defaults + draft suppression
  story-partials.njk  emits /stories/<slug>/partial.html for the reader
  index.njk           the homepage
```

### How the in-page reader works

Each story is built twice from one markdown file:

- `/stories/<slug>/` — a full standalone page. This is what Google indexes and what
  a shared link opens.
- `/stories/<slug>/partial.html` — the bare `<article>`, fetched by the reader.

Both render from `_includes/story-body.njk`, so they cannot drift apart.

Clicking a story fetches the fragment into a native `<dialog>` and `pushState`s the
real URL. The `<a href>` underneath stays real, so **crawlers, ⌘-click, middle-click
and no-JS visitors all still get the standalone page.** The reader is an enhancement
layered on a fully crawlable site, never a replacement for one.

Native `<dialog>` + `showModal()` provides focus trapping, Esc handling and an inert
background for free.

### Adding a story without the CMS

Drop a markdown file in `src/stories/`:

```yaml
---
title: "Brand Founder Story: How Someone Built Something"
dek: "One or two sentences."
kicker: "Sector · Model · City"
date: 2026-07-14
cover: /assets/uploads/photo.jpg
coverAlt: "Description of the photo."
draft: false
---

The story goes here, in markdown.
```

Everything else is derived.

---

## Still outstanding

- [ ] Replace the placeholder body of `src/stories/hellocloud-founder-story.md` —
      the article text never existed in the original project, only its index row
- [ ] Real LinkedIn URL in `src/_data/site.json` (still `REPLACE-WITH-YOUR-HANDLE`)
- [ ] Real domain in `src/_data/site.json` and `src/admin/config.yml`
- [ ] `OWNER/REPO` in `src/admin/config.yml`
- [ ] Review `src/about.md` and `src/privacy.md` — both are working drafts
- [ ] The generated `og-cover.png` and `apple-touch-icon.png` are minimal brand
      marks; replace with designed artwork when there is some
- [ ] The subscribe form currently posts to Netlify Forms (`subscribe`). Point it at
      a real newsletter tool when one is chosen.

`archive/` holds the original single-file site it was built from.
