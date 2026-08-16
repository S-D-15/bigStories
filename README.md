# Field Notes

Founder stories and brand communication, written by Sakshi Suman.

**Live: https://field-notes-sakshi.netlify.app**

A static site built with [Eleventy](https://www.11ty.dev/), published through a
browser-based CMS, hosted free on Netlify. **No database, no server, no API.**

---

## Status

| | |
|---|---|
| Code on GitHub | ✅ `S-D-15/bigStories` |
| Site live on Netlify | ✅ `field-notes-sakshi` |
| Contact form → Gmail | ✅ tested end to end, honeypot verified |
| Notes publishable from the CMS | ✅ |
| `/admin/` login | ✅ verified — a story was published through it |
| **Auto-rebuild when you press Publish** | ⛔ **needs step A below** |

Until step A is done, publishing from `/admin/` commits the change to GitHub but the
live site will not rebuild by itself. Someone has to run `npm run build && netlify
deploy --prod --dir=_site` from this folder.

---

## Two steps left — both browser-only, neither can be scripted

### A. Let Netlify pull from GitHub (~2 minutes)

This is what makes *press Publish → site updates itself* work.

1. Open **https://app.netlify.com/projects/field-notes-sakshi/configuration/deploys**
2. Under **Continuous deployment**, choose **Link repository** (or **Manage
   repository** if it already shows one)
3. Pick **GitHub** → authorise → when GitHub asks which repositories Netlify may
   access, grant it **S-D-15/bigStories**
4. Confirm the build settings — they should read:
   - Build command: `npm run build`
   - Publish directory: `_site`
5. Save, then **Deploys → Trigger deploy → Deploy site** to confirm it builds green

> Netlify already knows the repo path; what it lacks is GitHub's permission to read
> it. A build triggered now fails with *"Unable to access repository"* until this is
> granted.

### B. Turn on the `/admin/` login (~5 minutes)

**B1 — create a GitHub OAuth App**

1. Open **https://github.com/settings/developers** → **OAuth Apps** → **New OAuth App**
   *(sign in as **S-D-15**)*
2. Fill in:
   - Application name: `Field Notes CMS`
   - Homepage URL: `https://field-notes-sakshi.netlify.app`
   - Authorization callback URL: `https://api.netlify.com/auth/done`
3. **Register application**
4. Copy the **Client ID**, then **Generate a new client secret** and copy that too

**B2 — give them to Netlify**

1. Open **https://app.netlify.com/projects/field-notes-sakshi/configuration/access**
2. Find **OAuth** → **Install provider** → **GitHub**
3. Paste the Client ID and Client Secret → **Install**

Then go to `https://field-notes-sakshi.netlify.app/admin/`, click **Sign in with
GitHub**, and the editor opens.

---

## For the writer — how to publish

There is a plain-language guide on the site itself:
**https://field-notes-sakshi.netlify.app/guide/**
(unlisted and hidden from search engines — bookmark it).

The short version: go to `/admin/`, sign in with GitHub, click **New Story**, fill in
the boxes, press **Publish**. The site updates itself in about a minute and **the web
address never changes** — nobody ever needs a new link.

Things that work themselves out and are not fields to fill in: the `FN` number,
reading time, the story's web address, the "Read the latest story" button, the RSS
feed, the sitemap, and the Google structured data.

**Stories** have a *Save as draft* switch — on means saved but invisible, with no web
address at all.

**Notes** have a *Status* dropdown instead:

- **Writing now** — listed on the front page with a pulsing dot, deliberately not
  clickable, no page. For announcing a piece before it is written.
- **Published** — becomes clickable and opens on the page, exactly like a story.

---

## For a developer

```bash
npm install
npm start     # http://localhost:8080, live reload
npm run build # writes _site/
```

Deploy manually (only needed until step A above is done):

```bash
npm run build && netlify deploy --prod --dir=_site
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
    note.njk          standalone note page layout
    story-body.njk    the <article> — shared by story AND note, page AND fragment
    page.njk          about / privacy / guide / thanks / 404
    contact-form.njk  shared by /contact/ and the homepage section
    schema-*.njk      JSON-LD
  admin/              the CMS (config.yml holds the field definitions)
  assets/             style.css, site.js, icons, uploads/
  stories/*.md        founder stories
    stories.11tydata.js   per-story defaults + draft suppression
  notes/*.md          field notes
    notes.11tydata.js     per-note defaults + writing/draft suppression
  story-partials.njk  emits /stories/<slug>/partial.html
  note-partials.njk   emits /notes/<slug>/partial.html
  index.njk           the homepage
```

### How the in-page reader works

Every story and every published note is built **twice** from one markdown file:

- `/stories/<slug>/` — a full standalone page. What Google indexes, what a shared
  link opens.
- `/stories/<slug>/partial.html` — the bare `<article>`, fetched by the reader.

Both render from `_includes/story-body.njk`, so they cannot drift apart.

Clicking a link marked `data-reader` fetches the fragment into a native `<dialog>` and
`pushState`s the real URL. The `<a href>` underneath stays real, so **crawlers,
⌘-click, middle-click and no-JS visitors all still get the standalone page**. The
reader is an enhancement layered on a fully crawlable site, never a replacement.

Native `<dialog>` + `showModal()` provides focus trapping, Esc handling and an inert
background for free.

### Content states

Set in the CMS, enforced by `*.11tydata.js` — a hidden item gets **no permalink** in a
production build, so it has no public URL at all, not merely a hidden link.

| | Story | Note |
|---|---|---|
| Visible and readable | `draft: false` | `status: published` |
| Announced, not readable | — | `status: writing` |
| Completely hidden | `draft: true` | `draft: true` |

### Adding content without the CMS

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

## Contact form

Netlify Forms — no backend code, no API key, no email service.

Notifications go to `sakshisuman2901@gmail.com` for both the `contact` and `subscribe`
forms. Submissions are also kept in the Netlify dashboard, so nothing is lost if an
email bounces.

Spam is caught by a hidden honeypot plus Netlify's own filter — **verified working**:
a submission with the honeypot filled is silently discarded.

Two limits worth knowing:

- Free tier is **100 submissions/month**
- The notification email arrives *from Netlify* with the sender's address in the body,
  so replying is copy-paste rather than one-click. Fixing that properly means adding
  an email service and an API key; not worth it at this volume.

---

## Still outstanding

- [ ] **Steps A and B above**
- [ ] **Replace the placeholder body** of `src/stories/hellocloud-founder-story.md` —
      the article text never existed in the original project, only its index row
- [ ] Real LinkedIn URL in `src/_data/site.json` (still `REPLACE-WITH-YOUR-HANDLE`)
- [ ] Review `src/about.md` and `src/privacy.md` — both are working drafts
- [ ] Replace the generated `og-cover.png` / `apple-touch-icon.png` with designed
      artwork when there is some
- [ ] Custom domain, when there is one: Netlify → Domain management → Add a domain,
      then update `url` in `src/_data/site.json` and `site_url`/`display_url` in
      `src/admin/config.yml`

`archive/` holds the original single-file site this was built from.
