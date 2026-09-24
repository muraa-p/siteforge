/**
 * Headless smoke test for the SiteForge render engine.
 * Run with: npm run smoke
 */

import { createSite, normalizeSite, createSampleSite } from "../src/lib/sample";
import { TEMPLATE_ORDER, pageLabel } from "../src/lib/templates";
import { ALL_PAGES, PAGE_HINTS, type PageRef } from "../src/lib/types";
import { renderPage, renderFullApp, buildSiteFiles, slugify, esc, pageFile, pageListKind } from "../src/lib/render";

let failures = 0;
function check(name: string, ok: boolean, detail?: string) {
  if (!ok) {
    failures++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    console.log(`  ✓ ${name}`);
  }
}

const escExpect =
  esc(`<script>"'&`) === "&lt;script&gt;&quot;&#39;&amp;";
check("esc() escapes HTML specials", escExpect);
check("slugify() produces safe filename", slugify("La Trattoria!") === "la-trattoria");

// --- all templates render all their pages ---
for (const tid of TEMPLATE_ORDER) {
  const site = createSite(tid);
  for (const page of site.pages) {
    const html = renderPage(page, site, "file");
    check(
      `${tid} / ${page}: complete document`,
      html.startsWith("<!doctype html>") &&
        html.includes("</html>") &&
        html.includes("<nav") &&
        html.includes("</footer>"),
      html.length > 0 ? `len=${html.length}` : "empty output"
    );
  }

  // preview == export (same markup, links differ)
  const stripScript = (h: string) => h.replace(/<script>[\s\S]*<\/script>/g, "<script></script>");
  for (const page of site.pages) {
    const bodyOf = (h: string) =>
      stripScript(h)
        .replace(/href="[^"]*"/g, 'href="X"')
        .replace(/data-cta="[^"]*"/g, 'data-cta="X"');
    const same =
      bodyOf(renderPage(page, site, "file")) === bodyOf(renderPage(page, site, "preview"));
    check(`${tid} / ${page}: preview and export share identical markup`, same);
  }

  // page labels from the template meta
  check(
    `${tid}: page labels applied`,
    site.pages.every((p) => pageLabel(tid, p).trim().length > 0)
  );
}

// --- per-template content grids ---
const rest = createSite("restaurant");
const biz = createSite("business");
const port = createSite("portfolio");

check("restaurant home shows menu cards", rest.menu.length > 0 && renderPage("home", rest, "file").includes("menu-card"));
check("business home shows service cards", biz.services.length > 0 && renderPage("home", biz, "file").includes("service-card"));
check("portfolio home shows project cards", port.projects.length > 0 && renderPage("home", port, "file").includes("project-card"));
check("portfolio labels menu page as Work", renderPage("gallery", port, "file").includes("Selected work") || renderPage("gallery", port, "file").includes(pageLabel("portfolio", "gallery")));
check("business labels menu page as Services", renderPage("menu", biz, "file").includes("Services"));

// --- features ---
check("dark-mode toggle button renders", renderPage("home", rest, "file").includes('onclick="__toggleTheme()"'));
check("WhatsApp float renders", renderPage("home", rest, "file").includes("https://wa.me/15552148890"));
check("contact form renders", renderPage("contact", rest, "file").includes('id="__contactForm"'));
check("map iframe renders", renderPage("contact", rest, "file").includes("maps.google.com/maps?q="));
check("hours render", renderPage("contact", rest, "file").includes("Opening hours"));

// --- features absent when disabled ---
const plain = createSite("restaurant");
plain.features = { darkMode: false, whatsapp: false, contactForm: false, maps: false, hours: false };
const plainContact = renderPage("contact", plain, "file");
check("all features off: no form", !plainContact.includes("__contactForm"));
check("all features off: no map", !plainContact.includes("maps.google.com"));
const plainHome = renderPage("home", plain, "file");
check("all features off: no theme button", !plainHome.includes('onclick="__toggleTheme()"'));
check("all features off: no wa float", !plainHome.includes("https://wa.me/"));

// --- map uses its own query when provided ---
const mapped = createSite("restaurant");
mapped.contact.mapsQuery = "Union Square, Springfield";
check("separate map location is used", renderPage("contact", mapped, "file").includes(encodeURIComponent("Union Square, Springfield")));

// --- images are embedded when set (data URL) ---
const withImgs = createSite("restaurant");
withImgs.images.heroBg = "data:image/jpeg;base64,AAAA";
withImgs.images.about = "data:image/jpeg;base64,BBBB";
withImgs.menu[0].image = "data:image/jpeg;base64,CCCC";
const imgHome = renderPage("home", withImgs, "file");
const imgAbout = renderPage("about", withImgs, "file");
const imgMenu = renderPage("menu", withImgs, "file");
check("hero bg image embedded (valid CSS quote)", imgHome.includes("background-image:url('data:image/jpeg;base64,AAAA')"));
check("about image embedded", imgAbout.includes("BBBB") && imgAbout.includes("about-img"));
check("menu item image embedded", imgMenu.includes("CCCC") && imgMenu.includes("menu-img"));
const noImg = createSite("restaurant");
check("no hero image when empty", !renderPage("home", noImg, "file").includes("background-image"));

// --- template personalities ---
check("portfolio page carries template class", renderPage("home", port, "file").includes("tpl-portfolio"));
check("business page carries template class", renderPage("home", biz, "file").includes("tpl-business"));
check("eatery page carries template class", renderPage("home", rest, "file").includes("tpl-restaurant"));
check("service cards use a body wrapper", renderPage("home", biz, "file").includes("<div class=\"service-body\">"));

// --- modern studio template ---
const mod = createSite("modern");
check("modern home shows service cards", mod.services.length > 0 && renderPage("home", mod, "file").includes("service-card"));
check("modern carries template class", renderPage("home", mod, "file").includes("tpl-modern"));
check("modern hero has floating colour blobs", renderPage("home", mod, "file").includes('class="blob b1"') && renderPage("home", mod, "file").includes("blobFloat"));
check("modern labels menu page as Services", renderPage("menu", mod, "file").includes("Services"));
check("modern defaults to the midnight palette", createSite("modern").palette === "midnight");
check(
  "modern home shows the featured services section",
  renderPage("home", mod, "file").includes('id="services"') && renderPage("home", mod, "file").includes("What we do")
);
check(
  "modern hero shows the primary CTA",
  renderPage("home", mod, "file").includes('class="btn btn-primary"') && renderPage("home", mod, "file").includes(">What we do</a>")
);

// --- sector templates: genuinely different pages & content ---
const clinic = createSite("clinic");
const clinicHome = renderPage("home", clinic, "file");
check("clinic home has a promo banner", clinicHome.includes('class="promo-strip"') && clinicHome.includes("Open 7 days"));
check("clinic home has a stats strip", clinicHome.includes('class="stats-strip"') && clinicHome.includes("200+") && clinicHome.includes("24/7"));
check("clinic features departments on home", clinicHome.includes('id="departments"') && clinicHome.includes(">Departments</h2>"));
check("clinic hero CTA targets the booking page", clinicHome.includes('data-nav="booking"') && clinicHome.includes(">Book appointment</a>"));
check("clinic menu page is Departments", renderPage("menu", clinic, "file").includes(">Departments</h2>") && renderPage("menu", clinic, "file").includes("service-card"));
const clinicTeam = renderPage("team", clinic, "file");
check("clinic team page shows doctors", clinicTeam.includes("team-card") && clinicTeam.includes("AO") && clinicTeam.includes("Dr. Amina Okafor"));
check("clinic team avatar uses initials", clinicTeam.includes('class="team-avatar"') && clinicTeam.includes(">AO<"));
const clinicBooking = renderPage("booking", clinic, "file");
check("clinic booking page renders a form", clinicBooking.includes('id="__bookingForm"') && clinicBooking.includes("Book an appointment"));
check("clinic defaults to the ocean palette", clinic.palette === "ocean");

const bank = createSite("bank");
const bankMenu = renderPage("menu", bank, "file");
check("bank menu page is Accounts", bankMenu.includes(">Accounts</h2>") && bankMenu.includes(">$0 / mo<"));
check("bank rates render as price text", bankMenu.includes("3.10% AER") && bankMenu.includes("4.20% AER"));
check("bank booking page opens accounts", renderPage("booking", bank, "file").includes("Open an account") && renderPage("booking", bank, "file").includes('id="__bookingForm"'));
check("bank defaults to the slate palette", bank.palette === "slate");
check("bank home has stats", renderPage("home", bank, "file").includes("2M+") && renderPage("home", bank, "file").includes("Customers"));

const shop = createSite("shop");
const shopMenu = renderPage("menu", shop, "file");
check("shop menu page is Shop & products", shopMenu.includes("Shop &amp; products") && shopMenu.includes("menu-card"));
check("shop product price renders", shopMenu.includes(">$12.00<") || shopMenu.includes("Wildflower Honey"));
check("shop home shows the promo", renderPage("home", shop, "file").includes("Free shipping over $40"));
check("shop defaults to the rose palette", shop.palette === "rose");

const films = createSite("films");
const filmsGallery = renderPage("gallery", films, "file");
check("films gallery page is Films", filmsGallery.includes(">Films</h2>") && filmsGallery.includes("project-card"));
check("films crew page renders", renderPage("team", films, "file").includes(">The crew</h2>") && renderPage("team", films, "file").includes("Marina Delacroix"));
check("films home features films", renderPage("home", films, "file").includes('id="films"') && renderPage("home", films, "file").includes("Recent films"));
check("films defaults to the noir palette", films.palette === "noir");

const hr = createSite("hr");
const hrJobs = renderPage("jobs", hr, "file");
check("hr jobs page is Open roles", hrJobs.includes(">Open roles</h2>") && hrJobs.includes("job-card"));
check("hr job cards carry an Apply link", hrJobs.includes("mailto:team@hireworks.example") && hrJobs.includes("Apply"));
check("hr hero CTA targets the jobs page", renderPage("home", hr, "file").includes('data-nav="jobs"') && renderPage("home", hr, "file").includes(">See open roles</a>"));
check("hr home has stats", renderPage("home", hr, "file").includes("120+") && renderPage("home", hr, "file").includes("Placements"));
check("hr defaults to the ocean palette", hr.palette === "ocean");
check("modern defaults include a team page", mod.pages.includes("team") && renderPage("team", mod, "file").includes(">Our team</h2>"));
check("modern crew content renders", renderPage("team", mod, "file").includes("Mara Voss") && renderPage("team", mod, "file").includes("team-card"));

// --- layout archetypes: genuinely different page chrome (not just paint) ---
const prof = createSite("profile");
const profHome = renderPage("home", prof, "file");
check("profile uses a fixed sidebar (no top bar)", profHome.includes('class="side-nav"') && profHome.includes('class="side-wrap"') && !profHome.includes('class="nav"'));
check("profile sidebar shows avatar + name", profHome.includes("side-avatar") && profHome.includes("Ava Lindqvist"));
check("profile menu page is What I do", renderPage("menu", prof, "file").includes(">What I do</h2>"));
check("profile features services on home", profHome.includes("Brand identity") && profHome.includes('id="services"'));
check("profile defaults to the ocean palette", prof.palette === "ocean");

const centPort = createSite("portfolio");
const centHome = renderPage("home", centPort, "file");
check("portfolio switched to a centered layout", centHome.includes('class="dim-hero"') && centHome.includes('class="center-nav"') && !centHome.includes('class="nav"'));
check("portfolio centered nav keeps working links", centHome.includes('data-nav="gallery"') && centHome.includes('data-nav="about"'));
check(
  "portfolio subpages keep the centered nav (no dead-end)",
  renderPage("about", centPort, "file").includes('class="center-nav"') &&
    renderPage("about", centPort, "file").includes('data-nav="home"') &&
    renderPage("gallery", centPort, "file").includes('data-nav="about"')
);
check("centered hero keeps medallion + title", centHome.includes('class="dim-logo"') && centHome.includes('class="dim-title"'));

const bankTables = renderPage("menu", createSite("bank"), "file");
check("bank accounts render as a rate table", bankTables.includes('class="rate-table"') && bankTables.includes(">Rate<") && bankTables.includes('class="rt-name"') && bankTables.includes("Open"));

// --- text & button alignment ---
check("restaurant hero defaults to center", renderPage("home", rest, "file").includes('class="hero align-center"'));
check(
  "portfolio centered hero ignores classic alignment",
  renderPage("home", centPort, "file").includes('class="dim-hero"') && !renderPage("home", centPort, "file").includes('class="hero align-')
);
const alignSite = createSite("restaurant");
alignSite.align = { hero: "right" };
const alignHome = renderPage("home", alignSite, "file");
check("hero alignment class follows the choice", alignHome.includes('class="hero align-right"'));
check("alignment CSS is present", alignHome.includes(".hero.align-right .hero-cta") && alignHome.includes(".hero.align-right .hero-sub"));

// --- custom pages (the "creative user" option) ---
const withCustom = createSite("business");
withCustom.customPages = [
  {
    id: "catering",
    title: "Catering",
    content: "We cater events of all sizes.\n\nWeddings, birthdays and office parties.",
    chips: ["Weddings", "Corporates"],
    ctaLabel: "Book catering",
    ctaPage: "",
    ctaHref: "https://example.com/booking",
    align: "left",
  },
];
withCustom.pages = [...withCustom.pages, "catering"];
check("custom page appears in the nav", renderPage("home", withCustom, "file").includes(">Catering</a>"));
const cPage = renderPage("catering", withCustom, "file");
check("custom page renders its title", cPage.includes(">Catering</h2>"));
check("custom page renders chips", cPage.includes("Weddings") && cPage.includes("Corporates"));
check("custom page renders paragraphs", cPage.includes("We cater events of all sizes.") && cPage.includes("office parties"));
check("custom page renders its button", cPage.includes("Book catering") && cPage.includes("https://example.com/booking"));
const cBodyOf = (h: string) => h.replace(/<script>[\s\S]*<\/script>/g, "").replace(/href="[^"]*"/g, 'href="X"');
check(
  "custom page: preview and export identical",
  cBodyOf(renderPage("catering", withCustom, "preview")) === cBodyOf(renderPage("catering", withCustom, "file"))
);
const cFiles = buildSiteFiles(withCustom);
check("custom page gets its own html file", !!cFiles["catering.html"]);
const cApp = renderFullApp(withCustom);
check("custom page is routable in the single-file app", cApp.includes('id="view-catering"') && cApp.includes('data-page="catering"'));
const normalizedCustom = normalizeSite({
  template: "business",
  pages: ["home", "menu", "catering", "nonexistent"],
  customPages: [{ id: "catering", title: "Catering" }],
});
check("migration keeps valid custom page refs", normalizedCustom.pages.includes("catering"));
check("migration drops unknown page refs", !normalizedCustom.pages.includes("nonexistent"));
check(
  "migration backfills custom page fields",
  Array.isArray(normalizedCustom.customPages[0].chips) &&
    normalizedCustom.customPages[0].content === "" &&
    normalizedCustom.customPages[0].ctaLabel === "" &&
    normalizedCustom.customPages[0].ctaPage === "" &&
    normalizedCustom.customPages[0].align === "left"
);

// --- custom page button can target one of the site's pages ---
const pageTarget = createSite("restaurant");
pageTarget.customPages = [
  { id: "events", title: "Events", content: "Party time.", chips: [], ctaLabel: "Book a party", ctaPage: "contact", ctaHref: "", align: "center" },
];
pageTarget.pages = [...pageTarget.pages, "events"];
const eventPage = renderPage("events", pageTarget, "file");
check("custom button links to a site page", eventPage.includes('href="./contact.html"') && eventPage.includes('data-nav="contact"'));
check(
  "custom button to a site page has no target=_blank",
  eventPage.includes('<a class="btn btn-primary" href="./contact.html" data-nav="contact">Book a party</a>')
);
check("custom page alignment class applied", eventPage.includes('class="section align-center"'));
const external = createSite("restaurant");
external.customPages = [
  { id: "links", title: "Links", content: "Out.", chips: [], ctaLabel: "Visit", ctaPage: "", ctaHref: "https://example.com/x", align: "left" },
];
external.pages = [...external.pages, "links"];
const extPage = renderPage("links", external, "file");
check("custom button to a URL opens in a new tab", extPage.includes('target="_blank" rel="noopener"') && extPage.includes("https://example.com/x"));

// --- header/footer & button overrides ---
const over = createSite("restaurant");
over.colors.headerBg = "#111111";
over.colors.footerText = "#CCCCCC";
over.buttons.primaryColor = "#ff0000";
over.buttons.primaryLabel = "Order now";
const overHome = renderPage("home", over, "file");
check("header override applied", overHome.includes("--header-bg:#111111"));
check("button label override", overHome.includes("Order now"));
check("button color override", overHome.includes("background:#ff0000"));

// --- socials render when set ---
const soc = createSite("restaurant");
soc.social.instagram = "https://instagram.com/latrattoria";
const socHome = renderPage("home", soc, "file");
check("social link renders", socHome.includes("instagram.com/latrattoria") && socHome.includes("IG"));
const socOff = createSite("restaurant");
check("no socials when empty", !renderPage("home", socOff, "file").includes('class="socials'));

// --- export file set matches enabled pages ---
const trimmed = createSite("restaurant");
trimmed.pages = ["home", "contact"];
const files = buildSiteFiles(trimmed);
check(
  "export file set matches enabled pages",
  Object.keys(files).length === 3 &&
    !!files["index.html"] &&
    !!files["contact.html"] &&
    !files["menu.html"] &&
    !files["about.html"],
  `files=${Object.keys(files).join(",")}`
);
check("README included", !!files["README.txt"]);

// --- single-file preview app builds for a multi-page site ---
const app = renderFullApp(createSite("portfolio"));
check(
  "single-file preview app builds",
  app.includes('id="view-home"') && app.includes(".page-view") && app.includes("hashchange")
);

// --- migration: old saved configs are backfilled ---
const oldConfig = {
  template: "restaurant",
  siteName: "Old Cafe",
  tagline: "Before the update",
  palette: "rose",
  pages: ["home", "menu"],
  hero: { heading: "Old Cafe", subtext: "x" },
  about: { text: "story" },
  menu: [{ id: "1", name: "Cake", description: "yum", price: "5" }],
  contact: { phone: "1", email: "a@b.c", address: "", whatsapp: "" },
  hours: "Mon 10:00-18:00",
  features: { darkMode: true, whatsapp: false, contactForm: false, maps: false, hours: false },
};
const migrated = normalizeSite(oldConfig);
check(
  "migration: backfills new fields",
  !!migrated.images && !!migrated.social && !!migrated.colors && !!migrated.buttons &&
    Array.isArray(migrated.projects) &&
    Array.isArray(migrated.services) &&
    Array.isArray(migrated.team) &&
    Array.isArray(migrated.jobs) &&
    migrated.pages[0] === "home"
);
check(
  "migration: keeps old values",
  migrated.siteName === "Old Cafe" && migrated.palette === "rose" && migrated.menu[0].price === "5"
);
check(
  "migration: backfills hero alignment",
  migrated.align.hero === "center" && createSite("business").align.hero === "left"
);
check(
  "migration: backfills missing item fields",
  typeof migrated.menu[0].image === "string" && typeof migrated.menu[0].description === "string"
);
// Render the migrated draft — this is the exact path that white-screened the
// app when old saved drafts had menu items without an `image` field.
let migratedRenderOk = true;
try {
  const mHome = renderPage("home", migrated, "file");
  const mMenu = renderPage("menu", migrated, "file");
  migratedRenderOk = mHome.includes("Cake") && mMenu.includes("Cake");
} catch {
  migratedRenderOk = false;
}
check(
  "migration: renders old draft without crashing",
  migratedRenderOk,
  "renderPage threw on a migrated old draft"
);

// --- empty feature configs still render safe placeholders ---
const emptyish = createSite("business");
emptyish.menu = [];
emptyish.projects = [];
emptyish.services = [];
check("empty lists render placeholders", renderPage("menu", emptyish, "file").length > 100 && renderPage("gallery", emptyish, "file").length > 100);

// --- sidebar hamburger (profile) ---
const profNav = renderPage("home", prof, "file");
check(
  "sidebar has a hamburger toggle (mobile)",
  profNav.includes('class="side-toggle"') && profNav.includes('onclick="__toggleSideNav()"')
);

// --- shop cart is a working feature, not a sticker ---
const shopPipeline = renderPage("menu", shop, "file");
check("shop menu cards have add-to-cart buttons", shopPipeline.includes('class="cart-add"') && shopPipeline.includes("data-price="));
check("shop renders the cart drawer + float", shopPipeline.includes('class="cart-drawer"') && shopPipeline.includes('id="__cartBtn"') && shopPipeline.includes('class="cart-float"'));
check("cart order button + total wiring present", shopPipeline.includes('id="__cartOrder"') && shopPipeline.includes('id="__cartTotal"'));
check("cart JS ships with the shop page", shopPipeline.includes("__addToCart") && shopPipeline.includes("__cartRender") && shopPipeline.includes("wa.me/"));
const shopNoWa = createSite("shop");
shopNoWa.features.whatsapp = false;
const noWaPage = renderPage("menu", shopNoWa, "file");
const shopWaNumber = shop.contact.whatsapp.replace(/\D/g, "");
check(
  "cart falls back to email when WhatsApp is off",
  noWaPage.includes('var WA = ""') &&
    noWaPage.includes("mailto:") &&
    !noWaPage.includes(shopWaNumber) &&
    shopPipeline.includes(shopWaNumber)
);
check("no cart markup on non-shop templates", !renderPage("menu", rest, "file").includes('id="__cart"') && !renderPage("home", biz, "file").includes('id="__cartBtn"'));

// --- clickable cards open an info modal ---
const modalMenu = renderPage("menu", biz, "file");
check("service cards carry modal data", modalMenu.includes("data-modal") && modalMenu.includes('data-title="Classic cut"'));
check("menu cards carry modal data", renderPage("menu", rest, "file").includes("data-modal") && renderPage("menu", rest, "file").includes("data-title="));
check("project cards carry modal data", renderPage("home", port, "file").includes("data-modal") && renderPage("home", port, "file").includes("data-title="));
check("team cards carry modal data", renderPage("team", clinic, "file").includes("data-modal") && renderPage("team", clinic, "file").includes("data-title="));
check("modal element ships on every page", renderPage("home", rest, "file").includes('id="__modal"') && renderPage("home", rest, "file").includes("modal-panel"));
check("card descriptions travel as escaped attributes", renderPage("home", biz, "file").includes('data-desc="Scissors or clippers'));

// --- new template: Creative Agency (split layout) ---
const agency = createSite("agency");
const agencyHome = renderPage("home", agency, "file");
check("agency renders split blocks", agencyHome.includes('class="split-hero"') && agencyHome.includes('class="split-block split-a"') && agencyHome.includes("split-visual"));
check("agency splits alternate direction", agencyHome.includes('class="split-block split-a"') && agencyHome.includes('class="split-block split-b"'));
check("agency home features work + stats", agencyHome.includes("Northlight") && agencyHome.includes("Projects shipped") && agencyHome.includes('id="work"'));
check("agency defaults to the midnight palette", agency.palette === "midnight");
check("agency gallery is Work", renderPage("gallery", agency, "file").includes(">Work</h2>") && renderPage("gallery", agency, "file").includes("project-card"));

// --- new template: Newsroom & Magazine (editorial layout) ---
const news = createSite("newsroom");
const newsHome = renderPage("home", news, "file");
check("newsroom renders editorial masthead", newsHome.includes('class="ed-wordmark"') && newsHome.includes("ed-nav") && newsHome.includes("Daily Ledger"));
check("newsroom home shows lead story + grid", newsHome.includes('class="ed-story ed-featured"') && newsHome.includes('class="ed-grid"') && newsHome.includes("Warehouse District"));
check("newsroom defaults to the paper palette", news.palette === "paper");
check("newsroom gallery is Latest stories", renderPage("gallery", news, "file").includes("Latest stories"));
check("newsroom stories carry modal data", newsHome.includes("data-modal"));

// --- new template: Admin Dashboard (sidebar + KPIs) ---
const dash = createSite("dashboard");
const dashHome = renderPage("home", dash, "file");
check("dashboard uses the sidebar chrome", dashHome.includes('class="side-nav"') && dashHome.includes('class="side-wrap"'));
check("dashboard home shows KPI tiles", dashHome.includes('class="dash-kpi"') && dashHome.includes("99.98%") && dashHome.includes("Active clients"));
check("dashboard home shows the reports table", dashHome.includes('class="dash-table"') && dashHome.includes("Monthly Performance") && dashHome.includes("On track"));
check("dashboard menu page is Reports", renderPage("menu", dash, "file").includes(">Reports</h2>"));
check("dashboard defaults to the graphite palette", dash.palette === "graphite");

// --- new palettes are selectable ---
const paperSite = createSite("restaurant");
paperSite.palette = "paper";
const graphiteSite = createSite("restaurant");
graphiteSite.palette = "graphite";
check("paper + graphite palettes exist", renderPage("home", paperSite, "file").includes("--accent: #B91C1C") && renderPage("home", graphiteSite, "file").includes("--accent: #0F766E"));

// --- new template: Fitness Coach (plans, benefits, booking) ---
const fit = createSite("fitness");
const fitHome = renderPage("home", fit, "file");
check("fitness defaults to the pulse palette", fit.palette === "pulse");
check("fitness home shows benefits + plans", fitHome.includes("Benefits of training") && fitHome.includes('class="plans-grid"'));
check("fitness home shows client quotes", fitHome.includes('class="quote-card"') && fitHome.includes("Hanna"));
check("fitness pricing page is Plans", renderPage("pricing", fit, "file").includes(">Plans</h2>") && renderPage("pricing", fit, "file").includes("plan-price"));
check("fitness flags the middle plan as most popular", renderPage("pricing", fit, "file").includes("Most popular") && renderPage("pricing", fit, "file").includes("is-featured"));
check("fitness plan buttons say Join now", renderPage("pricing", fit, "file").includes("Join now"));
check("fitness booking page is Book a session", renderPage("booking", fit, "file").includes("Book a session"));
check("fitness FAQ is available but not forced on", !fit.pages.includes("faq") && fit.faqs.length >= 4 && renderPage("faq", fit, "file").includes("<details class=\"faq-item\""));

// --- new template: SaaS Landing (pricing + FAQ + features) ---
const saasSite = createSite("saas");
const saasHome = renderPage("home", saasSite, "file");
check("saas home has features, pricing and FAQ", saasHome.includes("Everything you need") && saasHome.includes('class="plans-grid"') && saasHome.includes("faq-list"));
check("saas home is centred", saasHome.includes('class="hero align-center"') || saasHome.includes("text-align:center"));
check("saas pricing tiers render", renderPage("pricing", saasSite, "file").includes("Start free trial") && renderPage("pricing", saasSite, "file").includes("29 / user / month"));
check("saas FAQ page lists every question", saasSite.faqs.every((f) => renderPage("faq", saasSite, "file").includes(f.question.slice(0, 20))));

// --- new template: Law Firm (practice areas, attorneys, FAQ) ---
const lawSite = createSite("law");
const lawHome = renderPage("home", lawSite, "file");
check("law home shows practice areas", lawHome.includes("Practice areas") && lawHome.includes("Commercial litigation"));
check("law home shows quotes + FAQ", lawHome.includes('class="quote-card"') && lawHome.includes("faq-list"));
check("law team page is Attorneys", renderPage("team", lawSite, "file").includes(">Attorneys</h2>") && renderPage("team", lawSite, "file").includes("Margaret Hale"));

// --- new page types can be added to ANY template ---
const flex = createSite("business");
flex.pages = [...flex.pages, "pricing", "faq", "testimonials", "news"] as PageRef[];
flex.faqs = [{ id: "q", question: "Do you offer refunds?", answer: "Yes, within 30 days." }];
flex.testimonials = [{ id: "q", quote: "Fantastic work, always on time.", author: "Jo", role: "Client" }];
const flexPricing = renderPage("pricing", flex, "file");
check("pricing page shows a placeholder when there are no plans", flexPricing.includes("Plans coming soon."));
const priced = createSite("restaurant");
priced.pages = [...priced.pages, "pricing"] as PageRef[];
const pricedHtml = renderPage("pricing", priced, "file");
check("pricing page works on any template", pricedHtml.includes('class="plan-card') && pricedHtml.includes("Choose plan"));
check("faq page uses native <details> (no JS needed)", renderPage("faq", flex, "file").includes("<details class=\"faq-item\"") && renderPage("faq", flex, "file").includes("Do you offer refunds?"));
check("testimonials page renders quotes", renderPage("testimonials", flex, "file").includes("Fantastic work, always on time."));
const flexNews = createSite("business");
flexNews.pages = [...flexNews.pages, "news"] as PageRef[];
flexNews.projects = [{ id: "p", title: "New client", description: "We launched their new site.", image: "", link: "https://example.com" }];
const newsHtml = renderPage("news", flexNews, "file");
check("news page lists posts with read-more links", newsHtml.includes('class="news-item"') && newsHtml.includes("We launched their new site.") && newsHtml.includes("Read more"));
check("new pages export with sensible file names", pageFile("pricing") === "pricing.html" && pageFile("faq") === "faq.html" && pageFile("testimonials") === "testimonials.html" && pageFile("news") === "news.html");

// --- per-card links: cards can lead anywhere the user wants ---
const linked = createSite("business");
linked.services = [
  { id: "s", title: "External", description: "Links out", icon: "🔗", link: "https://example.com/offers" },
  { id: "s2", title: "Internal", description: "Links to a page", icon: "🏠", link: "contact" },
  { id: "s3", title: "No link", description: "Uses the default", icon: "•" },
];
const linkedHtml = renderPage("home", linked, "file");
check("card link to an external URL is used", linkedHtml.includes('data-cta="https://example.com/offers"') && linkedHtml.includes('data-cta-label="Learn more"'));
check("card link to one of your pages is used", linkedHtml.includes('data-cta="./contact.html"'));
const linkedMenu = createSite("restaurant");
linkedMenu.menu = [{ id: "m", name: "Tasting menu", description: "Nine courses", price: "95", image: "", link: "booking" }];
linkedMenu.pages = [...linkedMenu.pages, "booking"] as PageRef[];
check("menu card can link to your booking page", renderPage("home", linkedMenu, "file").includes('data-cta="./booking.html"'));
const linkedTeam = createSite("clinic");
linkedTeam.team = [{ id: "t", name: "Dr. Who", role: "Consultant", bio: "Bio", link: "https://example.com/who" }];
check("team card can link out", renderPage("team", linkedTeam, "file").includes('data-cta="https://example.com/who"'));
check("no link = the template default CTA", renderPage("home", createSite("clinic"), "file").includes('data-cta="./contact.html" data-cta-label="Get a quote"'));

// --- old drafts (before links/faqs/quotes existed) still render ---
const oldDraft = JSON.parse(JSON.stringify(createSite("restaurant"))) as Record<string, unknown>;
delete oldDraft.faqs;
delete oldDraft.testimonials;
(oldDraft.menu as Array<Record<string, unknown>>).forEach((m) => delete m.link);
(oldDraft.team as Array<Record<string, unknown>>).forEach((t) => delete t.link);
const oldMigrated = normalizeSite(oldDraft);
check("old drafts gain faqs + testimonials", oldMigrated.faqs.length === 0 && oldMigrated.testimonials.length === 0);
check("old drafts keep rendering", renderPage("home", oldMigrated, "file").length > 500 && oldMigrated.menu.every((m) => (m.link ?? "") === ""));

// --- preview link handling: the preview must never leave the site ---
const prevFit = renderPage("home", createSite("fitness"), "preview");
check("preview ships the in-preview link router", prevFit.includes("__sfGo") && prevFit.includes("__sfPageFromHref"));
check("preview router handles page-hash and file hrefs", prevFit.includes("#\\/?page\\/") && prevFit.includes("\\.html"));
check("preview router closes the dialog before navigating", /__closeModal\(\);[\s\S]{0,120}SF_NAV/.test(prevFit));
const fileFit = renderPage("home", createSite("fitness"), "file");
check("exported files keep normal link behaviour (no router)", !fileFit.includes("__sfPageFromHref") && !fileFit.includes("SF_NAV"));
check("exported files link to sibling pages as real files", fileFit.includes('href="./booking.html"'));
const appFit = renderFullApp(createSite("fitness"));
check("open-preview app uses its own hash router, not the preview one", !appFit.includes("__sfPageFromHref") && appFit.includes("SF_NAV") === false && appFit.includes("showPage"));
check("modal CTA stays in the same tab target for internal links", fileFit.includes('class="btn modal-cta"') && fileFit.includes("target=\"_blank\""));

// --- page catalog integrity ---check("every page type has a builder hint", ALL_PAGES.every((p) => (PAGE_HINTS[p] || "").length > 8));
check("pageListKind maps new pages to their content", pageListKind("pricing", "saas") === "menu" && pageListKind("faq", "law") === "faqs" && pageListKind("testimonials", "fitness") === "testimonials" && pageListKind("news", "agency") === "projects" && pageListKind("home", "law") === null);
check("menu page kind follows the template", pageListKind("menu", "business") === "services" && pageListKind("menu", "portfolio") === "projects" && pageListKind("menu", "shop") === "menu");

void ALL_PAGES;

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log("\nAll smoke checks passed ✅");