import type { Features, PageId, PaletteId, TemplateId, TextAlign } from "./types";

/**
 * One entry per website template. Templates are "feature + layout presets":
 * each one defines which pages it typically uses, how those pages are labelled,
 * and which features are switched on by default. The actual sample *content*
 * lives in sample.ts (keep meta and content separate).
 */
export interface TemplateMeta {
  id: TemplateId;
  /** Short picker name. */
  name: string;
  /** Emoji for the picker card (also used as the site favicon). */
  icon: string;
  /** One-line description shown in the picker. */
  blurb: string;
  defaultPages: PageId[];
  /** Optional page label overrides (e.g. "menu" → "Services"). */
  pageLabels: Partial<Record<PageId, string>>;
  /** Default palette the template starts with. */
  defaultPalette: PaletteId;
  /** Default alignment of the homepage headline, intro and buttons. */
  heroAlign: TextAlign;
  /** Page "chrome" archetype: classic top bar, Dimension-style centered
   * full-screen, Prologue-style fixed sidebar, Story-style split, or
   * Massively-style centred editorial masthead. */
  layout: "topbar" | "centered" | "sidebar" | "split" | "editorial";
  /** Default label for the homepage's main call-to-action. */
  heroPrimary: string;
  /** Homepage featured-section heading. */
  featuredHeading: string;
  /** Optional slogan strip shown above the homepage hero ("banner"). */
  promo?: string;
  /** Optional big-number strip shown on the homepage after the hero. */
  stats?: Array<{ value: string; label: string }>;
  /** Page the hero's main button links to when different from the list page. */
  primaryTarget?: PageId;
  /** Anchor id of the featured section on the homepage. */
  anchor: string;
  featuredCardLabel: string;
  features: Features;
}

export const TEMPLATES: Record<TemplateId, TemplateMeta> = {
  restaurant: {
    id: "restaurant",
    layout: "topbar",
    name: "Eatery & Restaurant",
    icon: "🍽️",
    blurb:
      "Menu, prices, hours and booking — great for restaurants, cafés, bakeries and food trucks.",
    defaultPages: ["home", "about", "menu", "contact"],
    pageLabels: { menu: "Menu" },
    defaultPalette: "ember",
    heroAlign: "center",
    heroPrimary: "View menu",
    featuredHeading: "From our kitchen",
    anchor: "menu",
    featuredCardLabel: "Full menu",
    features: { darkMode: true, whatsapp: true, contactForm: true, maps: true, hours: true },
  },
  portfolio: {
    id: "portfolio",
    layout: "centered",
    name: "Portfolio",
    icon: "🎨",
    blurb: "Show off your work — for designers, photographers, artists and freelancers.",
    defaultPages: ["home", "about", "gallery", "contact"],
    pageLabels: { gallery: "Work" },
    defaultPalette: "ocean",
    heroAlign: "center",
    heroPrimary: "See my work",
    featuredHeading: "Selected work",
    anchor: "gallery",
    featuredCardLabel: "All work",
    features: { darkMode: true, whatsapp: true, contactForm: true, maps: false, hours: false },
  },
  profile: {
    id: "profile",
    layout: "sidebar",
    name: "Profile & Freelancer",
    icon: "👤",
    blurb:
      "A personal site with a fixed sidebar — for freelancers, coaches, consultants and speakers.",
    defaultPages: ["home", "about", "menu", "contact"],
    pageLabels: { menu: "What I do" },
    defaultPalette: "ocean",
    heroAlign: "left",
    heroPrimary: "See my work",
    featuredHeading: "What I do",
    anchor: "services",
    featuredCardLabel: "Everything",
    features: { darkMode: true, whatsapp: false, contactForm: true, maps: false, hours: false },
  },
  business: {
    id: "business",
    layout: "topbar",
    name: "Small Business",
    icon: "🏢",
    blurb:
      "Services, hours and booking — for contractors, salons, studios, shops and professionals.",
    defaultPages: ["home", "about", "menu", "contact"],
    pageLabels: { menu: "Services" },
    defaultPalette: "ember",
    heroAlign: "left",
    heroPrimary: "Our services",
    featuredHeading: "What we do",
    anchor: "services",
    featuredCardLabel: "All services",
    features: { darkMode: true, whatsapp: true, contactForm: true, maps: true, hours: true },
  },
  modern: {
    id: "modern",
    layout: "topbar",
    name: "Modern Studio",
    icon: "✨",
    blurb:
      "Creative studios & agencies — big typography, floating colour shapes and glassy cards.",
    defaultPages: ["home", "about", "menu", "team", "contact"],
    pageLabels: { menu: "Services" },
    defaultPalette: "midnight",
    heroAlign: "center",
    heroPrimary: "What we do",
    featuredHeading: "What we do",
    anchor: "services",
    featuredCardLabel: "All services",
    features: { darkMode: true, whatsapp: false, contactForm: true, maps: true, hours: false },
  },
  clinic: {
    id: "clinic",
    layout: "topbar",
    name: "Clinic & Hospital",
    icon: "🏥",
    blurb:
      "Departments, doctors and online booking — for clinics, hospitals, dental and vet practices.",
    defaultPages: ["home", "about", "menu", "team", "booking", "contact"],
    pageLabels: { menu: "Departments", team: "Our doctors", booking: "Book an appointment" },
    defaultPalette: "ocean",
    heroAlign: "center",
    heroPrimary: "Book appointment",
    primaryTarget: "booking",
    featuredHeading: "Departments",
    anchor: "departments",
    featuredCardLabel: "All departments",
    promo: "☀️ Open 7 days · Walk-ins welcome · On-site lab & pharmacy · Same-day test results",
    stats: [
      { value: "200+", label: "Specialists" },
      { value: "45,000", label: "Patients a year" },
      { value: "24/7", label: "Emergency care" },
      { value: "4.9★", label: "Patient rating" },
    ],
    features: { darkMode: true, whatsapp: true, contactForm: true, maps: true, hours: true },
  },
  bank: {
    id: "bank",
    layout: "topbar",
    name: "Bank & Finance",
    icon: "🏦",
    blurb:
      "Accounts, cards and rates — for banks, credit unions, lenders and finance providers.",
    defaultPages: ["home", "menu", "booking", "about", "contact"],
    pageLabels: { menu: "Accounts", booking: "Open an account" },
    defaultPalette: "slate",
    heroAlign: "left",
    heroPrimary: "Compare accounts",
    featuredHeading: "Accounts & cards",
    anchor: "accounts",
    featuredCardLabel: "All accounts",
    promo: "🏦 FDIC-insured deposits · 24/7 online & app banking · No monthly fees on essentials",
    stats: [
      { value: "2M+", label: "Customers" },
      { value: "250+", label: "ATMs nationwide" },
      { value: "4.7★", label: "App rating" },
      { value: "$0", label: "Monthly fees on essentials" },
    ],
    features: { darkMode: false, whatsapp: false, contactForm: true, maps: true, hours: false },
  },
  shop: {
    id: "shop",
    layout: "topbar",
    name: "Online Shop",
    icon: "🛍️",
    blurb:
      "Product grid, prices and promotions — for boutiques, food stores, makers and e-commerce.",
    defaultPages: ["home", "menu", "about", "contact"],
    pageLabels: { menu: "Shop & products" },
    defaultPalette: "rose",
    heroAlign: "center",
    heroPrimary: "Shop now",
    featuredHeading: "Bestsellers",
    anchor: "shop",
    featuredCardLabel: "Shop all",
    promo: "🚚 Free shipping over $40 · 30-day returns · Pay in 4 interest-free",
    stats: [
      { value: "10,000+", label: "Happy customers" },
      { value: "4.8★", label: "Average rating" },
      { value: "24h", label: "Dispatch time" },
      { value: "365", label: "Day returns" },
    ],
    features: { darkMode: true, whatsapp: true, contactForm: true, maps: false, hours: false },
  },
  films: {
    id: "films",
    layout: "topbar",
    name: "Film & Video Studio",
    icon: "🎬",
    blurb:
      "Films, showreel and crew — for directors, producers, videographers and film companies.",
    defaultPages: ["home", "gallery", "team", "about", "contact"],
    pageLabels: { gallery: "Films", team: "The crew" },
    defaultPalette: "noir",
    heroAlign: "left",
    heroPrimary: "Our films",
    featuredHeading: "Recent films",
    anchor: "films",
    featuredCardLabel: "All films",
    promo: "🏆 12 festival awards · Award-winning directors · Commissions open for 2026",
    stats: [
      { value: "12", label: "Festival awards" },
      { value: "40+", label: "Projects shipped" },
      { value: "9", label: "Countries filmed in" },
      { value: "5★", label: "Client rating" },
    ],
    features: { darkMode: true, whatsapp: false, contactForm: true, maps: false, hours: false },
  },
  hr: {
    id: "hr",
    layout: "topbar",
    name: "HR & Recruitment",
    icon: "💼",
    blurb:
      "Open roles, placement stats and hiring services — for recruitment agencies and HR firms.",
    defaultPages: ["home", "jobs", "about", "contact"],
    pageLabels: { jobs: "Open roles" },
    defaultPalette: "ocean",
    heroAlign: "left",
    heroPrimary: "See open roles",
    primaryTarget: "jobs",
    featuredHeading: "Open positions",
    anchor: "jobs",
    featuredCardLabel: "All roles",
    promo: "💼 4.2/5 employer rating · Work-life balance first · Hybrid roles available",
    stats: [
      { value: "120+", label: "Placements a year" },
      { value: "4.2★", label: "Employer rating" },
      { value: "2wk", label: "Avg. time to hire" },
      { value: "60+", label: "Partner companies" },
    ],
    features: { darkMode: true, whatsapp: true, contactForm: true, maps: true, hours: false },
  },
  agency: {
    id: "agency",
    layout: "split",
    name: "Creative Agency",
    icon: "🚀",
    blurb:
      "Agencies, studios and consultancies — full-screen statements and alternating work blocks.",
    defaultPages: ["home", "gallery", "team", "about", "contact"],
    pageLabels: { gallery: "Work", team: "The team" },
    defaultPalette: "midnight",
    heroAlign: "left",
    heroPrimary: "See our work",
    featuredHeading: "What we do",
    anchor: "work",
    featuredCardLabel: "All work",
    stats: [
      { value: "14", label: "Years making things" },
      { value: "300+", label: "Projects shipped" },
      { value: "12", label: "Awards shortlisted" },
      { value: "96%", label: "Clients who return" },
    ],
    features: { darkMode: true, whatsapp: false, contactForm: true, maps: true, hours: false },
  },
  newsroom: {
    id: "newsroom",
    layout: "editorial",
    name: "Newsroom & Magazine",
    icon: "📰",
    blurb:
      "Editorial sites for magazines, newsrooms and publications — lead story, dense grids, serif headlines.",
    defaultPages: ["home", "gallery", "about", "contact"],
    pageLabels: { gallery: "Latest stories" },
    defaultPalette: "paper",
    heroAlign: "center",
    heroPrimary: "Latest stories",
    featuredHeading: "Latest stories",
    anchor: "stories",
    featuredCardLabel: "All stories",
    features: { darkMode: true, whatsapp: false, contactForm: true, maps: false, hours: false },
  },
  dashboard: {
    id: "dashboard",
    layout: "sidebar",
    name: "Admin Dashboard",
    icon: "📊",
    blurb:
      "Client portals and admin dashboards — KPIs, reports and a compact sidebar.",
    defaultPages: ["home", "menu", "team", "about", "contact"],
    pageLabels: { menu: "Reports", team: "Team & access" },
    defaultPalette: "graphite",
    heroAlign: "left",
    heroPrimary: "View reports",
    featuredHeading: "Modules",
    anchor: "modules",
    featuredCardLabel: "All reports",
    stats: [
      { value: "99.98%", label: "Uptime" },
      { value: "1,204", label: "Active clients" },
      { value: "38", label: "Open tickets" },
      { value: "4.9★", label: "Client rating" },
    ],
    features: { darkMode: true, whatsapp: false, contactForm: true, maps: false, hours: false },
  },
};

export const TEMPLATE_ORDER: TemplateId[] = [
  "restaurant",
  "portfolio",
  "profile",
  "business",
  "modern",
  "clinic",
  "bank",
  "shop",
  "films",
  "hr",
  "agency",
  "newsroom",
  "dashboard",
];

export function templateMeta(id: TemplateId): TemplateMeta {
  return TEMPLATES[id];
}

const DEFAULT_LABELS: Record<PageId, string> = {
  home: "Home",
  about: "About",
  menu: "Menu",
  gallery: "Gallery",
  contact: "Contact",
  team: "Our team",
  booking: "Book now",
  jobs: "Jobs & careers",
};

/** Page label within a specific template (e.g. "menu" → "Menu" / "Services"). */
export function pageLabel(templateId: TemplateId, page: PageId): string {
  return TEMPLATES[templateId].pageLabels[page] ?? DEFAULT_LABELS[page];
}

export function isTemplateId(value: unknown): value is TemplateId {
  return TEMPLATE_ORDER.includes(value as TemplateId);
}