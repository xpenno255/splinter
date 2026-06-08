# Splinter — website

A fast, single-page site for the band: landing, bio, gig list, videos and
contact. No database, no server — just files. It runs free on **Azure Static
Web Apps**.

---

## 1. The files

```
index.html                 ← page structure + written copy (bio, email, socials)
assets/
  styles.css               ← all colours & fonts at the top (design tokens)
  app.js                   ← behaviour + your YouTube channel settings (CONFIG)
  logo.svg                 ← REPLACE with your real logo when you have one
  favicon.svg              ← browser-tab icon (optional to change)
  portrait-placeholder.svg ← REPLACE with a band photo (assets/band.jpg)
data/
  gigs.json                ← YOUR LIVE DATES — edit to add/remove shows
  videos.json              ← optional: pin specific YouTube videos
staticwebapp.config.json   ← Azure settings (leave as-is)
```

Everywhere you should edit is marked **`EDIT ME`** in the code.

---

## 2. Adding a gig (the important one)

Open `data/gigs.json` and add a block per show:

```json
{
  "date": "2026-07-18",       // YYYY-MM-DD — drives sorting + upcoming/past
  "venue": "The Robin 2",
  "city": "Bilston, UK",
  "time": "8:00 PM",
  "ticketUrl": "https://...",  // leave "" if none
  "status": "onsale",          // "onsale" | "soldout" | "free" | ""
  "note": ""                    // optional extra line
}
```

The site then automatically splits Upcoming vs Past by today's date, sorts
them, shows a **Tickets** button (unless sold out), and adds **Sold out** /
**Free** badges. The three gigs in there now are PLACEHOLDERS — replace them.

---

## 3. Videos

By default the Videos section shows your **channel's latest uploads**
automatically (set in `assets/app.js` → `CONFIG.uploadsPlaylistId`, currently
your channel `@Splinterbcc`). You don't have to do anything.

To **pin specific videos** instead, add them to `data/videos.json`:

```json
[
  { "id": "VIDEO_ID_HERE", "title": "Live at The Robin 2" }
]
```

`VIDEO_ID_HERE` is the part of a YouTube link after `watch?v=`. As soon as
`videos.json` has entries, those replace the auto playlist.

---

## 4. Previewing on your computer

The page loads `gigs.json`, so opening `index.html` directly won't show dates
(browsers block local file reads). Run a tiny server instead:

```bash
# from inside this folder
python -m http.server
```

Then open <http://localhost:8000>. Once deployed to Azure this is automatic.

---

## 5. Putting it on Azure (free) — one-time setup

You'll need a free GitHub account and a free Azure account.

1. **Put the code on GitHub** — create a repo and upload this whole folder.
2. In the **Azure Portal**: **Create a resource → Static Web App**.
3. Fill in:
   - **Plan type:** **Free**
   - **Source:** GitHub → authorise → pick your repo + branch
   - **Build presets:** **Custom**
   - **App location:** `/`
   - **Api location:** *(blank)*
   - **Output location:** *(blank)*
4. **Create.** In ~2 minutes you get a live URL like
   `https://something-123.azurestaticapps.net`.

**From then on, every push to GitHub (e.g. a new gig) redeploys the site in
about a minute.** That's your update workflow.

### Custom domain (optional)
Static Web App → **Custom domains** → add your domain, follow the DNS steps.
Free SSL is included automatically.

---

## 6. Rebranding / colours

Open `assets/styles.css`. The first block (`:root`) holds every colour and
font. The current theme is `--accent: #ff3d1f` (molten orange-red) on
near-black with the industrial **Big Shoulders Display** typeface. Change those
values to match your logo once you have it.

---

## Free tier, in short
Azure Static Web Apps Free: free hosting + SSL, a custom domain, global CDN,
100 GB bandwidth/month — plenty for a band site. No uptime SLA (fine here).
Check Azure's pricing page before launch in case limits change.
