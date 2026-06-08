/* ============================================================
   SPLINTER — site behaviour
   Your content lives in:
     · data/gigs.json    (live dates)
     · data/videos.json  (hand-picked YouTube videos — optional)
   If videos.json is empty, the site shows your channel's latest
   uploads automatically (see CONFIG below).
   ============================================================ */

const CONFIG = {
  youtubeChannelUrl: "https://www.youtube.com/@Splinterbcc",
  // "Uploads" playlist = channel ID with "UC" swapped for "UU".
  // Channel UCftZF7glmrU1a_hvzWD4EDQ -> uploads UUftZF7glmrU1a_hvzWD4EDQ
  uploadsPlaylistId: "UUftZF7glmrU1a_hvzWD4EDQ"
};

/* ---------- footer year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- mobile menu ---------- */
const toggle = document.getElementById("navToggle");
const links = document.querySelector(".nav__links");
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("is-open");
  toggle.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});
links.addEventListener("click", (e) => {
  if (e.target.matches(".nav__link")) {
    links.classList.remove("is-open");
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

/* ---------- nav: shadow on scroll ---------- */
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* ---------- scrollspy ---------- */
const navLinks = [...document.querySelectorAll(".nav__link")];
const sections = navLinks.map((l) => document.querySelector(l.getAttribute("href"))).filter(Boolean);
const spy = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      const id = entry.target.id;
      navLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + id));
    }
  }),
  { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
);
sections.forEach((s) => spy.observe(s));

/* ============================================================
   GIGS — loaded from data/gigs.json
   ============================================================ */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function ordinal(n) { const s = ["th","st","nd","rd"], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0]; }

function gigMarkup(g, isPast) {
  const d = new Date(g.date + "T00:00:00");
  const valid = !isNaN(d);
  const dow = valid ? DOW[d.getDay()].toUpperCase() : "";
  const day = valid ? d.getDate() : "";
  const when = valid ? `${day}<sup>${ordinal(day)}</sup> ${MONTHS[d.getMonth()].toUpperCase()} <span class="gig__year2">${d.getFullYear()}</span>` : (g.date || "");

  let badge = "";
  if (g.status === "soldout") badge = `<span class="gig__badge gig__badge--soldout">Sold out</span>`;
  else if (g.status === "free") badge = `<span class="gig__badge gig__badge--free">Free</span>`;

  let action = badge;
  if (!isPast && g.status !== "soldout" && g.ticketUrl) {
    action = `<a class="btn btn--ghost" href="${g.ticketUrl}" target="_blank" rel="noopener">Tickets</a>` + badge;
  }

  const city = g.city ? `<span class="gig__city">, ${g.city}</span>` : "";
  return `
    <li class="gig">
      <span class="gig__dow">${dow}</span>
      <span class="gig__when">${when}</span>
      <span class="gig__venue">${g.venue ?? "TBA"}${city}</span>
      ${g.time ? `<span class="gig__meta">${g.time}</span>` : ""}
      <span class="gig__action">${action}</span>
    </li>`;
}

async function loadGigs() {
  const upcomingEl = document.getElementById("upcomingGigs");
  const pastEl = document.getElementById("pastGigs");
  const pastGroup = document.getElementById("pastGroup");
  try {
    const res = await fetch("data/gigs.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const gigs = await res.json();

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const upcoming = [], past = [];
    gigs.forEach((g) => {
      const d = new Date(g.date + "T00:00:00");
      (d >= today ? upcoming : past).push(g);
    });
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    past.sort((a, b) => new Date(b.date) - new Date(a.date));

    upcomingEl.innerHTML = upcoming.length
      ? upcoming.map((g) => gigMarkup(g, false)).join("")
      : `<li class="gig-list__empty">No dates announced right now — check back soon.</li>`;

    if (past.length) {
      pastEl.innerHTML = past.map((g) => gigMarkup(g, true)).join("");
      pastGroup.hidden = false;
    }
  } catch (err) {
    upcomingEl.innerHTML = `<li class="gig-list__error">
      Couldn’t load dates. If you’re previewing locally, run
      <code>python -m http.server</code> in this folder and open
      <code>http://localhost:8000</code>. (Works automatically once deployed.)
    </li>`;
    console.error("gigs.json failed to load:", err);
  }
}

/* ============================================================
   VIDEOS — data/videos.json (hand-picked), else channel uploads
   ============================================================ */
const PLAY_SVG = `<svg viewBox="0 0 68 48" aria-hidden="true"><path d="M66.5 7.7c-.8-2.9-3-5.1-5.9-5.9C55.3.5 34 .5 34 .5s-21.3 0-26.6 1.3c-2.9.8-5.1 3-5.9 5.9C.2 13 .2 24 .2 24s0 11 1.3 16.3c.8 2.9 3 5.1 5.9 5.9C12.7 47.5 34 47.5 34 47.5s21.3 0 26.6-1.3c2.9-.8 5.1-3 5.9-5.9C67.8 35 67.8 24 67.8 24s0-11-1.3-16.3z" fill="#962fd1"/><path d="M27 34V14l18 10-18 10z" fill="#ffffff"/></svg>`;

function videoMarkup(v) {
  const thumb = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
  return `
    <div class="video" data-id="${v.id}" role="button" tabindex="0" aria-label="Play: ${v.title ?? "video"}">
      <img src="${thumb}" alt="${v.title ?? "Video thumbnail"}" loading="lazy" />
      <div class="video__play">${PLAY_SVG}</div>
      ${v.title ? `<div class="video__title">${v.title}</div>` : ""}
    </div>`;
}

function activateVideo(el) {
  el.innerHTML = `<iframe src="https://www.youtube.com/embed/${el.dataset.id}?autoplay=1&rel=0&playsinline=1"
    title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
}

function featuredPlaylistMarkup() {
  return `
    <div class="video video--featured" data-playlist="${CONFIG.uploadsPlaylistId}" role="button" tabindex="0" aria-label="Play latest videos">
      <div class="video__label">
        <div class="video__play">${PLAY_SVG}</div>
        <span class="video__label-text">Latest from YouTube</span>
      </div>
    </div>`;
}

function activatePlaylist(el) {
  el.innerHTML = `<iframe src="https://www.youtube.com/embed/videoseries?list=${el.dataset.playlist}&autoplay=1&rel=0&playsinline=1"
    title="Splinter — latest videos" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
}

function wireVideos(grid) {
  grid.querySelectorAll(".video").forEach((el) => {
    const go = () => (el.dataset.playlist ? activatePlaylist(el) : activateVideo(el));
    el.addEventListener("click", go);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });
  });
}

async function loadVideos() {
  const grid = document.getElementById("videoGrid");
  let videos = [];
  try {
    const res = await fetch("data/videos.json", { cache: "no-store" });
    if (res.ok) videos = await res.json();
  } catch (err) {
    console.warn("videos.json not loaded, using channel uploads:", err);
  }

  if (videos.length) {
    grid.innerHTML = videos.map(videoMarkup).join("");
  } else {
    // No hand-picked videos: feature the channel's latest uploads.
    grid.innerHTML = featuredPlaylistMarkup();
  }
  wireVideos(grid);

  // Always offer a direct channel link below the grid.
  const foot = document.createElement("div");
  foot.className = "videos__foot";
  foot.innerHTML = `<a class="video__channel-link" href="${CONFIG.youtubeChannelUrl}" target="_blank" rel="noopener">Browse the full channel ↗</a>`;
  grid.after(foot);
}

loadGigs();
loadVideos();
