# Field Notes — Everything You Need to Know

A plain-English handover for the website **Field Notes** by Sakshi Suman.
Keep this file. It lists every address, account and login the site depends on.

---

## 1. Your website

| | |
|---|---|
| **Website address** | https://field-notes-sakshi.netlify.app |
| **Where you write and publish** | https://field-notes-sakshi.netlify.app/admin/ |
| **How-to guide (bookmark this)** | https://field-notes-sakshi.netlify.app/guide/ |
| **Cost** | Free |

**The website address never changes.** When you publish a new story, it appears on
this same address by itself. You never need to send anyone a new link.

---

## 2. Accounts the site uses

There are only **two** accounts. Both are free. Do not delete either one.

| Service | What it does | Account | Login email |
|---|---|---|---|
| **GitHub** | Stores every story, photo and page. Also keeps a full history, so nothing is ever really lost. | `S-D-15` | Sakshi's GitHub account |
| **Netlify** | Puts the website online and handles the contact form. | `S-D-15's team` | sakshisuman2901@gmail.com |

**Where your writing is actually kept:**
https://github.com/S-D-15/bigStories

---

## 3. Where messages go

| Form on the site | Where it sends | Status |
|---|---|---|
| **Contact form** (Contact page + home page) | **sakshisuman2901@gmail.com** | Working — tested |
| **Subscribe box** (email sign-ups) | **sakshisuman2901@gmail.com** | Working — collects addresses |

**Good to know:**

- Every message is **also saved** in the Netlify dashboard, so nothing is lost even if
  an email goes missing.
- Spam is blocked automatically. There is no annoying "click all the traffic lights"
  box for visitors.
- The email arrives **from Netlify**, with the sender's address written inside the
  message. So to reply, copy their address into a new email.
- Free limit: **100 messages per month.** Far more than enough.

---

## 4. Technical details (for whoever maintains it)

| | |
|---|---|
| Netlify project name | `field-notes-sakshi` |
| Netlify project ID | `77ea4a27-83a4-408d-8a5a-b3f60d0e4f76` |
| Code repository | `S-D-15/bigStories`, branch `main` |
| Build command | `npm run build` |
| Publish folder | `_site` |
| Built with | Eleventy (a website builder) |
| Editor used | Sveltia CMS |

---

## 5. Two things still to be switched on

The website is live and working. Two settings still need a person to click through a
browser — they cannot be done automatically.

| # | What | Why it matters | Time |
|---|---|---|---|
| **A** | Let Netlify read the GitHub code | Until this is on, pressing **Publish** saves your story but the live site does **not** refresh on its own | 2 min |
| **B** | Switch on the `/admin/` login | Until this is on, you cannot sign in to write | 5 min |

Detailed click-by-click steps are in the **README.md** file in this same folder.

Until step A is done, someone has to run one command to push your changes live.

---

## 6. How to use your website

### Publishing a story

1. Go to **https://field-notes-sakshi.netlify.app/admin/**
2. Click **Sign in with GitHub** *(only needed once per device)*
3. Click **Founder Stories** on the left, then **New Story**
4. Fill in the boxes
5. Press **Publish**

Your story is live in about a minute.

### What each box means

| Box | What to put in it |
|---|---|
| **Headline** | The title. Brand name first, then the founder's name. Around 55–65 characters. |
| **Dek** | One or two sentences that make someone want to read it. This also shows up on Google. |
| **Kicker** | The small line in capitals — sector, model, city. Example: *Skincare · D2C · Jhansi* |
| **Publish date** | Today's date by default. |
| **Cover image** | Drag a photo in. This is also the picture shown when the link is shared on WhatsApp or LinkedIn. |
| **Cover image description** | A few words describing the photo, for blind readers. |
| **Story** | The article. Bold, italics, headings, quotes, links and photos all work. You can paste from Google Docs. |
| **Save as draft** | Turn **on** to save privately. Nobody can see it. Turn off when ready. |

### Things you never have to do

These all happen automatically. Don't go looking for them:

- The **FN number** on each story
- The **reading time**
- The story's **web address**
- The **"Read the latest story"** button on the front page
- The **sitemap and Google information** that helps people find you

### Publishing a note

Notes are the shorter pieces in the *Brand & Founder Communication* section.
Click **Field Notes** on the left instead of Founder Stories.

The important box is **Status**:

| Status | What visitors see |
|---|---|
| **Writing now** | Listed on the front page with a small pulsing dot. **Cannot be clicked.** Use this to announce a piece before you've written it. |
| **Published** | Becomes clickable and opens on the page, just like a story. |
| **Hide completely** | Does not appear anywhere on the site. |

So the normal rhythm: create the note with a title and summary, leave it on
**Writing now**, then switch to **Published** once you've actually written it.

### Editing the About or Privacy page

In `/admin/`, click **Pages** on the left, choose the page, edit, press **Publish**.

### Fixing something already published

Open `/admin/`, click the story or note in the list, change it, press **Publish**
again. The web address stays the same and nothing breaks.

To take something down, turn **Save as draft** back on — that keeps your writing but
hides it from visitors.

---

## 7. Features your visitors get

| Feature | What it does |
|---|---|
| **Click-to-read** | Clicking a story opens it smoothly **on the same page** — no waiting for a new page to load. A **Collapse** button always stays on screen to go back. |
| **Works everywhere** | Phone, tablet and computer. |
| **Dark mode** | Follows the reader's phone setting, or they can tap the sun/moon icon. |
| **Save for later** | Readers can bookmark stories with the small flag icon. |
| **Reading progress** | A thin line at the top shows how far through they are. |
| **Shareable links** | Every story has its own address that works on WhatsApp, LinkedIn and Google, with the cover photo attached. |
| **Follow by RSS** | Readers can subscribe at `/feed.xml`. |
| **Accessible** | Works with screen readers and keyboard-only navigation. |

---

## 8. Common questions

**Do I need to send people a new link when I publish?**
No. Never. New stories appear on the same website address by themselves.

**Can I write on my phone?**
Yes. `/admin/` works on a phone, including adding photos from your camera roll.

**What if I make a mistake?**
Everything is saved with a full history. Any earlier version can be brought back —
ask whoever maintains the site.

**Will it cost anything?**
No. Both accounts are on free plans. The only limit worth knowing is 100 contact-form
messages per month.

**Can I use my own domain name later?**
Yes. Buy the domain, add it in Netlify under *Domain management*, and update two
settings in the code. The secure padlock is set up free and automatically.

**Something looks wrong.**
Nothing you click in the editor can permanently break the site. Write down what you
did and ask for help.

---

## 9. One thing that is not finished

The story currently on the site — *HelloCloud Founder Story* — has **placeholder text**
in it, not the real article. The original project only ever saved the title and
summary; the article itself was never written down anywhere.

**Please open it in `/admin/` and paste the real article over the placeholder before
sharing the site with anyone.**

Also still to be filled in when you have them:

- The real **LinkedIn** address
- Reviewing the **About** and **Privacy** pages, which are working drafts
- A designed **cover image** for social sharing (a simple one is in place for now)
