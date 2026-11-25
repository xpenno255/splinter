/* ============================================================
   SPLINTER — "flypost" concept: behaviour
   Content lives in:
     · data/gigs.json    (live dates)
     · data/videos.json  (hand-picked YouTube videos — optional)
   If videos.json is empty, the channel's latest uploads are shown.
   ============================================================ */

const CONFIG = {
  youtubeChannelUrl: "https://www.youtube.com/@Splinterrockband",
  // "Uploads" playlist = channel ID with "UC" swapped for "UU".
  uploadsPlaylistId: "UUftZF7glmrU1a_hvzWD4EDQ",
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* Two logo treatments to compare: the poster logo (default) and the earlier
   splatter logo via ?logo=classic. Delete this block once one is chosen. */
const CLASSIC = new URLSearchParams(location.search).get("logo") === "classic";
if (CLASSIC) {
  document.documentElement.classList.add("logo-classic");
  $$("img[data-classic]").forEach((img) => {
    img.removeAttribute("width"); img.removeAttribute("height");
    img.src = img.dataset.classic;
  });
}
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "");

/* Small seeded PRNG so torn edges and bursts are stable between paints. */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/* Jagged star polygon as "x,y x,y …" — used for stickers and play buttons. */
function burstPoints(spikes, outer, inner, cx, cy, seed) {
  const r = rng(seed), pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 ? inner * (0.9 + r() * 0.2) : outer * (0.78 + r() * 0.22);
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`);
  }
  return pts.join(" ");
}

$("#year").textContent = new Date().getFullYear();
const stickerBurst = $("#stickerBurst");
if (stickerBurst) stickerBurst.setAttribute("points", burstPoints(18, 100, 70, 100, 100, 11));

/* ============================================================
   NAV — mobile menu + scrollspy
   ============================================================ */
const toggle = $("#navToggle");
const menu = $("#menu");
function setMenu(open) {
  menu.hidden = !open;
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  toggle.firstElementChild.textContent = open ? "Close" : "Menu";
  document.body.style.overflow = open ? "hidden" : "";
}
toggle.addEventListener("click", () => setMenu(menu.hidden));
menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); toggle.focus(); } });

const nav = $("#nav");
let lastY = window.scrollY;
function navState() {
  const y = window.scrollY;
  nav.classList.toggle("is-stuck", y > 40);
  // duck away on the way down, come back on the way up (never while the menu is open)
  if (Math.abs(y - lastY) > 6) {
    nav.classList.toggle("is-away", y > lastY && y > window.innerHeight * 0.6 && menu.hidden);
    lastY = y;
  }
}
window.addEventListener("scroll", navState, { passive: true });
navState();

const navLinks = $$(".nav__link");
const spy = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    navLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + id));
  }),
  { rootMargin: "-45% 0px -50% 0px" }
);
$$("main > section[id]").forEach((s) => spy.observe(s));

/* ============================================================
   TORN PAPER — every paper sheet gets its own ripped edge
   ============================================================ */
function tearSheets() {
  $$("[data-torn]").forEach((el, n) => {
    const r = rng(97 + n * 31);
    const depth = parseFloat(getComputedStyle(el).getPropertyValue("--tear")) || 22;
    const steps = Math.max(24, Math.round(el.offsetWidth / 26));
    const top = [], bottom = [];
    for (let i = 0; i <= steps; i++) {
      const x = ((i / steps) * 100).toFixed(2);
      top.push(`${x}% ${(r() * depth).toFixed(1)}px`);
      bottom.push(`${x}% calc(100% - ${(r() * depth).toFixed(1)}px)`);
    }
    el.style.clipPath = `polygon(${top.join(",")},${bottom.reverse().join(",")})`;
  });
}
tearSheets();
let tearTimer;
window.addEventListener("resize", () => { clearTimeout(tearTimer); tearTimer = setTimeout(tearSheets, 200); });

/* ============================================================
   REVEALS + kinetic setlist rows
   ============================================================ */
const revealer = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); revealer.unobserve(e.target); } }),
  { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
);
$$(".reveal").forEach((el) => revealer.observe(el));

const acts = $$(".act");
/* Long names are shrunk to fit their row; whatever room is left is the row's travel. */
function fitActs() {
  acts.forEach((el) => {
    const name = el.lastElementChild, no = el.firstElementChild;
    el.style.fontSize = "";
    const cs = getComputedStyle(el);
    const room = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - no.offsetWidth - parseFloat(cs.columnGap || 0);
    if (name.offsetWidth > room) el.style.fontSize = `${(parseFloat(cs.fontSize) * room / name.offsetWidth * 0.985).toFixed(1)}px`;
    el.dataset.slack = Math.max(0, room - name.offsetWidth).toFixed(0);
  });
}
fitActs();
document.fonts?.ready.then(() => { fitActs(); onScroll(); });
window.addEventListener("resize", () => { fitActs(); onScroll(); });
const heroLogo = $("#heroLogo");
const hero = $("#home");
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    if (reduceMotion.matches) return;
    const vh = window.innerHeight;
    const y = window.scrollY;
    // the logo lunges at you as you leave the hero
    if (y < vh * 1.2) {
      const p = Math.min(1, y / (vh * 0.9));
      heroLogo.style.transform = `translateY(${p * 60}px) scale(${1 + p * 0.55})`;
      heroLogo.style.opacity = String(1 - p * 0.9);
    }
    // artist rows slide against each other
    let lit = null, best = Infinity;
    acts.forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.bottom < -100 || b.top > vh + 100) return;
      const mid = b.top + b.height / 2;
      // p runs 0 → 1 as the row crosses the screen; it slides across its own free space
      const p = Math.min(1, Math.max(0, 1 - (b.top + b.height) / (vh + b.height)));
      const slack = Number(el.dataset.slack) || 0;
      el.style.setProperty("--x", `${(p * slack * -Number(el.dataset.drift)).toFixed(1)}px`);
      const d = Math.abs(mid - vh * 0.5);
      if (d < best) { best = d; lit = el; }
    });
    // on touch devices there is no hover, so the row at centre-screen lights up
    if (!canHover) acts.forEach((el) => el.classList.toggle("is-lit", el === lit && best < vh * 0.35));
  });
}
const canHover = window.matchMedia("(hover: hover)").matches;
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ============================================================
   HERO VIDEO — only fetched when motion is welcome
   ============================================================ */
const heroVideo = $("#heroVideo");
function startVideo() {
  if (reduceMotion.matches || heroVideo.src) return;
  const small = window.matchMedia("(max-width: 700px)").matches;
  heroVideo.src = small ? heroVideo.dataset.srcMobile : heroVideo.dataset.src;
  heroVideo.play().catch(() => {});
}
startVideo();
new IntersectionObserver(([e]) => {
  if (!heroVideo.src) return;
  if (e.isIntersecting) heroVideo.play().catch(() => {}); else heroVideo.pause();
}).observe(hero);

/* ============================================================
   HERO STARBURST — the logo's spikes, alive.
   Redrawn at ~12fps on purpose: it should boil like hand-drawn
   animation, not glide.
   ============================================================ */
(function burst() {
  const cv = $("#burst");
  const ctx = cv.getContext("2d");
  const SPIKES = 30;
  const seeds = Array.from({ length: SPIKES }, (_, i) => ({ a: rng(i * 7 + 1)(), b: rng(i * 13 + 5)(), c: rng(i * 29 + 3)() }));
  let w = 0, h = 0, dpr = 1, pointer = null, energy = 0, last = 0, visible = true;
  let geo = { cy: 0, rx: 1, ry: 1, vy: 1 };

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const lw = heroLogo.offsetWidth, lh = heroLogo.offsetHeight;
    const cy = heroLogo.offsetParent.offsetTop + heroLogo.offsetTop + lh / 2;
    const ry = lh * 0.5;
    geo = { cy, rx: lw * 0.5, ry, vy: Math.max(0.25, Math.min(1, (cy - 78 - ry) / (ry * 0.8))) };
    draw(performance.now());
  }

  // The burst hugs the logo: valleys sit on the logo's edge, spikes fly out from there.
  function ring(t, scale, wobble) {
    const cx = w / 2, cy = geo.cy;
    const rx = geo.rx * scale, ry = geo.ry * scale;
    const pa = pointer ? Math.atan2(pointer.y - cy, pointer.x - cx) : null;
    const frame = Math.floor(t / 85);
    ctx.beginPath();
    for (let i = 0; i < SPIKES * 2; i++) {
      const s = seeds[(i >> 1) % SPIKES];
      const a = (i / (SPIKES * 2)) * Math.PI * 2 + (s.a - 0.5) * 0.06;
      let k;
      if (i % 2) {
        k = 1 + s.b * 0.1;
      } else {
        const boil = rng(frame * 131 + i * 17)();
        const beat = Math.sin(t / 240 + s.c * 6.28) * 0.5 + 0.5;
        k = 1.28 + s.c * 0.5 + (boil - 0.5) * wobble + beat * 0.06;
        if (pa !== null) {
          let d = Math.abs(a - pa) % (Math.PI * 2);
          if (d > Math.PI) d = Math.PI * 2 - d;
          k += Math.max(0, 1 - d / 0.7) * 0.5 * energy;
        }
      }
      // spikes are squashed vertically so they never run up into the nav
      const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * (1 + (k - 1) * geo.vy);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineJoin = "miter";
    const wob = reduceMotion.matches ? 0 : 0.12;
    // outer ghost ring
    if (CLASSIC) {
      ring(t * 0.7 + 4000, 1.22, wob);
      ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1.5; ctx.stroke();
      // main burst: black body, white keyline — the poster's outline
      ring(t, 1, wob);
      ctx.fillStyle = "rgba(0,0,0,.7)"; ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = w < 700 ? 2 : 3; ctx.stroke();
      return;
    }
    // The poster logo carries its own keyline, so the canvas only throws
    // shockwaves out from behind it: a dark body and two fading echoes.
    ring(t * 0.6 + 9000, 1.42, wob);
    ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 1.25; ctx.stroke();
    ring(t * 0.8 + 4000, 1.2, wob);
    ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.lineWidth = 1.5; ctx.stroke();
    ring(t, 1.02, wob);
    ctx.fillStyle = "rgba(0,0,0,.66)"; ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.62)"; ctx.lineWidth = 2; ctx.stroke();
  }

  function loop(t) {
    if (visible && !reduceMotion.matches && t - last > 82) {
      last = t;
      energy += ((pointer ? 1 : 0) - energy) * 0.18;
      draw(t);
    }
    requestAnimationFrame(loop);
  }

  hero.addEventListener("pointermove", (e) => {
    const b = cv.getBoundingClientRect();
    pointer = { x: e.clientX - b.left, y: e.clientY - b.top };
  });
  hero.addEventListener("pointerleave", () => { pointer = null; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
  window.addEventListener("resize", size);
  heroLogo.firstElementChild.addEventListener("load", size);
  size();
  requestAnimationFrame(loop);
})();

/* ============================================================
   SHARDS — click anywhere and the page splinters.
   Drawn white in "difference" mode so they show on ink and paper.
   ============================================================ */
(function shards() {
  const cv = $("#shards");
  const ctx = cv.getContext("2d");
  let parts = [], running = false, dpr = 1;

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(window.innerWidth * dpr);
    cv.height = Math.round(window.innerHeight * dpr);
  }
  function spawn(x, y) {
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const v = 5 + Math.random() * 11;
      parts.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2,
        len: 14 + Math.random() * 46, wid: 2 + Math.random() * 7,
        rot: a, spin: (Math.random() - 0.5) * 0.3, life: 1, decay: 0.022 + Math.random() * 0.02,
      });
    }
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  function tick() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = "#fff";
    parts = parts.filter((p) => p.life > 0);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.38; p.vx *= 0.985; p.rot += p.spin; p.life -= p.decay;
      const l = p.len * Math.max(p.life, 0), c = Math.cos(p.rot), s = Math.sin(p.rot);
      ctx.beginPath();
      ctx.moveTo(p.x + c * l, p.y + s * l);
      ctx.lineTo(p.x - s * p.wid, p.y + c * p.wid);
      ctx.lineTo(p.x + s * p.wid, p.y - c * p.wid);
      ctx.closePath(); ctx.fill();
    }
    if (parts.length) requestAnimationFrame(tick);
    else { running = false; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
  }
  window.addEventListener("resize", size);
  size();
  window.addEventListener("pointerdown", (e) => {
    if (reduceMotion.matches || e.button > 0) return;
    spawn(e.clientX, e.clientY);
  }, { passive: true });
})();

/* ============================================================
   GIGS — data/gigs.json
   ============================================================ */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ordinal = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0]; };
const gigDate = (g) => new Date(g.date + "T00:00:00");

function gigMarkup(g, { past = false, next = false } = {}) {
  const d = gigDate(g);
  const valid = !isNaN(d);
  const dow = valid ? DOW[d.getDay()] : "";
  const when = valid ? `${d.getDate()}<sup>${ordinal(d.getDate())}</sup> ${MONTHS[d.getMonth()]}` : esc(g.date);
  const tix = safeUrl(g.ticketUrl);
  let action = "";
  if (g.time) action += `<span class="gig__time">${esc(g.time)}</span>`;
  if (g.status === "soldout") action += `<span class="badge badge--soldout">Sold out</span>`;
  else if (g.status === "free") action += `<span class="badge">Free entry</span>`;
  if (!past && g.status !== "soldout" && tix) action += `<a class="btn-tix" href="${esc(tix)}" target="_blank" rel="noopener">Tickets ↗</a>`;
  return `
    <li class="gig${next ? " is-next" : ""}">
      <span class="gig__dow">${dow}</span>
      <span class="gig__date">${when}</span>
      <span class="gig__venue"><span>${esc(g.venue || "TBA")}</span>${g.city ? `<small>${esc(g.city)}</small>` : ""}${g.note ? `<small>${esc(g.note)}</small>` : ""}</span>
      <span class="gig__action">${action}</span>
    </li>`;
}

/* "7.00 pm" / "19:30" → [h, m]; anything else → null */
function parseTime(str) {
  const m = /^\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/i.exec(str || "");
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] || 0), ap = (m[3] || "").toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h < 24 && min < 60 ? [h, min] : null;
}

function billNextGig(g) {
  const d = gigDate(g);
  $("#nextDate").innerHTML = `${DOW[d.getDay()]} ${d.getDate()}<sup>${ordinal(d.getDate())}</sup> ${MONTHS[d.getMonth()]}.`;
  $("#nextVenue").textContent = [g.venue, g.city].filter(Boolean).join(" · ") + (g.time ? ` · ${g.time}` : "");

  const hm = parseTime(g.time);
  const target = new Date(d);
  if (hm) target.setHours(hm[0], hm[1]);
  const label = $("#doorsLabel"), out = $("#countdown");
  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    const ms = target - Date.now();
    if (ms <= 0) {
      label.textContent = "It’s gig day";
      out.textContent = "Tonight!";
      $("#nextLabel").textContent = "Tonight";
      return false;
    }
    const s = Math.floor(ms / 1000);
    const days = Math.floor(s / 86400), hrs = Math.floor((s % 86400) / 3600), mins = Math.floor((s % 3600) / 60), secs = s % 60;
    label.textContent = hm ? "Kick-off in" : "Gig day in";
    out.textContent = `${days}d ${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    return true;
  }
  if (tick()) { const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000); }
}

async function loadGigs() {
  const upcomingEl = $("#upcomingGigs");
  try {
    const res = await fetch("data/gigs.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const gigs = (await res.json()).filter((g) => g && g.date);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const upcoming = gigs.filter((g) => gigDate(g) >= today).sort((a, b) => gigDate(a) - gigDate(b));
    const past = gigs.filter((g) => gigDate(g) < today).sort((a, b) => gigDate(b) - gigDate(a));

    upcomingEl.innerHTML = upcoming.length
      ? upcoming.map((g, i) => gigMarkup(g, { next: i === 0 })).join("")
      : `<li class="gig-list__note">No dates announced right now — check back soon.</li>`;

    if (upcoming.length) {
      billNextGig(upcoming[0]);
      // "2026" for a single year, "2026/27" when the list runs into the next one
      const y1 = gigDate(upcoming[0]).getFullYear(), y2 = gigDate(upcoming[upcoming.length - 1]).getFullYear();
      $("#gigYear").textContent = y1 === y2 ? y1 : `${y1}/${String(y2).slice(-2)}`;
    } else {
      $("#nextLabel").textContent = "On the road";
      $("#nextDate").textContent = "New dates soon";
      $("#nextVenue").textContent = "Watch this space — or book us and make one";
    }

    if (past.length) {
      $("#pastGigs").innerHTML = past.map((g) => gigMarkup(g, { past: true })).join("");
      $("#pastCount").textContent = `(${past.length})`;
      $("#pastGroup").hidden = false;
    }
  } catch (err) {
    upcomingEl.innerHTML = `<li class="gig-list__note">
      Couldn’t load dates. If you’re previewing locally, run <code>python3 -m http.server</code>
      in this folder and open <code>http://localhost:8000</code>.</li>`;
    console.error("gigs.json failed to load:", err);
  }
}

/* ============================================================
   VIDEOS — data/videos.json (hand-picked), else channel uploads
   ============================================================ */
const playBadge = (seed) => `
  <span class="video__play" aria-hidden="true">
    <svg viewBox="0 0 200 200"><polygon points="${burstPoints(14, 100, 68, 100, 100, seed)}"/></svg>
    <b>PLAY</b>
  </span>`;
const IFRAME_ALLOW = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

function videoMarkup(v, i) {
  const id = encodeURIComponent(v.id);
  return `
    <div class="video" data-id="${esc(id)}" role="button" tabindex="0" aria-label="Play: ${esc(v.title || "video")}">
      <img src="https://i.ytimg.com/vi/${esc(id)}/hqdefault.jpg" alt="" loading="lazy" />
      ${playBadge(21 + i * 7)}
      ${v.title ? `<div class="video__title">${esc(v.title)}</div>` : ""}
    </div>`;
}

function activate(el) {
  const src = el.dataset.playlist
    ? `https://www.youtube.com/embed/videoseries?list=${el.dataset.playlist}&autoplay=1&rel=0&playsinline=1`
    : `https://www.youtube.com/embed/${el.dataset.id}?autoplay=1&rel=0&playsinline=1`;
  el.classList.add("is-playing");
  el.removeAttribute("role");
  el.removeAttribute("tabindex");
  el.innerHTML = `<iframe src="${src}" title="Splinter on YouTube" allow="${IFRAME_ALLOW}" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
}

async function loadVideos() {
  const grid = $("#videoGrid");
  let videos = [];
  try {
    const res = await fetch("data/videos.json", { cache: "no-store" });
    if (res.ok) videos = (await res.json()).filter((v) => v && v.id);
  } catch (err) {
    console.warn("videos.json not loaded, using channel uploads:", err);
  }

  grid.innerHTML = videos.length
    ? videos.map(videoMarkup).join("")
    : `<div class="video video--featured" data-playlist="${CONFIG.uploadsPlaylistId}" role="button" tabindex="0" aria-label="Play latest videos">
         ${playBadge(5)}<div class="video__title">Latest from YouTube</div>
       </div>`;

  grid.addEventListener("click", (e) => { const v = e.target.closest(".video:not(.is-playing)"); if (v) activate(v); });
  grid.addEventListener("keydown", (e) => {
    const v = e.target.closest(".video:not(.is-playing)");
    if (v && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); activate(v); }
  });

  const foot = document.createElement("div");
  foot.className = "videos__foot";
  foot.innerHTML = `<a class="link-big" href="${CONFIG.youtubeChannelUrl}" target="_blank" rel="noopener">More on our YouTube channel ↗</a>`;
  grid.after(foot);
}

loadGigs();
loadVideos();
