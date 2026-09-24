// ---------------------------------------------------------------------------
// The render engine.
//
// One function, `renderPage(pageId, site, mode)`, produces an entire HTML
// document for a page of a site. It is used for:
//   - mode "file"    → the multi-page static site (what goes into the .zip)
//   - mode "preview" → the live preview iframe (identical markup, links are
//                      intercepted so the dashboard can switch pages)
//   - mode "app"     → a single-file demo build with client-side page routing
//
// Everything the user types is HTML-escaped. No layout logic lives anywhere
// else — if the preview looks right, the exported site looks right.
// ---------------------------------------------------------------------------

import type { JobItem, MenuItem, PageId, PaletteId, ProjectItem, ServiceItem, SiteConfig, SocialKey, TemplateId } from "./types";
import { FEATURE_STRIP, isBuiltInPage, isTextAlign } from "./types";
import { SOCIAL_META } from "./types";
import { getPalette, type ThemeTokens } from "./palettes";
import { templateMeta, pageLabel } from "./templates";

export type RenderMode = "file" | "preview" | "app";

export const PAGE_FILE: Record<PageId, string> = {
  home: "index.html",
  about: "about.html",
  menu: "menu.html",
  gallery: "gallery.html",
  contact: "contact.html",
  team: "team.html",
  booking: "booking.html",
  jobs: "jobs.html",
  pricing: "pricing.html",
  faq: "faq.html",
  testimonials: "testimonials.html",
  news: "news.html",
};

/** File name for any page ref (custom pages get `<slug>.html`). */
export function pageFile(ref: string): string {
  return isBuiltInPage(ref) ? PAGE_FILE[ref] : `${ref}.html`;
}

/** Human label for any page ref (built-in template label or custom title). */
export function labelFor(site: SiteConfig, ref: string): string {
  if (isBuiltInPage(ref)) return pageLabel(site.template, ref);
  const custom = site.customPages.find((c) => c.id === ref);
  return (custom?.title || "").trim() || "New page";
}

export function esc(value: unknown): string {
  const s = String(value ?? "");
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "site";
}

export function pageHref(mode: RenderMode, id: string): string {
  if (mode === "file") return id === "home" ? "./index.html" : `./${pageFile(id)}`;
  if (mode === "preview") return `#/page/${id}`;
  return `#/${id}`;
}

function waNumber(site: SiteConfig): string {
  return site.contact.whatsapp.replace(/\D/g, "");
}

/** Format a price the friendly way: "12.50" → "$12.50", text/currency untouched. */
function priceHtml(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  const isNumeric = /^[0-9]+(\.[0-9]{1,2})?$/.test(t);
  return isNumeric ? `$${esc(t)}` : esc(t);
}

function paragraphs(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join(" ");
}

/** Build an inline style attribute with CSS custom properties (empty values skipped). */
function inlineVars(pairs: Array<[string, string]>): string {
  const parts = pairs.filter(([, v]) => v.trim().length > 0);
  if (parts.length === 0) return "";
  return ` style="${parts.map(([k, v]) => `${k}:${esc(v.trim())}`).join(";")}"`;
}

// ---------------------------------------------------------------------------
// Generated-site stylesheet
// ---------------------------------------------------------------------------

function cssFor(paletteId: PaletteId, appStyles: boolean): string {
  const p = getPalette(paletteId);
  const vars = (t: ThemeTokens) => `
  --bg: ${t.bg};
  --surface: ${t.surface};
  --surface2: ${t.surface2};
  --text: ${t.text};
  --muted: ${t.muted};
  --border: ${t.border};
  --accent: ${t.accent};
  --accent-text: ${t.accentText};
  --hero-bg: ${t.heroBg};`;

  return `
:root {${vars(p.light)}
  --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06);
  --font-head: "Fraunces", Georgia, "Times New Roman", serif;
  --font-body: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
}
[data-theme="dark"] {${vars(p.dark)}
  --shadow: 0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.35);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
.container { max-width: 1080px; margin: 0 auto; padding: 0 22px; }

/* ---------- Nav ---------- */
.nav {
  position: sticky; top: 0; z-index: 50;
  background: var(--header-bg, var(--surface));
  border-bottom: 1px solid var(--border);
}
.nav-inner {
  max-width: 1080px; margin: 0 auto; padding: 16px 22px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.brand {
  font-family: var(--font-head); font-weight: 700; font-size: 1.35rem;
  color: var(--header-text, var(--accent)); text-decoration: none; letter-spacing: -0.01em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.nav-right { display: flex; align-items: center; gap: 10px; }
.nav-links { display: flex; align-items: center; gap: 22px; }
.nav-links a {
  color: var(--header-text, var(--text)); text-decoration: none; font-weight: 500; font-size: 0.98rem;
  padding: 4px 2px; transition: color 0.15s ease;
}
.nav-links a:hover { color: var(--accent); }
.theme-btn {
  border: 1px solid var(--border); background: var(--surface2); color: var(--text);
  width: 38px; height: 38px; border-radius: 999px; cursor: pointer; font-size: 1rem;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background 0.15s ease;
}
.theme-btn:hover { border-color: var(--accent); }
[data-theme="dark"] .icon-dark { display: none; }
[data-theme="light"] .icon-light { display: none; }
.nav-toggle {
  display: none; border: 1px solid var(--border); background: var(--surface2);
  color: var(--text); border-radius: 10px; width: 40px; height: 40px;
  cursor: pointer; font-size: 1.15rem;
}

/* ---------- Hero ---------- */
.hero {
  background-color: var(--hero-bg);
  background-size: cover; background-position: center;
  padding: 96px 0 88px;
  text-align: center;
  position: relative;
}
.hero .container { position: relative; z-index: 2; }
.hero h1 {
  font-family: var(--font-head);
  font-size: clamp(2.4rem, 5.5vw, 3.6rem);
  line-height: 1.12; margin: 0 0 18px; letter-spacing: -0.015em;
}
.hero-sub {
  color: var(--muted); font-size: 1.12rem;
  max-width: 640px; margin: 0 auto;
}
.hero-cta { margin-top: 32px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

/* ---------- Buttons ---------- */
.btn {
  display: inline-block; padding: 13px 26px; border-radius: 999px;
  font-weight: 600; font-size: 0.98rem; text-decoration: none;
  transition: transform 0.08s ease, box-shadow 0.15s ease;
  cursor: pointer; border: 0;
}
.btn:active { transform: translateY(1px); }
.btn-primary { background: var(--accent); color: var(--accent-text); box-shadow: var(--shadow); }
.btn-primary:hover { filter: brightness(1.08); }
.btn-ghost {
  background: transparent; color: var(--text);
  border: 1px solid var(--border);
}
.btn-ghost:hover { border-color: var(--accent); color: var(--accent); }

/* ---------- Generic sections ---------- */
.section { padding: 68px 0; }
.section-head {
  font-family: var(--font-head);
  font-size: clamp(1.6rem, 3vw, 2.1rem);
  text-align: center; margin: 0 0 8px; letter-spacing: -0.01em;
}
.section-sub { text-align: center; color: var(--muted); margin: 0 0 40px; }
.head-row { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 28px; }
.head-row h2 { font-family: var(--font-head); font-size: clamp(1.5rem, 3vw, 1.9rem); margin: 0; }
.head-row .link { color: var(--accent); font-weight: 600; text-decoration: none; white-space: nowrap; }

/* ---------- Feature chips ---------- */
.chips { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.chip {
  background: var(--surface2); border: 1px solid var(--border);
  padding: 9px 16px; border-radius: 999px; font-size: 0.92rem; font-weight: 500;
}

/* ---------- Cards grid (menu / projects / services) ---------- */
.card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.menu-card, .project-card, .service-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 16px; box-shadow: var(--shadow);
}
.menu-card { padding: 20px 22px; }
.menu-img {
  width: 100%; height: 130px; object-fit: cover; border-radius: 10px;
  margin-bottom: 12px; display: block;
}
.menu-row { display: flex; align-items: baseline; gap: 10px; }
.menu-name { margin: 0; font-size: 1.08rem; letter-spacing: -0.01em; }
.menu-dots { flex: 1; border-bottom: 2px dotted var(--border); transform: translateY(-4px); }
.menu-price { color: var(--accent); font-weight: 700; white-space: nowrap; }
.menu-desc { margin: 10px 0 0; color: var(--muted); font-size: 0.95rem; }

.project-card { overflow: hidden; display: flex; flex-direction: column; }
.project-img { width: 100%; aspect-ratio: 3 / 2; object-fit: cover; display: block; }
.project-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.project-body h3 { margin: 0; font-size: 1.08rem; }
.project-body p { margin: 0; color: var(--muted); font-size: 0.95rem; }
.project-link { color: var(--accent); font-weight: 600; text-decoration: none; margin-top: auto; padding-top: 6px; }

.service-card { padding: 26px; }
.service-icon { font-size: 30px; line-height: 1; }
.service-card h3 { margin: 14px 0 6px; font-size: 1.08rem; }
.service-card p { margin: 0; color: var(--muted); font-size: 0.95rem; }

/* ---------- About ---------- */
.about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
.about-grid.no-img { grid-template-columns: 1fr; max-width: 720px; margin: 0 auto; }
.about-img {
  width: 100%; border-radius: 18px; box-shadow: var(--shadow);
  object-fit: cover; aspect-ratio: 4 / 3; display: block;
}
.about-text { font-size: 1.05rem; }
.about-text p { margin: 0 0 18px; }
.about-text p:last-child { margin-bottom: 0; }

/* ---------- Contact ---------- */
.contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
.info-card {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 14px; padding: 18px 20px; margin-bottom: 14px;
}
.info-card h4 { margin: 0 0 6px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
.info-card p { margin: 0; }
.info-card a { color: var(--text); text-decoration: none; }
.info-card a:hover { color: var(--accent); }
.hours-text { white-space: pre-line; }
.form { display: flex; flex-direction: column; gap: 14px; }
.form label { display: flex; flex-direction: column; gap: 6px; font-weight: 500; font-size: 0.92rem; }
.form input, .form textarea {
  font: inherit; padding: 12px 14px; border-radius: 12px;
  border: 1px solid var(--border); background: var(--surface);
  color: var(--text); width: 100%;
}
.form input:focus, .form textarea:focus { outline: 2px solid var(--accent); outline-offset: 0; border-color: transparent; }
.form textarea { min-height: 130px; resize: vertical; }
.form .btn { align-self: flex-start; }
.form-note { margin: 0; color: var(--muted); font-size: 0.85rem; }
.map { width: 100%; height: 340px; border: 0; border-radius: 16px; margin-top: 24px; filter: saturate(0.92); }

/* ---------- Social links ---------- */
.socials { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 28px; }
.socials.left { justify-content: flex-start; margin-top: 0; }
.social-btn {
  min-width: 44px; height: 44px; padding: 0 12px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--surface2); color: var(--text); text-decoration: none;
  font-weight: 700; font-size: 13px; border: 1px solid var(--border);
  transition: border-color 0.15s ease, color 0.15s ease;
}
.social-btn:hover { border-color: var(--accent); color: var(--accent); }
.foot-socials { margin-top: 0; margin-bottom: 20px; }

/* ---------- WhatsApp float ---------- */
.wa-float {
  position: fixed; right: 22px; bottom: 22px; z-index: 60;
  width: 56px; height: 56px; border-radius: 999px;
  background: #25D366; color: #fff; text-decoration: none;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem; box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
  transition: transform 0.12s ease;
}
.wa-float:hover { transform: scale(1.07); }

/* ---------- Footer ---------- */
.footer {
  background: var(--footer-bg, var(--surface)); border-top: 1px solid var(--border);
  margin-top: 68px; padding: 44px 0 36px; text-align: center;
}
.footer .brand { color: var(--footer-text, var(--accent)); font-size: 1.2rem; }
.foot-tagline { color: var(--muted); margin: 8px 0 18px; font-size: 0.95rem; max-width: 480px; margin-left: auto; margin-right: auto; }
.foot-nav { display: flex; flex-wrap: wrap; gap: 18px; justify-content: center; margin-bottom: 20px; }
.foot-nav a { color: var(--footer-text, var(--text)); text-decoration: none; font-weight: 500; font-size: 0.92rem; }
.foot-nav a:hover { color: var(--accent); }
.foot-meta { color: var(--muted); font-size: 0.87rem; margin: 0; }

/* ---------- App (single-file preview) ---------- */
${appStyles ? `
.page-view { display: none; }
.page-view.active { display: block; }` : ""}

/* ---------- Template personalities ---------- */
.tpl-portfolio .hero { text-align: left; padding: 118px 0 100px; }
.tpl-portfolio .hero h1 { font-size: clamp(2.9rem, 7vw, 4.5rem); max-width: 840px; }
.tpl-portfolio .hero-sub { margin-left: 0; margin-right: 0; max-width: 560px; }
.tpl-portfolio .hero-cta { justify-content: flex-start; }
.tpl-portfolio .nav-links a { text-transform: uppercase; letter-spacing: 0.09em; font-size: 0.84rem; font-weight: 600; }
.tpl-portfolio .card-grid { grid-template-columns: repeat(3, 1fr); }
.tpl-portfolio .project-card:first-child { grid-column: span 2; }
.tpl-portfolio .section { padding: 84px 0; }

.tpl-business .hero { text-align: left; padding: 88px 0 76px; }
.tpl-business .hero h1 { font-size: clamp(2.1rem, 4.4vw, 2.9rem); max-width: 680px; }
.tpl-business .hero-sub { margin-left: 0; margin-right: 0; max-width: 560px; }
.tpl-business .hero-cta { justify-content: flex-start; }
.tpl-business .service-card { display: flex; gap: 16px; align-items: flex-start; padding: 22px 24px; }
.tpl-business .service-icon { font-size: 26px; flex: 0 0 auto; margin-top: 3px; line-height: 1.3; }
.tpl-business .service-body { flex: 1; }
.tpl-business .service-card h3 { margin: 0 0 4px; }
.tpl-business .service-card p { margin-bottom: 0; }

/* ---------- Text & button alignment (user choice wins over template) ---------- */
.hero.align-left { text-align: left; }
.hero.align-center { text-align: center; }
.hero.align-right { text-align: right; }
.hero.align-left .hero-sub { margin-left: 0; margin-right: auto; }
.hero.align-center .hero-sub { margin-left: auto; margin-right: auto; }
.hero.align-right .hero-sub { margin-left: auto; margin-right: 0; }
.hero.align-left .hero-cta { justify-content: flex-start; }
.hero.align-center .hero-cta { justify-content: center; }
.hero.align-right .hero-cta { justify-content: flex-end; }
.section.align-left { text-align: left; }
.section.align-center { text-align: center; }
.section.align-right { text-align: right; }
.section.align-left .chips, .section.align-left .hero-cta { justify-content: flex-start; }
.section.align-center .chips, .section.align-center .hero-cta { justify-content: center; }
.section.align-right .chips, .section.align-right .hero-cta { justify-content: flex-end; }

/* ---------- Modern Studio template (floating colour shapes + glass) ---------- */
.tpl-modern .nav {
  background: color-mix(in srgb, var(--surface) 78%, transparent);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  border-bottom-color: transparent;
}
.tpl-modern .hero { background: transparent; overflow: hidden; text-align: center; padding: 130px 0 116px; }
.tpl-modern .hero h1 { font-size: clamp(2.9rem, 7.2vw, 4.8rem); max-width: 900px; margin-left: auto; margin-right: auto; }
.tpl-modern .hero-sub { max-width: 620px; }
.tpl-modern .menu-card, .tpl-modern .project-card, .tpl-modern .service-card {
  background: color-mix(in srgb, var(--surface) 70%, transparent);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border: 1px solid color-mix(in srgb, var(--border) 65%, transparent);
  border-radius: 22px;
}
.tpl-modern .service-card {
  background: linear-gradient(165deg, color-mix(in srgb, var(--surface2) 65%, transparent), color-mix(in srgb, var(--surface) 40%, transparent));
}
.tpl-modern .chip {
  background: color-mix(in srgb, var(--surface2) 55%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}
.tpl-modern .section-head { letter-spacing: -0.02em; }
.blob {
  position: absolute;
  z-index: 0;
  border-radius: 42% 58% 55% 45% / 55% 45% 60% 40%;
  filter: blur(44px) saturate(1.5);
  opacity: 0.75;
  animation: blobFloat 16s ease-in-out infinite alternate;
  pointer-events: none;
}
.blob.b1 { width: 340px; height: 340px; top: -90px; left: -70px; background: var(--accent); animation-duration: 18s; }
.blob.b2 { width: 260px; height: 260px; top: 30px; right: -60px; background: #a855f7; animation-duration: 24s; animation-delay: -6s; }
.blob.b3 { width: 220px; height: 220px; bottom: -70px; left: 38%; background: #06b6d4; animation-duration: 20s; animation-delay: -3s; }
@keyframes blobFloat {
  from { transform: translate3d(0, 0, 0) rotate(0deg) scale(1); }
  to { transform: translate3d(34px, -26px, 0) rotate(22deg) scale(1.12); }
}

/* ---------- Promo banner & stats strip ("dashboard" numbers) ---------- */
.promo-strip {
  background: var(--text);
  color: var(--bg);
  font-size: 0.82rem;
  text-align: center;
  padding: 9px 16px;
  line-height: 1.4;
}
.stats-strip { background: var(--accent); color: var(--accent-text); }
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 30px 0;
  text-align: center;
}
.stat-value { display: block; font-family: var(--font-head); font-size: clamp(1.6rem, 3.4vw, 2.4rem); font-weight: 700; line-height: 1.1; }
.stat-label { display: block; font-size: 0.85rem; opacity: 0.88; margin-top: 4px; }

/* ---------- Team ---------- */
.team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 22px; margin-top: 8px; }
.team-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 26px 20px 22px;
  text-align: center;
}
.team-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 66px;
  height: 66px;
  border-radius: 50%;
  background: var(--surface2);
  color: var(--accent);
  font-family: var(--font-head);
  font-weight: 700;
  font-size: 1.4rem;
  margin-bottom: 12px;
}
.team-card h3 { margin: 0 0 4px; font-size: 1.08rem; }
.team-role { color: var(--accent); font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 10px; }
.team-bio { color: var(--muted); font-size: 0.92rem; margin: 0; }

/* ---------- Jobs ---------- */
.jobs-list { display: flex; flex-direction: column; gap: 14px; }
.job-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
}
.job-card h3 { margin: 0 0 4px; font-size: 1.05rem; }
.job-meta { margin: 0; color: var(--muted); font-size: 0.9rem; }
.job-side { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.btn-sm { padding: 8px 16px; font-size: 0.85rem; }

/* ---------- Booking ---------- */
.booking-hours { background: var(--surface2); border: 1px solid var(--border); border-radius: 14px; padding: 16px 20px; margin: 22px 0; }
.booking-hours h4 { margin: 0 0 6px; }
.booking-form { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 26px; margin-top: 24px; box-shadow: var(--shadow); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
.form-field { display: block; margin: 0 0 14px; }
.form-field > span { display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 6px; }
.form-note { color: var(--muted); font-size: 0.8rem; margin: 12px 0 0; }

/* ---------- Clinic & Hospital ---------- */
.tpl-clinic .service-card { border-radius: 20px; border: 1px solid var(--border); box-shadow: 0 10px 26px rgba(16, 60, 120, 0.08); padding: 26px; }
.tpl-clinic .service-card .service-icon { background: var(--surface2); }
.tpl-clinic .nav-links a { font-weight: 600; }

/* ---------- Bank & Finance ---------- */
.tpl-bank .nav-links a { text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.82rem; font-weight: 600; }
.tpl-bank .menu-card { text-align: left; border-top: 4px solid var(--accent); border-radius: 16px; padding: 22px; }
.tpl-bank .menu-card .menu-price { color: var(--accent); font-family: var(--font-head); font-size: 1.35rem; font-weight: 700; }
.tpl-bank .menu-card .menu-dots { display: none; }
.tpl-bank .menu-row { flex-wrap: wrap; gap: 6px 10px; }

/* ---------- Online Shop ---------- */
.tpl-shop .menu-card { position: relative; border-radius: 20px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07); border: 1px solid var(--border); padding-bottom: 24px; }
.tpl-shop .menu-card .menu-price { font-weight: 700; color: var(--accent); font-size: 1.15rem; }
.menu-actions { margin-top: 14px; }
.cart-add {
  background: var(--accent); color: var(--accent-text);
  border: 0; border-radius: 999px; padding: 9px 16px;
  font-weight: 600; font-size: 0.9rem; cursor: pointer;
  transition: opacity 0.15s ease, transform 0.1s ease;
}
.cart-add:hover { opacity: 0.9; }
.cart-add:active { transform: scale(0.97); }

/* ---------- Film & Video Studio ---------- */
.tpl-films .nav-links a { text-transform: uppercase; letter-spacing: 0.09em; font-size: 0.84rem; font-weight: 600; }
.tpl-films .card-grid { grid-template-columns: repeat(2, 1fr); }
.tpl-films .project-card { border: 0; border-radius: 18px; overflow: hidden; background: var(--surface); box-shadow: var(--shadow); }
.tpl-films .project-card:first-child { grid-column: span 2; }
.tpl-films .section-head { text-transform: uppercase; letter-spacing: 0.04em; font-size: 1.1rem; }
.tpl-films .hero h1 { font-size: clamp(2.4rem, 6vw, 3.8rem); max-width: 780px; }

/* ---------- HR & Recruitment ---------- */
.tpl-hr .job-card { border-left: 4px solid var(--accent); }
.tpl-hr .hero h1 { max-width: 720px; }

/* ---------- Archetype: centered fullscreen (Dimension) ---------- */
.dim-hero {
  position: relative;
  min-height: 94vh;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; gap: 26px;
  padding: 100px 22px 72px;
  background:
    radial-gradient(1200px 500px at 50% -10%, var(--surface2) 0%, transparent 60%),
    var(--hero-bg, var(--bg));
}
.dim-hero .theme-btn { position: absolute; top: 22px; right: 22px; }
.dim-logo {
  width: 88px; height: 88px; border-radius: 50%;
  border: 1px solid var(--border); background: var(--surface);
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--font-head); font-weight: 700; font-size: 2rem;
  color: var(--accent); box-shadow: var(--shadow);
}
.dim-title {
  margin: 0; font-family: var(--font-head); font-weight: 700;
  font-size: clamp(2.6rem, 7vw, 4.6rem); line-height: 1.05; letter-spacing: -0.02em;
  max-width: 900px;
}
.dim-tag { margin: 0; color: var(--muted); font-size: clamp(1rem, 2vw, 1.2rem); max-width: 640px; }
.dim-pills { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 10px; }
.dim-pills a {
  border: 1px solid var(--border); background: var(--surface);
  color: var(--text); text-decoration: none; font-weight: 600; font-size: 0.95rem;
  padding: 11px 22px; border-radius: 999px; transition: border-color 0.15s ease, color 0.15s ease;
}
.dim-pills a:hover { border-color: var(--accent); color: var(--accent); }

/* ---------- Archetype: centred bar (Dimension chrome on every page) ---------- */
.center-nav {
  position: sticky; top: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  max-width: 1080px; margin: 0 auto; padding: 14px 22px;
  background: var(--surface); border-bottom: 1px solid var(--border);
}
.center-brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--text); min-width: 0; }
.center-logo {
  width: 40px; height: 40px; border-radius: 50%; flex: none;
  border: 1px solid var(--border); background: var(--bg);
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--font-head); font-weight: 700; font-size: 1rem; color: var(--accent);
}
.center-name { font-family: var(--font-head); font-weight: 700; font-size: 1.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.center-right { display: flex; align-items: center; gap: 10px; }
.center-links { display: flex; align-items: center; gap: 6px; }
.center-links a {
  color: var(--text); text-decoration: none; font-weight: 600; font-size: 0.92rem;
  padding: 7px 12px; border-radius: 999px; transition: background 0.15s ease, color 0.15s ease;
}
.center-links a:hover { background: var(--surface2); color: var(--accent); }

/* ---------- Archetype: fixed sidebar (Prologue) ---------- */
.side-nav {
  position: fixed; inset: 0 auto 0 0; width: 290px; z-index: 40;
  display: flex; flex-direction: column; justify-content: space-between; gap: 18px;
  background: var(--surface); border-right: 1px solid var(--border);
  padding: 30px 26px 24px;
}
.side-top { display: flex; flex-direction: column; gap: 10px; }
.side-avatar {
  width: 66px; height: 66px; border-radius: 50%;
  background: var(--surface2); color: var(--accent);
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--font-head); font-weight: 700; font-size: 1.5rem;
}
.side-brand { font-family: var(--font-head); font-weight: 700; font-size: 1.3rem; }
.side-tag { color: var(--muted); font-size: 0.9rem; margin: -4px 0 8px; }
.side-links { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
.side-links a {
  color: var(--text); text-decoration: none; font-weight: 600; font-size: 1rem;
  padding: 8px 10px; border-radius: 10px; transition: background 0.15s ease, color 0.15s ease;
}
.side-links a:hover { background: var(--surface2); color: var(--accent); }
.side-bottom { display: flex; flex-direction: column; gap: 14px; align-items: flex-start; }
.side-socials { gap: 8px; }
.side-socials .social-btn { width: 40px; height: 40px; }
.side-wrap { margin-left: 290px; }
.layout-sidebar .container { max-width: 780px; }
.side-toggle {
  display: none;
  background: none; border: 1px solid var(--border); border-radius: 10px;
  width: 42px; height: 42px; color: var(--text);
  font-size: 1.15rem; cursor: pointer; align-items: center; justify-content: center;
}

/* ---------- Bank: institutional rate table ---------- */
.tpl-bank .hero h1 {
  text-transform: uppercase; letter-spacing: 0.03em;
  font-size: clamp(2.2rem, 5vw, 3.4rem);
}
.tpl-bank .hero { border-bottom: 4px solid var(--accent); }
.table-wrap { overflow-x: auto; }
.rate-table { width: 100%; border-collapse: collapse; margin-top: 8px; min-width: 600px; }
.rate-table th {
  text-align: left; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--muted); padding: 0 16px 12px; border-bottom: 2px solid var(--border);
}
.rate-table td { padding: 18px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.rate-table tbody tr { transition: background 0.15s ease; }
.rate-table tbody tr:hover { background: var(--surface2); }
.rt-name { font-family: var(--font-head); font-weight: 700; font-size: 1.08rem; }
.rt-desc { color: var(--muted); font-size: 0.94rem; }
.rt-rate { color: var(--accent); font-weight: 700; font-size: 1.1rem; white-space: nowrap; }
.rt-cta { text-align: right; }

/* ---------- Films: editorial / magazine personality ---------- */
.tpl-films .nav { border-bottom: 1px solid var(--text); }
.tpl-films .nav-inner { padding-top: 20px; padding-bottom: 20px; }
.tpl-films .brand { font-size: 1.6rem; text-transform: uppercase; letter-spacing: 0.06em; }
.tpl-films .section-head {
  text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.98rem;
  border-top: 1px solid var(--border); padding-top: 16px;
}
.tpl-films .project-card { border: 1px solid var(--border); border-radius: 0; background: transparent; box-shadow: none; }
.tpl-films .project-card h3 { font-family: var(--font-head); font-size: 1.35rem; }
.tpl-films .hero { border-bottom: 1px solid var(--border); }

/* ---------- Restaurant: warm editorial serif ---------- */
.tpl-restaurant .hero h1 {
  font-family: var(--font-head); font-weight: 700;
  font-size: clamp(2.4rem, 6vw, 4rem);
}
.tpl-restaurant .menu-dots { border-bottom: 2px dotted var(--border); }

/* ---------- Modern: oversized display type ---------- */
.tpl-modern .hero h1 {
  font-size: clamp(2.8rem, 8vw, 5rem); letter-spacing: -0.03em; line-height: 1.02;
  max-width: 900px;
}

/* ---------- Archetype: split / Story (agency) ---------- */
.split-hero { padding: 96px 0 64px; background: var(--hero-bg, var(--bg)); border-bottom: 1px solid var(--border); }
.split-stats { padding: 0 0 44px; }
.split-stats .stat-value { font-family: var(--font-head); }
.split-title { margin: 0 0 20px; font-family: var(--font-head); font-weight: 700; font-size: clamp(2.6rem, 7vw, 4.8rem); letter-spacing: -0.03em; line-height: 1.02; max-width: 860px; }
.split-lead { margin: 0 0 26px; color: var(--muted); font-size: clamp(1.05rem, 2vw, 1.25rem); max-width: 720px; }
.split-section { padding: 0 0 48px; }
.split-block {
  display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 44px;
  padding: 48px 0; border-bottom: 1px solid var(--border);
}
.split-block:last-child { border-bottom: 0; }
.split-block.split-b { direction: rtl; }
.split-block.split-b > * { direction: ltr; }
.split-text { max-width: 540px; justify-self: end; }
.split-block.split-b .split-text { justify-self: start; }
.split-kicker { text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.72rem; font-weight: 700; color: var(--accent); }
.split-text h3 { font-family: var(--font-head); font-size: clamp(1.6rem, 3vw, 2.4rem); margin: 10px 0 12px; }
.split-text p { color: var(--muted); margin: 0; font-size: 1.05rem; line-height: 1.6; }
.split-visual {
  border-radius: 24px;
  background: linear-gradient(135deg, var(--surface2), var(--hero-bg, var(--bg)));
  border: 1px solid var(--border);
  min-height: 260px; display: flex; align-items: center; justify-content: center;
  font-size: 4rem; box-shadow: var(--shadow);
}

/* ---------- Archetype: editorial masthead (newsroom) ---------- */
.ed-head { border-top: 3px solid var(--text); border-bottom: 1px solid var(--border); }
.ed-inner { position: relative; max-width: 1080px; margin: 0 auto; padding: 26px 22px 0; text-align: center; }
.ed-wordmark { display: inline-block; font-family: var(--font-head); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; font-size: clamp(1.7rem, 4vw, 2.6rem); color: var(--text); text-decoration: none; }
.ed-tag { color: var(--muted); font-size: 0.92rem; margin: 6px 0 14px; }
.ed-nav { position: relative; display: flex; align-items: center; justify-content: center; gap: 4px; flex-wrap: wrap; border-top: 1px solid var(--border); padding: 10px 0; margin-top: 4px; }
.ed-nav a { color: var(--text); text-decoration: none; font-weight: 600; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.06em; padding: 8px 14px; border-radius: 4px; transition: background 0.15s ease, color 0.15s ease; }
.ed-nav a:hover { background: var(--surface2); color: var(--accent); }
.ed-hero { padding: 84px 0 56px; text-align: center; }
.ed-lead-head { font-family: var(--font-head); font-weight: 700; font-size: clamp(2.4rem, 6vw, 4rem); letter-spacing: -0.02em; margin: 0 0 18px; }
.ed-lead-sub { color: var(--muted); font-size: clamp(1rem, 2vw, 1.2rem); margin: 0 auto; max-width: 680px; }
.ed-story {
  border: 1px solid var(--border); background: var(--surface);
  padding: 22px 24px; margin-bottom: 18px;
  transition: transform 0.15s ease, border-color 0.15s ease;
}
.ed-story h3 { font-family: var(--font-head); font-size: 1.5rem; margin: 0 0 8px; }
.ed-story h2 { font-family: var(--font-head); font-size: clamp(1.8rem, 4vw, 2.6rem); margin: 8px 0 10px; }
.ed-story p { color: var(--muted); margin: 0; }
.ed-label { display: inline-block; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.7rem; font-weight: 700; color: var(--accent); border: 1px solid var(--accent); padding: 3px 8px; border-radius: 999px; }
.ed-featured { padding: 34px 36px; margin-bottom: 26px; border-left: 4px solid var(--accent); }
.ed-featured .link { display: inline-block; margin-top: 14px; }
.ed-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
.ed-grid .ed-story { margin-bottom: 0; }

/* ---------- Admin dashboard ---------- */
.dash-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 6px 0 28px; }
.dash-kpi { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px 22px; box-shadow: var(--shadow); }
.dash-kpi-value { display: block; font-family: var(--font-head); font-weight: 700; font-size: 1.9rem; color: var(--accent); }
.dash-kpi-label { color: var(--muted); font-size: 0.9rem; margin-top: 4px; display: block; }
.dash-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 6px 22px 22px; margin-bottom: 24px; box-shadow: var(--shadow); }
.dash-panel-head { border-bottom: 1px solid var(--border); padding: 16px 0 12px; margin-bottom: 8px; }
.dash-panel-head h3 { margin: 0; font-family: var(--font-head); font-size: 1.15rem; }
.dash-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
.dash-table th { text-align: left; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); padding: 8px 12px; border-bottom: 2px solid var(--border); }
.dash-table td { padding: 14px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.dash-table tbody tr { transition: background 0.15s ease; }
.dash-table tbody tr:hover { background: var(--surface2); }
.dash-name { font-weight: 600; }
.dash-status { display: inline-block; background: var(--surface2); color: var(--accent); font-weight: 600; font-size: 0.85rem; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
.dash-panel .card-grid { margin-top: 14px; }

/* ---------- Cart (shop) ---------- */
.cart-float {
  position: fixed; right: 20px; bottom: 20px; z-index: 70;
  width: 56px; height: 56px; border-radius: 50%; border: 0; cursor: pointer;
  background: var(--accent); color: var(--accent-text);
  font-size: 1.4rem; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  display: inline-flex; align-items: center; justify-content: center;
}
.cart-badge {
  position: absolute; top: -4px; right: -4px;
  background: var(--text); color: var(--bg);
  min-width: 20px; height: 20px; border-radius: 999px;
  font-size: 0.72rem; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; padding: 0 5px;
}
.cart-drawer {
  position: fixed; top: 0; right: 0; bottom: 0; width: 380px; max-width: 92vw; z-index: 75;
  background: var(--surface); border-left: 1px solid var(--border);
  display: flex; flex-direction: column;
  transform: translateX(105%); transition: transform 0.25s ease; box-shadow: var(--shadow);
}
.cart-drawer.open { transform: translateX(0); }
.cart-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid var(--border); }
.cart-head strong { font-family: var(--font-head); font-size: 1.1rem; }
.cart-close { background: none; border: 0; font-size: 1.1rem; cursor: pointer; color: var(--muted); }
.cart-body { flex: 1; overflow-y: auto; padding: 8px 22px; }
.cart-empty { color: var(--muted); padding: 24px 0; text-align: center; }
.cart-list { padding: 6px 0; }
.cart-line { display: flex; align-items: center; gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.cart-line:last-child { border-bottom: 0; }
.cart-line-name { flex: 1; min-width: 0; font-weight: 600; font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cart-ops { display: inline-flex; align-items: center; gap: 2px; border: 1px solid var(--border); border-radius: 8px; }
.cart-q { background: none; border: 0; width: 26px; height: 26px; cursor: pointer; color: var(--text); font-size: 1rem; }
.cart-qty { min-width: 18px; text-align: center; font-size: 0.9rem; font-weight: 600; }
.cart-line-total { font-weight: 700; font-size: 0.95rem; min-width: 58px; text-align: right; }
.cart-x { background: none; border: 0; color: var(--muted); cursor: pointer; font-size: 0.9rem; }
.cart-foot { border-top: 1px solid var(--border); padding: 16px 22px; }
.cart-total { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 1.05rem; }
.cart-total strong { font-family: var(--font-head); font-size: 1.3rem; }
.cart-order { width: 100%; justify-content: center; }
.cart-order.is-disabled { opacity: 0.45; pointer-events: none; }

/* ---------- Info modal for clickable cards ---------- */
.modal { position: fixed; inset: 0; z-index: 90; display: none; align-items: center; justify-content: center; padding: 22px; }
.modal.open { display: flex; }
.modal-backdrop { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.45); backdrop-filter: blur(2px); }
.modal-panel {
  position: relative; width: 100%; max-width: 460px; max-height: 80vh; overflow-y: auto;
  background: var(--surface); border: 1px solid var(--border); border-radius: 18px;
  padding: 26px 28px; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
}
.modal-x { position: absolute; top: 14px; right: 16px; background: none; border: 0; font-size: 1.1rem; cursor: pointer; color: var(--muted); }
.modal-title { margin: 0 0 6px; font-family: var(--font-head); font-size: 1.6rem; }
.modal-meta { margin: 0 0 12px; color: var(--accent); font-weight: 700; font-size: 1.02rem; }
.modal-desc { color: var(--muted); font-size: 1rem; line-height: 1.6; }
.modal-cta { margin-top: 20px; }
body.modal-open { overflow: hidden; }
[data-modal] { cursor: pointer; }

/* ---------- Pricing plans (fitness / SaaS / anyone) ---------- */
.plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: start; }
.plan-card {
  position: relative; background: var(--surface); border: 1px solid var(--border);
  border-radius: 20px; padding: 28px 24px 26px; display: flex; flex-direction: column; gap: 10px;
}
.plan-card.is-featured { border-color: var(--accent); box-shadow: 0 14px 40px rgba(0, 0, 0, 0.1); transform: translateY(-6px); }
.plan-flag {
  position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
  background: var(--accent); color: var(--accent-text);
  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 4px 12px; border-radius: 999px; white-space: nowrap;
}
.plan-name { margin: 0; font-family: var(--font-head); font-size: 1.3rem; }
.plan-price { margin: 0; font-family: var(--font-head); font-weight: 700; font-size: 2rem; color: var(--accent); line-height: 1.1; }
.plan-desc { margin: 0; color: var(--muted); font-size: 0.98rem; flex: 1; }
.plan-card .btn { align-self: stretch; justify-content: center; margin-top: 8px; }

/* ---------- FAQ (native <details>, no JS) ---------- */
.faq-list { display: flex; flex-direction: column; gap: 10px; max-width: 780px; }
.faq-item { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
.faq-item summary {
  cursor: pointer; padding: 16px 20px; font-weight: 600; list-style: none;
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
}
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item summary::after { content: "+"; color: var(--accent); font-size: 1.3rem; line-height: 1; flex: none; }
.faq-item[open] summary::after { content: "–"; }
.faq-answer { padding: 0 20px 18px; color: var(--muted); }
.faq-answer p { margin: 0 0 10px; }
.faq-answer p:last-child { margin: 0; }

/* ---------- Testimonials ---------- */
.quote-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.quote-card {
  margin: 0; background: var(--surface); border: 1px solid var(--border);
  border-radius: 18px; padding: 24px 24px 20px;
}
.quote-card blockquote { margin: 0 0 14px; font-size: 1.02rem; line-height: 1.6; }
.quote-card blockquote::before { content: "“"; color: var(--accent); font-family: var(--font-head); font-size: 1.6rem; line-height: 0; vertical-align: -0.2em; margin-right: 2px; }
.quote-card figcaption { color: var(--muted); font-size: 0.9rem; font-weight: 600; }
.quotes-band { background: var(--surface2); }
.quotes-band .quote-card { background: var(--surface); }
.tpl-fitness .quotes-band { background: transparent; }

/* ---------- News / journal ---------- */
.news-item {
  display: grid; grid-template-columns: 200px 1fr; gap: 22px; align-items: start;
  padding: 22px 0; border-bottom: 1px solid var(--border);
}
.news-item:first-child { padding-top: 8px; }
.news-img { width: 100%; height: 140px; object-fit: cover; border-radius: 14px; }
.news-body h3 { margin: 0 0 6px; font-family: var(--font-head); font-size: 1.35rem; }
.news-body p { margin: 0; color: var(--muted); }
.news-body .link { display: inline-block; margin-top: 8px; font-weight: 600; }

/* ---------- Fitness: loud, high-energy, image-free but bold ---------- */
.tpl-fitness .hero h1 { font-size: clamp(2.6rem, 7vw, 4.6rem); line-height: 1.02; letter-spacing: -0.03em; max-width: 900px; }
.tpl-fitness .hero { border-bottom: 4px solid var(--accent); }
.tpl-fitness .stat-value { font-family: var(--font-head); font-weight: 700; }
.tpl-fitness .service-card { border-top: 4px solid var(--accent); }
.tpl-fitness .plan-card.is-featured { transform: translateY(-6px) scale(1.02); }

/* ---------- SaaS: centred, product-y ---------- */
.tpl-saas .hero { text-align: center; }
.tpl-saas .hero h1 { font-size: clamp(2.6rem, 7vw, 4.4rem); letter-spacing: -0.035em; line-height: 1.03; max-width: 880px; margin-left: auto; margin-right: auto; }
.tpl-saas .hero-cta { justify-content: center; }
.tpl-saas .service-card { border-radius: 18px; }

/* ---------- Law firm: restrained, serif, trustworthy ---------- */
.tpl-law .section-head { font-family: var(--font-head); letter-spacing: -0.01em; }
.tpl-law .hero h1 { font-size: clamp(2.2rem, 5vw, 3.4rem); max-width: 760px; }
.tpl-law .service-card { background: transparent; border-style: solid; }
.tpl-law .stat { border-left: 3px solid var(--accent); padding-left: 14px; text-align: left; }

/* ---------- Responsive ---------- */
@media (max-width: 760px) {
  .hero { padding: 64px 0 56px; }
  .section { padding: 48px 0; }
  .card-grid { grid-template-columns: 1fr; }
  .about-grid { grid-template-columns: 1fr; gap: 24px; }
  .contact-grid { grid-template-columns: 1fr; }
  .nav-links {
    position: absolute; top: 100%; left: 0; right: 0;
    flex-direction: column; align-items: flex-start; gap: 6px;
    background: var(--header-bg, var(--surface)); border-bottom: 1px solid var(--border);
    padding: 10px 22px 16px; display: none;
  }
  .nav-links.open { display: flex; }
  .nav-links a { padding: 8px 2px; }
  .nav-toggle { display: inline-flex; align-items: center; justify-content: center; }
  .head-row { flex-direction: column; gap: 6px; }
  .tpl-portfolio .hero { padding: 84px 0 68px; }
  .tpl-portfolio .hero h1 { font-size: clamp(2.2rem, 10vw, 3rem); }
  .tpl-portfolio .card-grid { grid-template-columns: 1fr; }
  .tpl-portfolio .project-card:first-child { grid-column: auto; }
  .tpl-business .hero { padding: 68px 0 60px; }
  .tpl-modern .hero { padding: 96px 0 88px; }
  .tpl-modern .hero h1 { font-size: clamp(2.3rem, 10vw, 3.3rem); }
  .stats-row { grid-template-columns: repeat(2, 1fr); gap: 18px; padding: 24px 0; }
  .plans-grid { grid-template-columns: 1fr; gap: 16px; }
  .plan-card.is-featured { transform: none; }
  .quote-grid { grid-template-columns: 1fr; }
  .news-item { grid-template-columns: 1fr; gap: 12px; }
  .news-img { height: 180px; }
  .tpl-law .stat { border-left: 0; padding-left: 0; }
  .form-grid { grid-template-columns: 1fr; }
  .job-card { flex-direction: column; align-items: flex-start; }
  .tpl-films .card-grid { grid-template-columns: 1fr; }
  .tpl-films .project-card:first-child { grid-column: auto; }
  .dim-hero { min-height: 0; padding: 108px 20px 60px; gap: 20px; }
  .dim-logo { width: 68px; height: 68px; font-size: 1.5rem; }
  .dim-pills a { padding: 9px 16px; font-size: 0.9rem; }
  .side-nav {
    position: sticky; top: 0; width: 100%; inset: auto;
    flex-direction: row; align-items: center; gap: 12px;
    padding: 12px 16px; border-right: 0; border-bottom: 1px solid var(--border);
  }
  .side-top { flex-direction: row; align-items: center; gap: 12px; flex: 1; min-width: 0; }
  .side-avatar { width: 44px; height: 44px; font-size: 1.1rem; flex: none; }
  .side-brand { font-size: 1.1rem; flex: none; }
  .side-tag { display: none; }
  .side-links {
    position: absolute; top: 100%; left: 0; right: 0;
    flex-direction: column; align-items: stretch; gap: 4px;
    background: var(--surface); border-bottom: 1px solid var(--border);
    padding: 10px 16px 14px; box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
    display: none; margin-top: 0;
  }
  .side-nav.open .side-links { display: flex; }
  .side-links a { white-space: nowrap; padding: 9px 10px; font-size: 0.95rem; border-radius: 8px; }
  .side-bottom { flex-direction: row; align-items: center; gap: 10px; flex: none; }
  .side-bottom .side-socials { display: none; }
  .side-toggle { display: inline-flex; }
  .side-wrap { margin-left: 0; }
  .center-nav { padding: 12px 16px; }
  .center-links.nav-links {
    position: absolute; top: 100%; left: 0; right: 0;
    flex-direction: column; align-items: flex-start; gap: 6px;
    background: var(--surface); border-bottom: 1px solid var(--border);
    padding: 10px 22px 16px; display: none;
  }
  .center-links.nav-links.open { display: flex; }
  .center-links a { padding: 8px 12px; border-radius: 999px; }
  .ed-inner { padding-top: 20px; }
  .ed-nav.nav-links { width: 100%; justify-content: flex-start; }
  .split-hero { padding: 64px 0 44px; }
  .split-block { grid-template-columns: 1fr; gap: 22px; direction: ltr; }
  .split-block > * { direction: ltr; }
  .split-text { justify-self: start; }
  .split-visual { min-height: 180px; font-size: 3rem; }
  .ed-grid { grid-template-columns: 1fr; }
  .ed-featured { padding: 24px 22px; }
  .dash-kpis { grid-template-columns: repeat(2, 1fr); }
  .dash-table { min-width: 0; }
  .cart-drawer { width: 100%; }
  .rate-table { min-width: 0; }
  .rt-cta { display: none; }
  .tpl-films .nav-inner { padding-top: 14px; padding-bottom: 14px; }
}
`;
}

// ---------------------------------------------------------------------------
// Page structure builders
// ---------------------------------------------------------------------------

function themeButton(site: SiteConfig): string {
  return site.features.darkMode
    ? `<button class="theme-btn" onclick="__toggleTheme()" aria-label="Toggle dark mode"><span class="icon-dark">🌙</span><span class="icon-light">☀️</span></button>`
    : "";
}

/** Page links shared by every header variant (top bar, centered, sidebar). */
function pageLinks(site: SiteConfig, mode: RenderMode): string {
  return site.pages
    .map((ref) => `<a href="${esc(pageHref(mode, ref))}" data-nav="${ref}">${esc(labelFor(site, ref))}</a>`)
    .join("");
}

function topNavHtml(site: SiteConfig, mode: RenderMode): string {
  const siteName = esc(site.siteName.trim() || "My Site");
  const vars = inlineVars([
    ["--header-bg", site.colors.headerBg],
    ["--header-text", site.colors.headerText],
  ]);
  return `
<nav class="nav"${vars}>
  <div class="nav-inner">
    <a class="brand" href="${esc(pageHref(mode, "home"))}" data-nav="home">${siteName}</a>
    <div class="nav-right">
      <div class="nav-links" id="__navLinks">${pageLinks(site, mode)}</div>
      ${themeButton(site)}
      <button class="nav-toggle" onclick="__toggleNav()" aria-label="Open menu">☰</button>
    </div>
  </div>
</nav>`;
}

/** Prologue-style chrome: fixed left sidebar with avatar, links and socials. */
function sideNavHtml(site: SiteConfig, mode: RenderMode): string {
  const siteName = esc(site.siteName.trim() || "My Site");
  const tagline = site.tagline.trim();
  const initials = esc(avatarInitials(site.siteName.trim() || "Site"));
  const socials = socialsHtml(site, "side-socials");
  return `
<aside class="side-nav">
  <div class="side-top">
    <div class="side-avatar" aria-hidden="true">${initials}</div>
    <div class="side-brand">${siteName}</div>
    ${tagline ? `<div class="side-tag">${esc(tagline)}</div>` : ""}
    <nav class="side-links" aria-label="Pages">${pageLinks(site, mode)}</nav>
  </div>
  <div class="side-bottom">
    ${socials}
    ${themeButton(site)}
    <button class="side-toggle" id="__sideToggle" onclick="__toggleSideNav()" aria-label="Open menu" aria-expanded="false">☰</button>
  </div>
</aside>`;
}

/** Dimension-style chrome: slim centred bar (medallion + brand + pills) shown on every page. */
function centeredNavHtml(site: SiteConfig, mode: RenderMode): string {
  const siteName = esc(site.siteName.trim() || "My Site");
  const initials = esc(avatarInitials(site.siteName.trim() || "Site"));
  return `
<nav class="center-nav">
  <a class="center-brand" href="${esc(pageHref(mode, "home"))}" data-nav="home">
    <span class="center-logo" aria-hidden="true">${initials}</span>
    <span class="center-name">${siteName}</span>
  </a>
  <div class="center-right">
    <div class="center-links nav-links" id="__navLinks">${pageLinks(site, mode)}</div>
    ${themeButton(site)}
    <button class="nav-toggle" onclick="__toggleNav()" aria-label="Open menu">☰</button>
  </div>
</nav>`;
}

/** Massively-style chrome: centred serif wordmark + bordered nav row. */
function editorialNavHtml(site: SiteConfig, mode: RenderMode): string {
  const siteName = esc(site.siteName.trim() || "My Site");
  const tagline = site.tagline.trim();
  return `
<header class="ed-head">
  <div class="ed-inner">
    <a class="ed-wordmark" href="${esc(pageHref(mode, "home"))}" data-nav="home">${siteName}</a>
    ${tagline ? `<p class="ed-tag">${esc(tagline)}</p>` : ""}
    <nav class="ed-nav nav-links" id="__navLinks" aria-label="Pages">
      ${pageLinks(site, mode)}
      ${themeButton(site)}
      <button class="nav-toggle" onclick="__toggleNav()" aria-label="Open menu">☰</button>
    </nav>
  </div>
</header>`;
}

/** Pick the page chrome (navigation) for the template's layout archetype. */
function headerHtml(site: SiteConfig, mode: RenderMode): string {
  const layout = templateMeta(site.template).layout;
  if (layout === "sidebar") return sideNavHtml(site, mode);
  if (layout === "centered") return centeredNavHtml(site, mode);
  if (layout === "editorial") return editorialNavHtml(site, mode);
  return topNavHtml(site, mode);
}

function socialsHtml(site: SiteConfig, className: string): string {
  const links = SOCIAL_META.filter((m) => site.social[m.key].trim().length > 0);
  if (links.length === 0) return "";
  const buttons = links
    .map((m) => `<a class="social-btn" href="${esc(site.social[m.key].trim())}" target="_blank" rel="noopener" aria-label="${esc(m.label)}">${esc(m.code)}</a>`)
    .join("");
  return `<div class="socials ${className}">${buttons}</div>`;
}

function footerHtml(site: SiteConfig, mode: RenderMode): string {
  const siteName = esc(site.siteName.trim() || "My Site");
  const tagline = site.tagline.trim();
  const links = site.pages
    .map((ref) => `<a href="${esc(pageHref(mode, ref))}" data-nav="${ref}">${esc(labelFor(site, ref))}</a>`)
    .join("");
  const parts: string[] = [];
  if (site.contact.phone.trim()) parts.push(esc(site.contact.phone.trim()));
  if (site.contact.email.trim()) parts.push(esc(site.contact.email.trim()));
  const meta = [`© ${new Date().getFullYear()} ${siteName}`, ...parts].join("  ·  ");
  const vars = inlineVars([
    ["--footer-bg", site.colors.footerBg],
    ["--footer-text", site.colors.footerText],
  ]);
  return `
<footer class="footer"${vars}>
  <div class="container">
    <div class="brand foot-brand">${siteName}</div>
    ${tagline ? `<p class="foot-tagline">${esc(tagline)}</p>` : ""}
    ${socialsHtml(site, "foot-socials")}
    ${links ? `<nav class="foot-nav">${links}</nav>` : ""}
    <p class="foot-meta">${meta}</p>
  </div>
</footer>`;
}

/** The hero's call-to-action buttons (primary + contact). */
function heroCtas(site: SiteConfig, mode: RenderMode): string[] {
  const meta = templateMeta(site.template);
  const isProjectsList =
    site.template === "portfolio" || site.template === "films" || site.template === "agency" || site.template === "newsroom";
  const isServicesList =
    site.template === "business" ||
    site.template === "modern" ||
    site.template === "clinic" ||
    site.template === "profile" ||
    site.template === "dashboard" ||
    site.template === "fitness" ||
    site.template === "saas" ||
    site.template === "law";
  const isJobsList = site.template === "hr";
  const listPage: PageId = isProjectsList ? "gallery" : isJobsList ? "jobs" : "menu";
  const hasListPage = site.pages.includes(listPage);
  const listCount = isProjectsList
    ? site.projects.length
    : isServicesList
      ? site.services.length
      : isJobsList
        ? site.jobs.length
        : site.menu.length;

  const ctas: string[] = [];
  const primaryLabel = site.buttons.primaryLabel.trim() || meta.heroPrimary;
  const primaryColor = site.buttons.primaryColor.trim();
  if (listCount > 0) {
    // The hero button links to the template's primary target page (e.g. booking
    // for a clinic) when set and enabled, otherwise to the main list page.
    const primaryRef: PageId | "" =
      meta.primaryTarget && site.pages.includes(meta.primaryTarget)
        ? meta.primaryTarget
        : hasListPage
          ? listPage
          : "";
    const href = primaryRef ? pageHref(mode, primaryRef) : `#${meta.anchor}`;
    const navAttr = primaryRef ? ` data-nav="${primaryRef}"` : "";
    const colorStyle = primaryColor ? ` style="background:${esc(primaryColor)};color:#fff"` : "";
    ctas.push(`<a class="btn btn-primary" href="${esc(href)}"${navAttr}${colorStyle}>${esc(primaryLabel)}</a>`);
  }
  if (site.pages.includes("contact")) {
    ctas.push(`<a class="btn btn-ghost" href="${esc(pageHref(mode, "contact"))}" data-nav="contact">Get in touch</a>`);
  }
  return ctas;
}

/** Dimension-style hero: full-screen centred content with pill navigation.
 * Replaces both the top bar and the classic hero for "centered" templates. */
function centeredHeroHtml(site: SiteConfig, mode: RenderMode): string {
  const siteName = esc(site.siteName.trim() || "My Site");
  const heading = esc(site.hero.heading.trim() || siteName);
  const tagline = site.tagline.trim();
  const initials = esc(avatarInitials(site.siteName.trim() || "Site"));
  const ctas = heroCtas(site, mode);
  return `
<section class="dim-hero">
  <div class="dim-logo" aria-hidden="true">${initials}</div>
  <h1 class="dim-title">${heading}</h1>
  ${tagline ? `<p class="dim-tag">${esc(tagline)}</p>` : ""}
  ${ctas.length > 0 ? `<div class="hero-cta">${ctas.join("")}</div>` : ""}
</section>`;
}

function heroHtml(site: SiteConfig, mode: RenderMode): string {
  // Centered-layout templates carry their own chrome — skip the classic hero.
  if (templateMeta(site.template).layout === "centered") return centeredHeroHtml(site, mode);
  const heading = esc(site.hero.heading.trim() || site.siteName.trim() || "My Site");
  const subtext = site.hero.subtext.trim();
  const ctas = heroCtas(site, mode);
  const heroImg = site.images.heroBg.trim();
  const align = isTextAlign(site.align?.hero) ? site.align.hero : "center";
  const blobs =
    site.template === "modern"
      ? `<span class="blob b1" aria-hidden="true"></span><span class="blob b2" aria-hidden="true"></span><span class="blob b3" aria-hidden="true"></span>`
      : "";
  const bgStyle = heroImg ? ` background-image:${bgImageStyle(heroImg)};` : "";
  return `
<section class="hero align-${align}"${bgStyle ? ` style="${bgStyle.trim()}"` : ""}>
  ${blobs}
  <div class="container">
    <h1>${heading}</h1>
    ${subtext ? `<p class="hero-sub">${esc(subtext)}</p>` : ""}
    ${ctas.length > 0 ? `<div class="hero-cta">${ctas.join("")}</div>` : ""}
  </div>
</section>`;
}

/** Build a CSS url() value for an image (data URL or web URL).
 * Uses single quotes for the CSS string so it stays a valid double-quoted
 * HTML attribute value (a literal `url("…")` would truncate the attribute). */
function bgImageStyle(url: string): string {
  return `url('${esc(url.trim())}')`;
}

function featureChips(site: SiteConfig): string {
  const on = (Object.keys(site.features) as Array<keyof SiteConfig["features"]>).filter(
    (k) => site.features[k]
  );
  if (on.length === 0) return "";
  const chips = on.map((k) => `<li class="chip">${esc(FEATURE_STRIP[k])}</li>`).join("");
  return `
<section class="section features">
  <div class="container"><ul class="chips" style="list-style:none;padding:0;margin:0">${chips}</ul></div>
</section>`;
}

// -- item grids -------------------------------------------------------------

/** Build the data-* attributes that make a card open the info modal. */
function modalAttrs(title: string, meta: string, desc: string, ctaHref = "", ctaLabel = ""): string {
  const parts = [
    `data-title="${esc(title)}"`,
    `data-meta="${esc(meta)}"`,
    `data-desc="${esc(desc)}"`,
  ];
  if (ctaHref) {
    parts.push(`data-cta="${esc(ctaHref)}"`);
    parts.push(`data-cta-label="${esc(ctaLabel)}"`);
  }
  return `data-modal ${parts.join(" ")}`;
}

/**
 * Resolve a card's optional "link" field. Accepts a page of this site (built-in
 * id or custom page id) or any URL the user typed. Empty = "" so the template's
 * own sensible default CTA is used instead.
 */
function cardLinkHref(link: string | undefined, site: SiteConfig, mode: RenderMode): string {
  const t = (link || "").trim();
  if (!t) return "";
  if (isBuiltInPage(t) || site.pages.includes(t)) return pageHref(mode, t);
  return t;
}

function menuCard(m: SiteConfig["menu"][number], site: SiteConfig, mode: RenderMode): string {
  const img = (m.image || "").trim() ? `<img class="menu-img" src="${esc((m.image || "").trim())}" alt="" loading="lazy">` : "";
  const shop = site.template === "shop";
  let ctaHref = "";
  let ctaLabel = "";
  const custom = cardLinkHref(m.link, site, mode);
  if (custom) {
    ctaHref = custom;
    ctaLabel = shop ? "Ask about this" : "Learn more";
  } else if (shop) {
    ctaHref = site.pages.includes("contact") ? pageHref(mode, "contact") : "";
    ctaLabel = "Ask about this";
  } else if (site.pages.includes("booking")) {
    ctaHref = pageHref(mode, "booking");
    ctaLabel = "Book this";
  } else if (site.pages.includes("contact")) {
    ctaHref = pageHref(mode, "contact");
    ctaLabel = "Ask about this";
  }
  const open = modalAttrs(m.name, priceHtml(m.price), m.description, ctaHref, ctaLabel);
  const cart = shop
    ? `<div class="menu-actions"><button class="cart-add" data-add="${esc(m.id)}" data-name="${esc(m.name)}" data-price="${esc((m.price || "").trim() || "0")}">+ Add to cart</button></div>`
    : "";
  return `
  <article class="menu-card" ${open} tabindex="0" role="button" aria-haspopup="dialog">
    ${img}
    <div class="menu-row">
      <h3 class="menu-name">${esc(m.name)}</h3>
      <span class="menu-dots"></span>
      <span class="menu-price">${priceHtml(m.price)}</span>
    </div>
    ${m.description.trim() ? `<p class="menu-desc">${esc(m.description)}</p>` : ""}
    ${cart}
  </article>`;
}

function projectCard(pr: SiteConfig["projects"][number]): string {
  const img = (pr.image || "").trim() ? `<img class="project-img" src="${esc((pr.image || "").trim())}" alt="" loading="lazy">` : "";
  const open = modalAttrs(pr.title, "", pr.description, (pr.link || "").trim(), "Visit project");
  const link = (pr.link || "").trim()
    ? `<a class="project-link" href="${esc((pr.link || "").trim())}" target="_blank" rel="noopener">Visit project →</a>`
    : "";
  return `
  <article class="project-card" ${open} tabindex="0" role="button" aria-haspopup="dialog">
    ${img}
    <div class="project-body">
      <h3>${esc(pr.title)}</h3>
      ${pr.description.trim() ? `<p>${esc(pr.description)}</p>` : ""}
      ${link}
    </div>
  </article>`;
}

function serviceCard(sv: SiteConfig["services"][number], site: SiteConfig, mode: RenderMode): string {
  const custom = cardLinkHref(sv.link, site, mode);
  const ctaHref = custom || (site.pages.includes("contact") ? pageHref(mode, "contact") : "");
  const ctaLabel = custom ? "Learn more" : "Get a quote";
  const open = modalAttrs(sv.title, sv.icon || "", sv.description, ctaHref, ctaLabel);
  return `
  <article class="service-card" ${open} tabindex="0" role="button" aria-haspopup="dialog">
    <div class="service-icon">${esc(sv.icon || "•")}</div>
    <div class="service-body">
      <h3>${esc(sv.title)}</h3>
      ${sv.description.trim() ? `<p>${esc(sv.description)}</p>` : ""}
    </div>
  </article>`;
}

function menuGrid(site: SiteConfig, mode: RenderMode): string {
  if (site.menu.length === 0)
    return `<p class="section-sub" style="font-style:italic">Menu coming soon.</p>`;
  return `<div class="card-grid">${site.menu.map((m) => menuCard(m, site, mode)).join("")}</div>`;
}

function servicesGrid(site: SiteConfig, mode: RenderMode): string {
  if (site.services.length === 0)
    return `<p class="section-sub" style="font-style:italic">Services coming soon.</p>`;
  return `<div class="card-grid">${site.services.map((sv) => serviceCard(sv, site, mode)).join("")}</div>`;
}

function projectsGrid(site: SiteConfig): string {
  if (site.projects.length === 0)
    return `<p class="section-sub" style="font-style:italic">Work coming soon.</p>`;
  return `<div class="card-grid">${site.projects.map((pr) => projectCard(pr)).join("")}</div>`;
}

/** Pricing / membership plans: the site's menu items as tier cards. */
function plansGrid(site: SiteConfig, mode: RenderMode): string {
  if (site.menu.length === 0)
    return `<p class="section-sub" style="font-style:italic">Plans coming soon.</p>`;
  const ctaLabel =
    site.template === "fitness" ? "Join now" : site.template === "saas" ? "Start free trial" : "Choose plan";
  const fallback = site.pages.includes("booking")
    ? pageHref(mode, "booking")
    : site.pages.includes("contact")
      ? pageHref(mode, "contact")
      : "";
  const middle = Math.floor(site.menu.length / 2);
  const cards = site.menu
    .map((m, i) => {
      const custom = cardLinkHref(m.link, site, mode);
      const ctaHref = custom || fallback;
      const open = modalAttrs(m.name, priceHtml(m.price), m.description, ctaHref, ctaLabel);
      const featured = site.menu.length >= 3 && i === middle;
      const btn = ctaHref
        ? `<a class="btn ${featured ? "btn-primary" : "btn-outline"}" href="${esc(ctaHref)}"${custom ? ' target="_blank" rel="noopener"' : ""}>${esc(ctaLabel)}</a>`
        : "";
      return `
  <article class="plan-card${featured ? " is-featured" : ""}" ${open} tabindex="0" role="button" aria-haspopup="dialog">
    ${featured ? `<span class="plan-flag">Most popular</span>` : ""}
    <h3 class="plan-name">${esc(m.name)}</h3>
    <p class="plan-price">${priceHtml(m.price) || "Free"}</p>
    ${m.description.trim() ? `<p class="plan-desc">${esc(m.description)}</p>` : ""}
    ${btn}
  </article>`;
    })
    .join("");
  return `<div class="plans-grid">${cards}</div>`;
}

/** FAQ list using native <details> — collapsible with zero JavaScript. */
function faqSection(site: SiteConfig, limit?: number): string {
  const items = limit ? site.faqs.slice(0, limit) : site.faqs;
  if (items.length === 0)
    return `<p class="section-sub" style="font-style:italic">Questions coming soon.</p>`;
  return `<div class="faq-list">${items
    .map(
      (f) => `
    <details class="faq-item">
      <summary>${esc(f.question)}</summary>
      <div class="faq-answer">${paragraphs(f.answer)}</div>
    </details>`
    )
    .join("")}</div>`;
}

/** Client quotes. Rendered as-is (no dialog) so the full quote is always visible. */
function testimonialsBand(site: SiteConfig, limit?: number): string {
  const items = limit ? site.testimonials.slice(0, limit) : site.testimonials;
  if (items.length === 0) return "";
  return `<div class="quote-grid">${items
    .map(
      (t) => `
    <figure class="quote-card">
      <blockquote>${esc(t.quote)}</blockquote>
      <figcaption>${esc(t.author)}${t.role.trim() ? ` — ${esc(t.role)}` : ""}</figcaption>
    </figure>`
    )
    .join("")}</div>`;
}

/** Bank-style accounts page: an institutional fee/rate table instead of cards. */
function accountsTable(site: SiteConfig, mode: RenderMode): string {
  const openHref = pageHref(mode, "booking");
  const rows = site.menu
    .map(
      (m) => `
      <tr>
        <td class="rt-name">${esc(m.name)}</td>
        <td class="rt-desc">${esc(m.description)}</td>
        <td class="rt-rate">${priceHtml(m.price)}</td>
        <td class="rt-cta"><a class="btn btn-sm" href="${esc(openHref)}" data-nav="booking">Open</a></td>
      </tr>`
    )
    .join("");
  return `
<section class="section">
  <div class="container">
    <h2 class="section-head">${esc(pageLabel(site.template, "menu"))}</h2>
    <p class="section-sub">No hidden fees, no asterisks — what you see is what you get.</p>
    <div class="table-wrap">
      <table class="rate-table">
        <thead>
          <tr><th>Account</th><th>What you get</th><th>Rate</th><th></th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>
</section>`;
}

function featuredSection(site: SiteConfig, mode: RenderMode): string {
  const meta = templateMeta(site.template);
  const isProjectsList =
    site.template === "portfolio" || site.template === "films" || site.template === "agency" || site.template === "newsroom";
  const isServicesList =
    site.template === "business" ||
    site.template === "modern" ||
    site.template === "clinic" ||
    site.template === "profile" ||
    site.template === "dashboard" ||
    site.template === "fitness" ||
    site.template === "saas" ||
    site.template === "law";
  const isJobsList = site.template === "hr";
  const listKey: "projects" | "services" | "menu" | "jobs" = isProjectsList
    ? "projects"
    : isServicesList
      ? "services"
      : isJobsList
        ? "jobs"
        : "menu";
  const items = site[listKey].slice(0, 3);
  const grid =
    listKey === "projects"
      ? projectsGrid({ ...site, projects: items as ProjectItem[] })
      : listKey === "services"
        ? servicesGrid({ ...site, services: items as ServiceItem[] }, mode)
        : listKey === "jobs"
          ? jobsGrid({ ...site, jobs: items as JobItem[] })
          : menuGrid({ ...site, menu: items as MenuItem[] }, mode);
  if (items.length === 0) return "";
  const listPage: PageId = isProjectsList ? "gallery" : isJobsList ? "jobs" : "menu";
  const allLink = site.pages.includes(listPage)
    ? `<a class="link" href="${esc(pageHref(mode, listPage))}" data-nav="${listPage}">${esc(meta.featuredCardLabel)} →</a>`
    : "";
  return `
<section class="section" id="${meta.anchor}">
  <div class="container">
    <div class="head-row">
      <h2>${esc(meta.featuredHeading)}</h2>
      ${allLink}
    </div>
    ${grid}
  </div>
</section>`;
}

function aboutTeaser(site: SiteConfig, mode: RenderMode): string {
  const p = site.about.text.trim();
  if (!p) return "";
  const excerpt = p.split(/\n{2,}/)[0];
  return `
<section class="section">
  <div class="container">
    <div class="head-row">
      <h2>About us</h2>
      ${site.pages.includes("about") ? `<a class="link" href="${esc(pageHref(mode, "about"))}" data-nav="about">Read more →</a>` : ""}
    </div>
    <div class="about-text"><p>${esc(excerpt)}</p></div>
  </div>
</section>`;
}

function homeBody(site: SiteConfig, mode: RenderMode): string {
  if (site.template === "agency") return agencyHome(site, mode);
  if (site.template === "newsroom") return newsroomHome(site, mode);
  if (site.template === "dashboard") return dashboardHome(site, mode);
  if (site.template === "fitness") return fitnessHome(site, mode);
  if (site.template === "saas") return saasHome(site, mode);
  if (site.template === "law") return lawHome(site, mode);
  const meta = templateMeta(site.template);
  const promo = meta.promo ? `<div class="promo-strip" role="banner">${esc(meta.promo)}</div>` : "";
  const stats =
    meta.stats && meta.stats.length > 0
      ? `<section class="stats-strip"><div class="container"><div class="stats-row">${meta.stats
          .map((s) => `<div class="stat"><span class="stat-value">${esc(s.value)}</span><span class="stat-label">${esc(s.label)}</span></div>`)
          .join("")}</div></div></section>`
      : "";
  return `${promo}${heroHtml(site, mode)}${stats}${featureChips(site)}${featuredSection(site, mode)}${aboutTeaser(site, mode)}`;
}

/** Fitness homepage — big statement, benefits, plans, client quotes. */
function fitnessHome(site: SiteConfig, mode: RenderMode): string {
  const meta = templateMeta(site.template);
  const stats =
    meta.stats && meta.stats.length
      ? `<section class="stats-strip"><div class="container"><div class="stats-row">${meta.stats
          .map((s) => `<div class="stat"><span class="stat-value">${esc(s.value)}</span><span class="stat-label">${esc(s.label)}</span></div>`)
          .join("")}</div></div></section>`
      : "";
  const quotes = testimonialsBand(site, 3);
  return `
${meta.promo ? `<div class="promo-strip" role="banner">${esc(meta.promo)}</div>` : ""}
${heroHtml(site, mode)}
${stats}
${featuredSection(site, mode)}
<section class="section" id="plans">
  <div class="container">
    <h2 class="section-head">Choose your plan</h2>
    <p class="section-sub">Every plan starts with a free movement screen — no card needed.</p>
    ${plansGrid(site, mode)}
  </div>
</section>
${quotes ? `<section class="section quotes-band"><div class="container">${quotes}</div></section>` : ""}
${aboutTeaser(site, mode)}`;
}

/** SaaS homepage — hero, proof stats, features, pricing, FAQ, quotes. */
function saasHome(site: SiteConfig, mode: RenderMode): string {
  const meta = templateMeta(site.template);
  const stats =
    meta.stats && meta.stats.length
      ? `<section class="stats-strip"><div class="container"><div class="stats-row">${meta.stats
          .map((s) => `<div class="stat"><span class="stat-value">${esc(s.value)}</span><span class="stat-label">${esc(s.label)}</span></div>`)
          .join("")}</div></div></section>`
      : "";
  return `
${heroHtml(site, mode)}
${stats}
${featuredSection(site, mode)}
<section class="section" id="pricing">
  <div class="container">
    <h2 class="section-head">Simple pricing</h2>
    <p class="section-sub">Start free. Upgrade when your team outgrows it.</p>
    ${plansGrid(site, mode)}
  </div>
</section>
${site.faqs.length ? `<section class="section" id="faq"><div class="container"><h2 class="section-head">Questions, answered</h2>${faqSection(site, 4)}</div></section>` : ""}
${testimonialsBand(site, 3)}`;
}

/** Law-firm homepage — restrained hero, practice areas, firm story, quotes, FAQ. */
function lawHome(site: SiteConfig, mode: RenderMode): string {
  const meta = templateMeta(site.template);
  const stats =
    meta.stats && meta.stats.length
      ? `<section class="stats-strip"><div class="container"><div class="stats-row">${meta.stats
          .map((s) => `<div class="stat"><span class="stat-value">${esc(s.value)}</span><span class="stat-label">${esc(s.label)}</span></div>`)
          .join("")}</div></div></section>`
      : "";
  return `
${heroHtml(site, mode)}
${stats}
${featuredSection(site, mode)}
${aboutTeaser(site, mode)}
${testimonialsBand(site, 3)}
${site.faqs.length ? `<section class="section" id="faq"><div class="container"><h2 class="section-head">Common questions</h2>${faqSection(site, 4)}</div></section>` : ""}`;
}

/** Agency homepage — Story-style: full-screen statement, then alternating text/visual blocks. */
function agencyHome(site: SiteConfig, mode: RenderMode): string {
  const meta = templateMeta(site.template);
  const heading = esc(site.hero.heading.trim() || site.siteName.trim() || "We make things people remember");
  const subtext = site.hero.subtext.trim();
  const ctas = heroCtas(site, mode);
  const blocks = site.services
    .slice(0, 4)
    .map((sv, i) => {
      const even = i % 2 === 0;
      return `
  <div class="split-block split-${even ? "a" : "b"}">
    <div class="split-text">
      <span class="split-kicker">${esc(String(i + 1).padStart(2, "0"))} — ${esc(meta.featuredHeading)}</span>
      <h3>${esc(sv.title)}</h3>
      <p>${esc(sv.description)}</p>
    </div>
    <div class="split-visual" aria-hidden="true"><span>${esc(sv.icon || "◆")}</span></div>
  </div>`;
    })
    .join("");
  return `
<section class="split-hero">
  <div class="container">
    ${meta.stats && meta.stats.length ? `<div class="stats-row split-stats">${meta.stats.map((s) => `<div class="stat"><span class="stat-value">${esc(s.value)}</span><span class="stat-label">${esc(s.label)}</span></div>`).join("")}</div>` : ""}
    <h1 class="split-title">${heading}</h1>
    ${subtext ? `<p class="split-lead">${esc(subtext)}</p>` : ""}
    ${ctas.length ? `<div class="hero-cta">${ctas.join("")}</div>` : ""}
  </div>
</section>
<section class="split-section">
  <div class="container">
    ${blocks || `<p class="section-sub" style="font-style:italic">What we do — coming soon.</p>`}
  </div>
</section>
${featuredSection(site, mode)}
${aboutTeaser(site, mode)}`;
}

/** Newsroom homepage — Massively-style lead story + dense story grid. */
function newsroomHome(site: SiteConfig, mode: RenderMode): string {
  const heading = esc(site.hero.heading.trim() || site.siteName.trim() || "The latest");
  const subtext = site.hero.subtext.trim();
  const featured = site.projects[0];
  const rest = site.projects.slice(1, 7);
  const head = featured
    ? `
  <article class="ed-story ed-featured" ${modalAttrs(featured.title, "Lead story", featured.description, (featured.link || "").trim(), "Read story")} tabindex="0" role="button" aria-haspopup="dialog">
    <span class="ed-label">Lead story</span>
    <h2>${esc(featured.title)}</h2>
    ${featured.description.trim() ? `<p>${esc(featured.description)}</p>` : ""}
    ${(featured.link || "").trim() ? `<a class="link" href="${esc((featured.link || "").trim())}" target="_blank" rel="noopener">Read more →</a>` : ""}
  </article>`
    : "";
  const grid = rest
    .map(
      (pr) => `
  <article class="ed-story" ${modalAttrs(pr.title, "", pr.description, (pr.link || "").trim(), "Read story")} tabindex="0" role="button" aria-haspopup="dialog">
    <h3>${esc(pr.title)}</h3>
    ${pr.description.trim() ? `<p>${esc(pr.description)}</p>` : ""}
  </article>`
    )
    .join("");
  return `
<section class="ed-hero">
  <div class="container">
    <h1 class="ed-lead-head">${heading}</h1>
    ${subtext ? `<p class="ed-lead-sub">${esc(subtext)}</p>` : ""}
  </div>
</section>
<section class="section">
  <div class="container">
    ${head || `<p class="section-sub" style="font-style:italic">Stories coming soon.</p>`}
    ${grid ? `<div class="ed-grid">${grid}</div>` : ""}
  </div>
</section>
${aboutTeaser(site, mode)}`;
}

/** Dashboard homepage — KPI tiles + reports table + modules (sidebar chrome). */
function dashboardHome(site: SiteConfig, mode: RenderMode): string {
  const meta = templateMeta(site.template);
  const heading = esc(site.hero.heading.trim() || site.siteName.trim() || "Dashboard");
  const subtext = site.hero.subtext.trim();
  const tiles = (meta.stats || [])
    .map((s) => `<div class="dash-kpi"><span class="dash-kpi-value">${esc(s.value)}</span><span class="dash-kpi-label">${esc(s.label)}</span></div>`)
    .join("");
  const reports = site.menu.slice(0, 6).map((m) => `
    <tr>
      <td class="dash-name">${esc(m.name)}</td>
      <td>${esc(m.description)}</td>
      <td><span class="dash-status">${esc(m.price || "—")}</span></td>
    </tr>`).join("");
  return `
<section class="section">
  <div class="container">
    <h2 class="section-head">${heading}</h2>
    ${subtext ? `<p class="section-sub" style="margin-bottom:24px">${esc(subtext)}</p>` : ""}
    ${tiles ? `<div class="dash-kpis">${tiles}</div>` : ""}
    <div class="dash-panel">
      <div class="dash-panel-head"><h3>${esc(pageLabel(site.template, "menu"))}</h3></div>
      ${
        reports
          ? `<table class="dash-table"><thead><tr><th>Report</th><th>Summary</th><th>Status</th></tr></thead><tbody>${reports}</tbody></table>`
          : `<p class="section-sub" style="font-style:italic">Reports coming soon.</p>`
      }
    </div>
    <div class="dash-panel">
      <div class="dash-panel-head"><h3>${esc(meta.featuredHeading)}</h3></div>
      ${servicesGrid(site, mode)}
    </div>
  </div>
</section>
${aboutTeaser(site, mode)}`;
}

function aboutBody(site: SiteConfig): string {
  const text = site.about.text.trim();
  const img = site.images.about.trim();
  const tagline = site.tagline.trim() || site.siteName.trim() || "Welcome";
  const gridClass = img ? "about-grid" : "about-grid no-img";
  return `
<section class="section">
  <div class="container">
    <h2 class="section-head">About us</h2>
    <p class="section-sub" style="margin-bottom:28px">${esc(tagline)}</p>
    <div class="${gridClass}">
      ${img ? `<img class="about-img" src="${esc(img)}" alt="" loading="lazy">` : ""}
      <div class="about-text">${text ? paragraphs(text) : `<p style="font-style:italic;color:var(--muted)">Our story is coming soon.</p>`}</div>
    </div>
  </div>
</section>`;
}

function menuBody(site: SiteConfig, mode: RenderMode): string {
  const title = pageLabel(site.template, "menu");
  const subtitle =
    site.template === "clinic"
      ? "Every department under one roof — book a specialist visit in minutes."
      : site.template === "shop"
        ? "Packed by hand and on its way within 24 hours."
        : site.template === "bank"
          ? "No hidden fees, no asterisks — what you see is what you get."
          : site.template === "business"
            ? "Everything with care, from start to finish."
            : site.template === "modern"
              ? "Sharp ideas, made beautifully."
              : "Everything made fresh, in house.";
  if (site.template === "business" || site.template === "modern" || site.template === "clinic") {
    return `
<section class="section">
  <div class="container">
    <h2 class="section-head">${esc(title)}</h2>
    <p class="section-sub">${esc(subtitle)}</p>
    ${servicesGrid(site, mode)}
  </div>
</section>`;
  }
  if (site.template === "portfolio") {
    return `
<section class="section">
  <div class="container">
    <h2 class="section-head">${esc(title)}</h2>
    ${projectsGrid(site)}
  </div>
</section>`;
  }
  if (site.template === "bank") {
    return accountsTable(site, mode);
  }
  return `
<section class="section">
  <div class="container">
    <h2 class="section-head">${esc(title)}</h2>
    <p class="section-sub">${esc(subtitle)}</p>
    ${menuGrid(site, mode)}
  </div>
</section>`;
}

function galleryBody(site: SiteConfig): string {
  const title = pageLabel(site.template, "gallery");
  const isGrid = site.template === "portfolio" || site.template === "films" || site.template === "agency" || site.template === "newsroom";
  const sub = site.template === "films" ? "Recent films, festival shorts and brand work." : site.template === "newsroom" ? "Long reads, interviews and dispatches." : site.template === "agency" ? "Selected work, recent and proud." : "A few recent things I’m proud of.";
  return `
<section class="section">
  <div class="container">
    <h2 class="section-head">${esc(title)}</h2>
    ${isGrid ? `<p class="section-sub">${esc(sub)}</p>
    ${projectsGrid(site)}` : `<p class="section-sub" style="font-style:italic">Coming soon.</p>`}
  </div>
</section>`;
}

/** Initials avatar for a person's name, skipping honorifics ("Dr. Amina Okafor" → "AO"). */
const AVATAR_HONORIFICS = new Set(["dr", "mr", "mrs", "ms", "prof", "rev"]);
function avatarInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const significant = words.filter((w) => !AVATAR_HONORIFICS.has(w.replace(/\./g, "").toLowerCase()));
  const source = significant.length >= 2 ? significant : words;
  return (
    source
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function teamBody(site: SiteConfig, mode: RenderMode): string {
  const title = pageLabel(site.template, "team");
  if (site.team.length === 0) {
    return `
<section class="section">
  <div class="container">
    <h2 class="section-head">${esc(title)}</h2>
    <p class="section-sub" style="font-style:italic">Team members coming soon.</p>
  </div>
</section>`;
  }
  const cards = site.team
    .map((t) => {
      const custom = cardLinkHref(t.link, site, mode);
      const open = modalAttrs(t.name, t.role, t.bio, custom, "Learn more");
      return `
    <article class="team-card" ${open} tabindex="0" role="button" aria-haspopup="dialog">
      <span class="team-avatar" aria-hidden="true">${esc(avatarInitials(t.name))}</span>
      <h3>${esc(t.name)}</h3>
      <p class="team-role">${esc(t.role)}</p>
      ${t.bio.trim() ? `<p class="team-bio">${esc(t.bio.trim())}</p>` : ""}
    </article>`;
    })
    .join("");
  return `
<section class="section">
  <div class="container">
    <h2 class="section-head">${esc(title)}</h2>
    <p class="section-sub">The people making it happen.</p>
    <div class="team-grid">${cards}</div>
  </div>
</section>`;
}

function jobCard(site: SiteConfig, j: SiteConfig["jobs"][number]): string {
  const email = site.contact.email.trim();
  const apply = email
    ? `<a class="btn btn-sm" href="mailto:${esc(email)}?subject=${esc(encodeURIComponent(`Application: ${j.title}`))}">Apply</a>`
    : "";
  const meta = `${j.dept.trim()}${j.location.trim() ? ` · ${esc(j.location.trim())}` : ""}`;
  return `
  <article class="job-card">
    <div class="job-main">
      <h3>${esc(j.title)}</h3>
      ${meta.trim() ? `<p class="job-meta">${esc(meta.trim())}</p>` : ""}
    </div>
    <div class="job-side">
      ${j.type.trim() ? `<span class="chip">${esc(j.type.trim())}</span>` : ""}
      ${apply}
    </div>
  </article>`;
}

function jobsGrid(site: SiteConfig): string {
  return `<div class="jobs-list">${site.jobs.map((j) => jobCard(site, j)).join("")}</div>`;
}

function pricingBody(site: SiteConfig, mode: RenderMode): string {
  const title = pageLabel(site.template, "pricing");
  const sub =
    site.template === "fitness"
      ? "Pick the plan that fits your week. Every plan starts with a free movement screen."
      : site.template === "saas"
        ? "Start free, upgrade when your team does. No hidden fees, cancel any time."
        : "Clear plans, clear prices — no surprises at checkout.";
  return `
<section class="section">
  <div class="container">
    <h2 class="section-head">${esc(title)}</h2>
    <p class="section-sub">${esc(sub)}</p>
    ${plansGrid(site, mode)}
  </div>
</section>`;
}

function faqBody(site: SiteConfig): string {
  const title = pageLabel(site.template, "faq");
  return `
<section class="section">
  <div class="container">
    <h2 class="section-head">${esc(title)}</h2>
    <p class="section-sub">The things people ask most — answered honestly.</p>
    ${faqSection(site)}
  </div>
</section>`;
}

function testimonialsBody(site: SiteConfig): string {
  const title = pageLabel(site.template, "testimonials");
  return `
<section class="section">
  <div class="container">
    <h2 class="section-head">${esc(title)}</h2>
    <p class="section-sub">In their words, not ours.</p>
    ${testimonialsBand(site)}
  </div>
</section>`;
}

/** News / journal: the site's projects rendered as a stacked post list. */
function newsBody(site: SiteConfig): string {
  const title = pageLabel(site.template, "news");
  const posts = site.projects
    .map((pr) => {
      const img = (pr.image || "").trim() ? `<img class="news-img" src="${esc((pr.image || "").trim())}" alt="" loading="lazy">` : "";
      const link = (pr.link || "").trim()
        ? `<a class="link" href="${esc((pr.link || "").trim())}" target="_blank" rel="noopener">Read more →</a>`
        : "";
      const open = modalAttrs(pr.title, "", pr.description, (pr.link || "").trim(), "Read more");
      return `
    <article class="news-item" ${open} tabindex="0" role="button" aria-haspopup="dialog">
      ${img}
      <div class="news-body">
        <h3>${esc(pr.title)}</h3>
        ${pr.description.trim() ? `<p>${esc(pr.description)}</p>` : ""}
        ${link}
      </div>
    </article>`;
    })
    .join("");
  return `
<section class="section">
  <div class="container">
    <h2 class="section-head">${esc(title)}</h2>
    ${posts || `<p class="section-sub" style="font-style:italic">Posts coming soon.</p>`}
  </div>
</section>`;
}

function jobsBody(site: SiteConfig): string {
  const title = pageLabel(site.template, "jobs");
  if (site.jobs.length === 0) {
    return `
<section class="section">
  <div class="container">
    <h2 class="section-head">${esc(title)}</h2>
    <p class="section-sub" style="font-style:italic">New roles are posted regularly — check back soon.</p>
  </div>
</section>`;
  }
  return `
<section class="section">
  <div class="container">
    <h2 class="section-head">${esc(title)}</h2>
    <p class="section-sub">${
      site.template === "hr"
        ? "Pick a role — or send us your CV and we’ll match you for free."
        : "Open roles, honest salary bands and a short process."
    }</p>
    ${jobsGrid(site)}
  </div>
</section>`;
}

/** Appointment / account-opening / request-a-quote page (static form → mailto). */
function bookingBody(site: SiteConfig): string {
  const title = pageLabel(site.template, "booking");
  const c = site.contact;
  const cards: string[] = [];
  if (c.phone.trim()) cards.push(`<div class="info-card"><h4>Call us</h4><p><a href="tel:${esc(c.phone.trim())}">${esc(c.phone.trim())}</a></p></div>`);
  if (c.email.trim()) cards.push(`<div class="info-card"><h4>Email</h4><p><a href="mailto:${esc(c.email.trim())}">${esc(c.email.trim())}</a></p></div>`);
  if (site.features.whatsapp && waNumber(site)) {
    cards.push(`<div class="info-card"><h4>WhatsApp</h4><p><a href="https://wa.me/${waNumber(site)}" target="_blank" rel="noopener">Chat with us</a></p></div>`);
  }
  const isClinic = site.template === "clinic";
  const isBank = site.template === "bank";
  const hoursHtml =
    site.features.hours && site.hours.trim()
      ? `<div class="booking-hours"><h4>Hours</h4><p class="hours-text">${esc(site.hours.trim()).replace(/\n/g, "<br>")}</p></div>`
      : "";
  const sub = isClinic
    ? "Pick a time below and we’ll confirm within the hour."
    : isBank
      ? "Open an account in about ten minutes — no branches required."
      : "Tell us what you need and we’ll get back to you quickly.";
  const whenLabel = isClinic ? "Preferred date & time" : isBank ? "What would you like to open?" : "When works for you?";
  const whenPlaceholder = isClinic ? "e.g. Friday at 10:30" : isBank ? "e.g. Everyday Checking" : "e.g. Next Tuesday, 9am";
  const buttonLabel = isClinic ? "Request appointment" : isBank ? "Request account" : "Request booking";
  return `
<section class="section">
  <div class="container" style="max-width:820px">
    <h2 class="section-head">${esc(title)}</h2>
    <p class="section-sub">${esc(sub)}</p>
    ${cards.length ? `<div class="contact-grid">${cards.join("")}</div>` : ""}
    ${hoursHtml}
    <form class="booking-form" id="__bookingForm" novalidate>
      <div class="form-grid">
        <label class="form-field"><span>Your name</span><input class="input" name="name" type="text" placeholder="Jane Smith" required></label>
        <label class="form-field"><span>Phone or email</span><input class="input" name="contact" type="text" placeholder="+1 555 000 0000" required></label>
      </div>
      <label class="form-field"><span>${esc(whenLabel)}</span><input class="input" name="when" type="text" placeholder="${esc(whenPlaceholder)}" required></label>
      <label class="form-field"><span>Anything else we should know?</span><textarea class="input textarea" name="note" rows="3"></textarea></label>
      <button class="btn btn-primary" type="submit">${esc(buttonLabel)}</button>
      <p class="form-note">Nothing is stored or sent anywhere — clicking the button opens a ready-to-send email to us.</p>
    </form>
  </div>
</section>`;
}

/** A user-created page: title, feature chips, free-form content and an
 * optional call-to-action button — everything the creative-user option needs. */
function customBody(site: SiteConfig, ref: string, mode: RenderMode): string {
  const page = site.customPages.find((c) => c.id === ref);
  if (!page) return "";
  const align = isTextAlign(page.align) ? page.align : "left";
  const title = esc(page.title.trim() || "New page");
  const chips = (page.chips || [])
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => `<li class="chip">${esc(c)}</li>`)
    .join("");
  const ctaLabel = page.ctaLabel.trim();
  // Button target: a page of this site (dropdown choice) or a manual link.
  const ctaPage = page.ctaPage && site.pages.includes(page.ctaPage) ? page.ctaPage : "";
  const ctaHref = page.ctaHref.trim();
  const href = ctaPage ? pageHref(mode, ctaPage) : ctaHref || "#";
  const navAttr = ctaPage ? ` data-nav="${esc(ctaPage)}"` : "";
  const ext = !ctaPage && /^https?:/i.test(ctaHref) ? ` target="_blank" rel="noopener"` : "";
  const cta = ctaLabel
    ? `<div class="hero-cta"><a class="btn btn-primary" href="${esc(href)}"${navAttr}${ext}>${esc(ctaLabel)}</a></div>`
    : "";
  return `
<section class="section align-${align}">
  <div class="container" style="max-width:780px">
    <h2 class="section-head">${title}</h2>
    ${chips ? `<ul class="chips" style="list-style:none;padding:0;margin:0 0 30px">${chips}</ul>` : ""}
    <div class="about-text">${
      page.content.trim()
        ? paragraphs(page.content)
        : `<p style="font-style:italic;color:var(--muted)">Nothing here yet — write a few paragraphs about this page.</p>`
    }</div>
    ${cta}
  </div>
</section>`;
}

function contactBody(site: SiteConfig): string {
  const c = site.contact;
  const cards: string[] = [];
  if (c.phone.trim()) {
    cards.push(`<div class="info-card"><h4>Phone</h4><p><a href="tel:${esc(c.phone.trim())}">${esc(c.phone.trim())}</a></p></div>`);
  }
  if (c.email.trim()) {
    cards.push(`<div class="info-card"><h4>Email</h4><p><a href="mailto:${esc(c.email.trim())}">${esc(c.email.trim())}</a></p></div>`);
  }
  if (c.address.trim()) {
    cards.push(`<div class="info-card"><h4>Find us</h4><p>${esc(c.address.trim())}</p></div>`);
  }
  if (site.features.hours && site.hours.trim()) {
    cards.push(`<div class="info-card"><h4>Opening hours</h4><p class="hours-text">${esc(site.hours).replace(/\n/g, "<br>")}</p></div>`);
  }
  const form = site.features.contactForm
    ? `
  <div class="info-card" style="background:var(--surface);box-shadow:var(--shadow)">
    <h4 style="font-size:1rem;text-transform:none;letter-spacing:0;color:var(--text);margin-bottom:14px">Send us a message</h4>
    <form class="form" id="__contactForm">
      <label>Your name <input name="name" required placeholder="Jane Doe" /></label>
      <label>Email <input type="email" name="email" required placeholder="you@example.com" /></label>
      <label>Message <textarea name="message" required placeholder="How can we help?"></textarea></label>
      <button class="btn btn-primary" type="submit">Send message</button>
      <p class="form-note">Opens your email app to send — no account needed.</p>
    </form>
  </div>`
    : "";
  const mapQuery = (c.mapsQuery || c.address).trim();
  const map = site.features.maps && mapQuery
    ? `<iframe class="map" src="https://maps.google.com/maps?q=${esc(encodeURIComponent(mapQuery))}&t=&z=15&ie=UTF8&iwloc=&output=embed" loading="lazy" title="${esc(site.siteName)} location"></iframe>`
    : "";
  const socials = socialsHtml(site, "left");
  return `
<section class="section">
  <div class="container">
    <h2 class="section-head">Get in touch</h2>
    <p class="section-sub">We'd love to hear from you.</p>
    ${socials}
    <div class="contact-grid" style="${socials ? "margin-top:28px" : ""}">
      <div>${cards.length ? cards.join("") : `<p class="section-sub" style="font-style:italic">Contact details are coming soon.</p>`}</div>
      ${form ? `<div>${form}</div>` : ""}
    </div>
    ${map}
  </div>
</section>`;
}

function waFloat(site: SiteConfig): string {
  const num = waNumber(site);
  if (!site.features.whatsapp || !num) return "";
  const text = encodeURIComponent(`Hello ${site.siteName || "there"}! 👋`);
  return `<a class="wa-float" href="https://wa.me/${esc(num)}?text=${esc(text)}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">💬</a>`;
}

/** Floating cart button + slide-out drawer — only for the shop template. */
function cartHtml(site: SiteConfig): string {
  if (site.template !== "shop") return "";
  return `
<button class="cart-float" id="__cartBtn" onclick="__cartOpen()" aria-label="Open cart">
  <span aria-hidden="true">🛒</span><span class="cart-badge" id="__cartCount">0</span>
</button>
<div class="cart-drawer" id="__cart" aria-hidden="true">
  <div class="cart-head"><strong>Your cart</strong><button class="cart-close" onclick="__cartClose()" aria-label="Close cart">✕</button></div>
  <div class="cart-body" id="__cartItems"></div>
  <div class="cart-foot">
    <div class="cart-total"><span>Total</span><strong id="__cartTotal">$0.00</strong></div>
    <a class="btn cart-order is-disabled" id="__cartOrder" href="#" rel="noopener" aria-disabled="true">Order now</a>
  </div>
</div>`;
}

/** Generic info modal opened by clickable cards. */
function modalHtml(): string {
  return `
<div class="modal" id="__modal" aria-hidden="true" role="dialog" aria-modal="true">
  <div class="modal-backdrop" data-close></div>
  <div class="modal-panel">
    <button class="modal-x" onclick="__closeModal()" aria-label="Close">✕</button>
    <h3 class="modal-title"></h3>
    <p class="modal-meta"></p>
    <div class="modal-desc"></div>
    <a class="btn modal-cta" href="#" target="_blank" rel="noopener" style="display:none"></a>
  </div>
</div>`;
}

// ---------------------------------------------------------------------------
// Shared inline script (dark mode toggle, mobile nav, preview nav, form)
// ---------------------------------------------------------------------------

function pageScript(mode: RenderMode, site: SiteConfig): string {
  const persist = mode !== "preview";
  const siteName = JSON.stringify(site.siteName.trim() || "My Site");
  const email = JSON.stringify(site.contact.email.trim());
  const waNum = JSON.stringify(site.features.whatsapp ? waNumber(site) : "");
  const intercept = mode === "preview";
  const withForm = site.features.contactForm;
  const withCart = site.template === "shop";
  const router =
    mode === "app"
      ? `
  function showPage() {
    var raw = (location.hash || "").replace(/^#\\//, "");
    var target = raw && document.getElementById("view-" + raw) ? raw : "home";
    var sections = document.querySelectorAll(".page-view");
    for (var i = 0; i < sections.length; i++) {
      sections[i].classList.toggle("active", sections[i].getAttribute("data-page") === target);
    }
  }
  window.addEventListener("hashchange", showPage);
  showPage();`
      : "";
  const formInit = withForm
    ? `
  var __f = document.getElementById("__contactForm");
  if (__f) {
    __f.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = (__f.elements["name"] && __f.elements["name"].value) || "";
      var em = (__f.elements["email"] && __f.elements["email"].value) || "";
      var msg = (__f.elements["message"] && __f.elements["message"].value) || "";
      var subject = encodeURIComponent("Message from " + name + " via " + ${siteName});
      var body = encodeURIComponent("Name: " + name + "\\nEmail: " + em + "\\n\\n" + msg);
      window.location.href = "mailto:" + ${email} + "?subject=" + subject + "&body=" + body;
    });
  }`
    : "";
  const bookingInit = `
  var __b = document.getElementById("__bookingForm");
  if (__b) {
    __b.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = (__b.elements["name"] && __b.elements["name"].value) || "";
      var cont = (__b.elements["contact"] && __b.elements["contact"].value) || "";
      var when = (__b.elements["when"] && __b.elements["when"].value) || "";
      var note = (__b.elements["note"] && __b.elements["note"].value) || "";
      var subject = encodeURIComponent(${siteName} + " — request from " + name);
      var body = encodeURIComponent("Name: " + name + "\\nContact: " + cont + "\\nWhen: " + when + "\\n\\n" + note);
      window.location.href = "mailto:" + ${email} + "?subject=" + subject + "&body=" + body;
    });
  }`;
  return `(function () {
  var SITE = ${siteName};
  var EMAIL = ${email};
  var WA = ${waNum};
  var THEME_KEY = "sf-theme";
  function curTheme() { return document.documentElement.getAttribute("data-theme") || "light"; }
  var saved = null;
  if (${persist}) { try { saved = localStorage.getItem(THEME_KEY); } catch (e) {} }
  document.documentElement.setAttribute("data-theme", saved === "dark" ? "dark" : "light");
  window.__setTheme = function (t) {
    document.documentElement.setAttribute("data-theme", t);
    if (${persist}) { try { localStorage.setItem(THEME_KEY, t); } catch (e) {} }
  };
  window.__toggleTheme = function () { window.__setTheme(curTheme() === "dark" ? "light" : "dark"); };
  window.__toggleNav = function () { var l = document.getElementById("__navLinks"); if (l) l.classList.toggle("open"); };
  window.__toggleSideNav = function () {
    var n = document.querySelector(".side-nav");
    if (n) n.classList.toggle("open");
    var t = document.getElementById("__sideToggle");
    if (t) t.setAttribute("aria-expanded", n && n.classList.contains("open") ? "true" : "false");
  };
  function __escS(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function __safeLink(u) {
    u = String(u == null ? "" : u).trim();
    var m = /^[a-z][a-z0-9+.-]*:/i.exec(u);
    if (m && !/^(https?|mailto|tel):$/i.test(m[0])) return "#";
    return u || "#";
  }
  /* Info modal — any element with [data-modal] opens a detail dialog. */
  function __openModal(el) {
    var m = document.getElementById("__modal");
    if (!m) return;
    var title = el.getAttribute("data-title") || "Details";
    var meta = el.getAttribute("data-meta") || "";
    var desc = el.getAttribute("data-desc") || "";
    var cta = el.getAttribute("data-cta") || "";
    var ctaLabel = el.getAttribute("data-cta-label") || "Learn more";
    m.querySelector(".modal-title").textContent = title;
    var metaEl = m.querySelector(".modal-meta");
    metaEl.textContent = meta;
    metaEl.style.display = meta ? "" : "none";
    m.querySelector(".modal-desc").innerHTML = __escS(desc).replace(/\\n/g, "<br>");
    var ctaEl = m.querySelector(".modal-cta");
    if (cta) { ctaEl.href = __safeLink(cta); ctaEl.textContent = ctaLabel; ctaEl.style.display = "inline-flex"; }
    else { ctaEl.style.display = "none"; }
    m.classList.add("open");
    m.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function __closeModal() {
    var m = document.getElementById("__modal");
    if (!m) return;
    m.classList.remove("open");
    m.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }
  document.addEventListener("click", function (e) {
    var c = e.target && e.target.closest ? e.target.closest("[data-modal]") : null;
    var inner = e.target && e.target.closest ? e.target.closest("a, button") : null;
    if (c && !inner) { e.preventDefault(); __openModal(c); return; }
    var cl = e.target && e.target.closest ? e.target.closest("[data-close]") : null;
    if (cl) { __closeModal(); return; }
    var bx = e.target && e.target.closest ? e.target.closest(".modal-x") : null;
    if (bx) __closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") __closeModal();
    if ((e.key === "Enter" || e.key === " ") && e.target && e.target.closest && e.target.closest("[data-modal]")) {
      e.preventDefault();
      __openModal(e.target.closest("[data-modal]"));
    }
  });
  ${withCart ? `
  /* Cart (shop template) — add/remove items, then order via WhatsApp or email. */
  var CART = [];
  function __cartRender() {
    var wrap = document.getElementById("__cartItems");
    var badge = document.getElementById("__cartCount");
    var totalEl = document.getElementById("__cartTotal");
    var orderBtn = document.getElementById("__cartOrder");
    var total = 0, n = 0, html = "", lines = [];
    for (var i = 0; i < CART.length; i++) {
      var it = CART[i];
      var lineTotal = it.price * it.qty;
      total += lineTotal; n += it.qty;
      lines.push("- " + it.name + " x" + it.qty + " = $" + lineTotal.toFixed(2));
      html += '<div class="cart-line"><span class="cart-line-name">' + __escS(it.name) + '</span>' +
        '<span class="cart-ops"><button type="button" class="cart-q" data-dec="' + i + '" aria-label="Decrease">−</button><span class="cart-qty">' + it.qty + '</span><button type="button" class="cart-q" data-inc="' + i + '" aria-label="Increase">+</button></span>' +
        '<span class="cart-line-total">$' + lineTotal.toFixed(2) + '</span>' +
        '<button type="button" class="cart-x" data-del="' + i + '" aria-label="Remove">✕</button></div>';
    }
    wrap.innerHTML = html ? '<div class="cart-list">' + html + '</div>' : '<p class="cart-empty">Your cart is empty.</p>';
    if (badge) badge.textContent = n;
    if (totalEl) totalEl.textContent = "$" + total.toFixed(2);
    /* Checkout: a live wa.me / mailto link, so it still works with JS-only taps. */
    if (orderBtn) {
      var message = "New order for " + SITE + ":\\n" + lines.join("\\n") + "\\nTotal: $" + total.toFixed(2);
      var can = n > 0 && (WA || EMAIL);
      if (can && WA) orderBtn.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(message);
      else if (can) orderBtn.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Order for " + SITE) + "&body=" + encodeURIComponent(message);
      else orderBtn.href = "#";
      if (can) { orderBtn.classList.remove("is-disabled"); orderBtn.removeAttribute("aria-disabled"); }
      else { orderBtn.classList.add("is-disabled"); orderBtn.setAttribute("aria-disabled", "true"); }
    }
    return total;
  }
  function __addToCart(btn) {
    var name = btn.getAttribute("data-name") || "Item";
    var price = parseFloat(btn.getAttribute("data-price") || "0") || 0;
    for (var i = 0; i < CART.length; i++) {
      if (CART[i].name === name) { CART[i].qty++; __cartRender(); __cartOpen(); return; }
    }
    CART.push({ name: name, price: price, qty: 1 });
    __cartRender();
    __cartOpen();
  }
  function __cartOpen() {
    var c = document.getElementById("__cart");
    if (c) { c.classList.add("open"); __cartRender(); }
  }
  function __cartClose() {
    var c = document.getElementById("__cart");
    if (c) c.classList.remove("open");
  }
  var __cartBodyEl = document.getElementById("__cartItems");
  if (__cartBodyEl) {
    __cartBodyEl.addEventListener("click", function (e) {
      var t = e.target;
      var inc = t.getAttribute && t.getAttribute("data-inc");
      var dec = t.getAttribute && t.getAttribute("data-dec");
      var del = t.getAttribute && t.getAttribute("data-del");
      if (inc !== null) { CART[+inc].qty++; __cartRender(); }
      else if (dec !== null) { CART[+dec].qty--; if (CART[+dec].qty <= 0) CART.splice(+dec, 1); __cartRender(); }
      else if (del !== null) { CART.splice(+del, 1); __cartRender(); }
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest(".cart-add") : null;
    if (b) { e.preventDefault(); __addToCart(b); }
  });
  __cartRender();` : ""}
  ${intercept ? `
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[data-nav]") : null;
    if (!a) return;
    e.preventDefault();
    try { window.parent.postMessage({ type: "SF_NAV", page: a.getAttribute("data-nav") }, "*"); } catch (err) {}
  });` : ""}
  ${router}
  ${formInit}
  ${bookingInit}
})();`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function head(
  paletteId: PaletteId,
  title: string,
  description: string,
  appStyles: boolean,
  favicon: string
): string {
  return `
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${favicon}</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>${cssFor(paletteId, appStyles)}</style>`;
}

function renderBody(pageRef: string, site: SiteConfig, mode: RenderMode): string {
  if (!isBuiltInPage(pageRef)) return `<main>${customBody(site, pageRef, mode)}</main>`;
  const pageId = pageRef as PageId;
  let inner: string;
  switch (pageId) {
    case "home":
      inner = homeBody(site, mode);
      break;
    case "about":
      inner = aboutBody(site);
      break;
    case "menu":
      inner = menuBody(site, mode);
      break;
    case "gallery":
      inner = galleryBody(site);
      break;
    case "team":
      inner = teamBody(site, mode);
      break;
    case "pricing":
      inner = pricingBody(site, mode);
      break;
    case "faq":
      inner = faqBody(site);
      break;
    case "testimonials":
      inner = testimonialsBody(site);
      break;
    case "news":
      inner = newsBody(site);
      break;
    case "booking":
      inner = bookingBody(site);
      break;
    case "jobs":
      inner = jobsBody(site);
      break;
    case "contact":
      inner = contactBody(site);
      break;
  }
  return `<main>${inner}</main>`;
}

/**
 * Which content list a built-in page displays. The builder uses this to show
 * exactly the editors a site needs, so panel contents and rendered pages can
 * never drift apart.
 */
export function pageListKind(
  page: PageId,
  template: TemplateId
): "menu" | "services" | "projects" | "jobs" | "team" | "faqs" | "testimonials" | null {
  if (page === "menu") {
    if (template === "business" || template === "modern" || template === "clinic" || template === "profile")
      return "services";
    if (template === "portfolio") return "projects";
    return "menu";
  }
  if (page === "gallery" || page === "news") return "projects";
  if (page === "jobs") return "jobs";
  if (page === "team") return "team";
  if (page === "pricing") return "menu"; // plans are priced menu items
  if (page === "faq") return "faqs";
  if (page === "testimonials") return "testimonials";
  return null;
}

/** Render one complete HTML page document. Mode "file" is export-ready. */
export function renderPage(ref: string, site: SiteConfig, mode: RenderMode): string {
  const label = labelFor(site, ref);
  const title = ref === "home" ? site.siteName : `${label} — ${site.siteName}`;
  const desc = site.tagline.trim() || `${site.siteName} — ${label}`;
  const layout = templateMeta(site.template).layout;
  const footer = footerHtml(site, mode);
  const content =
    layout === "sidebar"
      ? `<div class="side-wrap">${renderBody(ref, site, mode)}${footer}</div>`
      : `${renderBody(ref, site, mode)}${footer}`;
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>${head(site.palette, title || "My Site", desc, false, templateMeta(site.template).icon)}</head>
<body class="tpl-${site.template} layout-${layout}">
${headerHtml(site, mode)}
${content}
${waFloat(site)}
${cartHtml(site)}
${modalHtml()}
<script>${pageScript(mode, site)}</script>
</body>
</html>
`;
}

/** Single-file build with client-side routing — used for "Open preview" and
 * future share links. Includes every enabled page. */
export function renderFullApp(site: SiteConfig): string {
  const title = site.siteName;
  const pagesYouSee = site.pages.filter((p) => p !== "home");
  const views = [
    `<section class="page-view active" id="view-home" data-page="home">${homeBody(site, "app")}</section>`,
    ...pagesYouSee.map(
      (p) => `<section class="page-view" id="view-${p}" data-page="${p}">${renderBody(p, site, "app")}</section>`
    ),
  ].join("");
  const layout = templateMeta(site.template).layout;
  const footer = footerHtml(site, "app");
  const content =
    layout === "sidebar" ? `<div class="side-wrap"><main>${views}</main>${footer}</div>` : `<main>${views}</main>${footer}`;
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>${head(site.palette, title || "My Site", site.tagline, true, templateMeta(site.template).icon)}</head>
<body class="tpl-${site.template} layout-${layout}">
${headerHtml(site, "app")}
${content}
${waFloat(site)}
${cartHtml(site)}
${modalHtml()}
<script>${pageScript("app", site)}</script>
</body>
</html>
`;
}

/** Build the exact file map that goes into the exported .zip. */
export function buildSiteFiles(site: SiteConfig): Record<string, string> {
  const files: Record<string, string> = {};
  for (const ref of site.pages) {
    files[pageFile(ref)] = renderPage(ref, site, "file");
  }
  const siteName = site.siteName.trim() || "My Site";
  files["README.txt"] = [
    `${siteName} — created with SiteForge`,
    "",
    "How to preview:",
    "  • Double-click index.html — everything works from your own computer.",
    "  • Dark mode, WhatsApp button, maps and forms are all included.",
    "",
    "How to put it on the internet (free):",
    "  • Netlify Drop (app.netlify.com/drop) — drag this folder in, done.",
    "  • Or GitHub Pages — upload, enable, and you get a live link.",
    "",
    "Notes:",
    "  • The contact form opens the visitor's email app. For a form that",
    "    sends to an inbox instead, hook it to a free service (e.g. Formspree).",
    "  • This folder has plain HTML + CSS + a little JavaScript. No accounts,",
    "    no servers, no monthly fees.",
    "",
    `Generated ${new Date().getFullYear()}.`,
    "",
  ].join("\n");
  return files;
}

/** Blob URL for the single-file preview (for "Open preview in new tab"). */
export function fullPreviewUrl(site: SiteConfig): string {
  return URL.createObjectURL(new Blob([renderFullApp(site)], { type: "text/html" }));
}

export type { SocialKey };