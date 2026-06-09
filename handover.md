# Splinter Website — Project Handover

**Purpose of this file:** everything a fresh session (or developer) needs to pick
up this project cold, with zero prior context. Read this top to bottom once,
then keep it as a reference.

Last updated: 8 June 2026.

---

## 1. What this is

A single-page promotional website for **Splinter**, a high-energy **modern &
classic hard rock covers band from the Black Country (UK)**. Covers span the
last five decades — AC/DC, Guns N' Roses, Black Sabbath, Black Stone Cherry,
Muse, Royal Blood, Queens of the Stone Age.

It is a **static site** (plain HTML/CSS/vanilla JS — no framework, no build step
for the real site, no backend). It is designed to be hosted free on **Azure
Static Web Apps (Free tier)** with auto-deploy from GitHub.

One page, with a sticky nav that smooth-scrolls to five sections:
**Home (hero) · Bio · Gigs · Videos · Contact**, plus a scrolling band-name
marquee between the hero and bio.

---

## 2. Current status

**Done and working:**
- Full responsive layout, all five sections, mobile hamburger nav, scroll-spy
  (active section highlights in the nav).
- Branding applied from the band's real logo + style poster: pure-black canvas,
  electric-purple accent, white text, grungy/industrial feel.
- Real logo in the hero (`logo.jpg`) and real wordmark in the nav (`logo-text.png`).
- Real bio copy, real contact email, real social links.
- Six real 2026 gig dates loaded from `data/gigs.json`, auto-split into
  upcoming/past and styled to mirror the band's gig poster.
- One pinned YouTube video in the Videos section; if no videos are pinned it
  falls back to auto-showing the channel's latest uploads.

**Outstanding — see §10 for detail:**
- Favicon is still a leftover placeholder (orange "S") and needs replacing.
- Bio band photo is intentionally hidden (placeholder only) — needs a real photo.
- The pinned video's title is a placeholder ("Splinter — Live").
- Confirm "Allow embedding" is enabled on that YouTube video.

---

## 3. Tech & hosting

- **Stack:** static HTML + one CSS file + one vanilla-JS file + two JSON data
  files. No npm, no bundler, no server code.
- **Host:** Azure Static Web Apps, **Free** plan (free hosting + SSL + a custom
  domain + global CDN + 100 GB/month bandwidth; no uptime SLA, which is fine here).
- **Deploy model:** GitHub repo → Azure builds and deploys on every push. Editing
  a gig and pushing = the site redeploys itself in ~1 minute. That's the whole
  update workflow.
- **Azure "Deployment authorization policy":** choose **Deployment token**
  (Microsoft's recommended default; Azure stores the token in the GitHub repo and
  writes the workflow automatically — nothing to do manually).

---

## 4. File map

```
index.html                 Page structure + written copy (bio, email, socials).
assets/
  styles.css               ALL styling. Design tokens live in :root at the top.
  app.js                   Behaviour: nav, scroll-spy, gig rendering, video embeds.
  logo.jpg                 Full logo lockup (starburst + SPLINTER) — used in HERO.
  logo-text.png            Trimmed wordmark only — used in the NAV.
  favicon.svg              Browser-tab icon (PLACEHOLDER — needs work, see §10).
  portrait-placeholder.svg Stand-in for the band photo (currently hidden).
data/
  gigs.json                THE GIG LIST. Edit this to add/remove shows.
  videos.json              Pinned YouTube videos (optional; empty = channel feed).
staticwebapp.config.json   Azure routing/caching/headers (leave as-is normally).
build-preview.py           Regenerates preview.html (dev convenience; see §9).
preview.html               GENERATED single-file preview. NOT deployed. See §9.
README.md                  Band-facing "how to update" guide.
HANDOVER.md                This file.
```

**Deploy = everything except `build-preview.py`, `preview.html`, `HANDOVER.md`.**
Those three are dev/handover aids; harmless if uploaded, but not needed live.

---

## 5. Brand & design system

All colours, fonts and layout knobs are CSS custom properties at the top of
`assets/styles.css`. Change them there and the whole site updates.

```
--bg:        #000000   pure black (matches the logo art so the JPG blends in)
--bg-elev:   #120e16   raised surfaces / cards (very dark purple-black)
--ink:       #f4f1f7   primary text (cool white)
--ink-soft:  #9a93a6   secondary text (muted lilac-grey)
--line:      rgba(244,241,247,0.13)   hairline borders
--line-accent: rgba(150,47,209,0.45)  purple separators
--accent:    #962fd1   electric purple — THE brand colour (sampled from poster)
--accent-2:  #b35ee8   brighter purple for hovers
--accent-ink:#ffffff   text that sits on top of the accent colour

--font-display: "Big Shoulders Display"  (headings, gig text, nav — industrial)
--font-text:    "Archivo"                (body/UI)
```

Both fonts load from Google Fonts via a `<link>` in `index.html`. The metal-style
logo lettering is **not** a web font — it lives only in the logo images.

Section vertical spacing was deliberately tightened: `.section` padding is
`clamp(3rem, 6vw, 4.75rem)` (was larger; the band asked for smaller gaps).

---

## 6. How each section works

- **Hero (`#home`):** centred. Eyebrow line "Modern & Classic Hard Rock Covers",
  the full logo image, two buttons (Live dates / Watch us play). No tagline, no
  background glow, no scroll indicator — all removed at the band's request.
- **Marquee:** a CSS-animated strip of the covered bands' names; pauses on hover.
- **Bio (`#bio`):** lead line + paragraph + a small facts list. The photo
  `<figure>` is present but carries the `hidden` attribute, and the grid uses the
  `bio__grid--solo` modifier so the text runs full-width while the photo is off.
- **Gigs (`#gigs`):** rendered by JS from `data/gigs.json`. See §7.
- **Videos (`#videos`):** rendered by JS from `data/videos.json`. See §7.
- **Contact (`#contact`):** big mailto link + social links (Instagram, Facebook,
  YouTube). No contact form by design (nothing to host, no spam).

---

## 7. Data files (this is the part that gets edited most)

### `data/gigs.json`
An array of gig objects. Today's date splits them into **Upcoming** and **Past**
automatically; upcoming sorts ascending, past descending. The weekday badge
(SAT/SUN) and the ordinal date (e.g. "11ᵗʰ JUL") are **computed in JS** from
`date` — you don't store them.

```json
{
  "date": "2026-07-11",       // YYYY-MM-DD. Drives sorting + upcoming/past + weekday.
  "venue": "Fixed Wheel Brewery",
  "city": "Blackheath",
  "time": "",                  // optional, e.g. "8:00 PM"; shown if present
  "ticketUrl": "",             // optional; if set (and not sold out) shows a Tickets button
  "status": "",                // "" | "onsale" | "soldout" | "free"  ("soldout"/"free" show a badge)
  "note": ""                   // optional free-text
}
```

The six real confirmed 2026 dates currently in the file:
| Date | Venue | Place |
|------|-------|-------|
| Sat 11 Jul | Fixed Wheel Brewery | Blackheath |
| Sat 25 Jul | The Britannia | Rowley Village |
| Sat 26 Sep | Fixed Wheel Brewery | Blackheath |
| Sat 17 Oct | The Britannia | Rowley Village |
| Sat 21 Nov | Fixed Wheel Brewery | Blackheath |
| Sun 13 Dec | The O Bar | Broad St, Birmingham |

### `data/videos.json`
An array of pinned videos. **If it's empty (`[]`), the Videos section instead
shows the channel's latest uploads automatically** (see the playlist trick in §8).
Currently it pins one video:

```json
[ { "id": "YcfrnpqVhZA", "title": "Splinter — Live" } ]
```

`id` = the part of a YouTube URL after `watch?v=` / after `youtu.be/`. The title
is just a label and can be anything.

---

## 8. Important details & hard-won lessons

Read these before changing the relevant areas — each one cost time to find.

1. **Inline SVG fills must use `#`, not `%23`.** The play-button icon (`PLAY_SVG`
   in `app.js`) is injected as inline HTML. Using URL-encoded `%23962fd1` makes
   the fill invalid, so the icon renders **black and disappears** on the dark
   thumbnail. It must be `fill="#962fd1"` / `fill="#ffffff"`. (`%23` is only
   correct inside a `data:` URI, e.g. the grain texture in the CSS — leave that one.)

2. **YouTube embeds fail in sandboxed / `file://` contexts.** A `<iframe>` to
   YouTube shows a "Video unavailable" error when the page runs inside a sandboxed
   frame or is opened directly as a local file (null origin). This is expected.
   It plays correctly when served from a real origin: the deployed Azure URL, or
   `http://localhost` via a local server. So if a video "errors on play" during
   local testing, test on localhost or the live site before assuming a bug. Also
   make sure the video has "Allow embedding" ticked in YouTube Studio.

3. **Background is pure black on purpose.** `logo.jpg` is a JPEG on a black
   background (not transparent). Keeping `--bg: #000000` lets it blend seamlessly.
   If you ever lighten the background, knock the logo out to a transparent PNG.

4. **Two logo files, two jobs.** `logo.jpg` is the full lockup with the starburst
   (hero only — it's too detailed to read at nav size). `logo-text.png` is the
   trimmed wordmark (nav only). Both were auto-trimmed of their black borders.

5. **Channel "uploads" playlist trick.** To show a channel's latest uploads
   without knowing individual video IDs, take the channel ID and swap the leading
   `UC` for `UU`. Channel `UCftZF7glmrU1a_hvzWD4EDQ` → uploads playlist
   `UUftZF7glmrU1a_hvzWD4EDQ`. This is set in `CONFIG.uploadsPlaylistId` in
   `app.js` and used only when `videos.json` is empty.

6. **Local preview needs a server.** Because the page `fetch()`es the JSON files,
   opening `index.html` straight off disk won't load gigs/videos (browsers block
   local file reads). Run `python -m http.server` from the folder and open
   `http://localhost:8000`. On Azure it just works.

7. **`preview.html` is generated, not authored.** Don't hand-edit it. See §9.

---

## 9. `preview.html` and `build-preview.py`

`preview.html` is a single self-contained file with **all** CSS, JS, data and
images inlined — useful for previewing the site as one portable file. It is **not**
the source of truth and is **not** deployed.

`build-preview.py` regenerates it: `python build-preview.py`. The script pastes
the **real `app.js` unchanged** and shims `fetch()` so the inlined data is used
instead of network calls — so it can never drift from the real behaviour. Rerun
it any time you change the source.

In Claude Code with a browser available you can largely ignore this and just view
the real site via a local server — it's a more faithful test (and YouTube embeds
work on localhost).

---

## 10. Outstanding TODOs (roughly prioritised)

1. **Favicon.** `assets/favicon.svg` is a leftover placeholder: an orange `S`
   (`#ff3d1f`) from before the purple rebrand. At minimum recolour to `#962fd1`.
   Better: build it from the real logo. Note favicons render ~16px, so fine detail
   and the splatter texture vanish — a bold simplified mark (a single stylised
   letter or a clean silhouette) reads best. A square logo asset would help.
2. **Band photo.** Add a real photo to `assets/` (e.g. `band.jpg`), point the bio
   `<img>` at it, and remove the `hidden` attribute on the `<figure class="bio__portrait">`.
   The style poster has usable band shots if nothing else is available.
3. **Pinned video title.** Rename `"Splinter — Live"` in `data/videos.json` to the
   real title (couldn't be auto-fetched — YouTube rate-limited the lookup).
4. **Confirm embedding** is allowed on video `YcfrnpqVhZA` (YouTube Studio → Edit).
5. **Optional:** pin more videos, wire real ticket links into gigs, add an "updated
   on" line to the gig list (the poster has one), add a square logo for OpenGraph.

---

## 11. Reference data (band)

- **Email:** splinterbcc@gmail.com
- **Instagram:** https://www.instagram.com/splinter.rockband/
- **Facebook:** https://www.facebook.com/splinterrockband
- **YouTube channel:** https://www.youtube.com/@Splinterbcc
  - Channel ID: `UCftZF7glmrU1a_hvzWD4EDQ`
  - Uploads playlist: `UUftZF7glmrU1a_hvzWD4EDQ`
- **Hero eyebrow text:** "Modern & Classic Hard Rock Covers"
- **Bio (current copy):** "Splinter — a high-energy rock covers band from the
  Black Country, smashing out the best heavy rock tracks from the past five
  decades. From AC/DC, Guns N' Roses and Black Sabbath through to Black Stone
  Cherry, Muse, Royal Blood and Queens of the Stone Age…"

---

## 12. Continuing in Claude Code

1. **Get the files:** unzip the project so you have `index.html`, `assets/`,
   `data/`, etc. in one folder. Open that folder in Claude Code.
2. **Preview locally** (best test):
   ```bash
   python -m http.server
   # then open http://localhost:8000  (gigs/videos load; YouTube embeds work here)
   ```
3. **Regenerate the portable preview** (optional): `python build-preview.py`.
4. **Make changes:** content/colours in `index.html` + `assets/styles.css`;
   gigs in `data/gigs.json`; videos in `data/videos.json`; behaviour in
   `assets/app.js`. Editable spots in the HTML are marked `EDIT ME`.
5. **Deploy:** push the repo to GitHub, then in the Azure Portal create a
   **Static Web App** → Plan **Free** → Source **GitHub** → Build preset
   **Custom**, App location `/`, Api and Output locations blank →
   Deployment authorization policy **Deployment token** → Create. Pushes
   thereafter auto-deploy.

That's the whole project. Welcome aboard.
