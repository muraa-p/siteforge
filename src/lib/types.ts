// ---------------------------------------------------------------------------
// SiteForge — core data model.
//
// A `SiteConfig` is a plain JSON object that fully describes a website. The
// same object powers (a) the builder dashboard state, (b) the live preview,
// and (c) the exported static site. There is exactly ONE render function that
// turns a SiteConfig into HTML — preview and export are byte-identical.
// ---------------------------------------------------------------------------

export type TemplateId =
  | "restaurant"
  | "portfolio"
  | "profile"
  | "business"
  | "modern"
  | "clinic"
  | "bank"
  | "shop"
  | "films"
  | "hr"
  | "agency"
  | "newsroom"
  | "dashboard";

/** Text alignment choices exposed to users (headlines, buttons, sections). */
export type TextAlign = "left" | "center" | "right";

/** Guard: is this a valid alignment value? */
export function isTextAlign(v: unknown): v is TextAlign {
  return v === "left" || v === "center" || v === "right";
}

export type PageId = "home" | "about" | "menu" | "gallery" | "contact" | "team" | "booking" | "jobs";

/**
 * A page reference: either a built-in page id ("home", "about", …) or the id
 * of a user-created custom page. Custom pages let creative users add pages
 * beyond the fixed set — rename them, write content, pick feature chips and
 * add a button.
 */
export type PageRef = PageId | string;

export function isBuiltInPage(ref: string): ref is PageId {
  return (ALL_PAGES as readonly string[]).includes(ref);
}

export interface CustomPage {
  /** Stable slug used for the file name and links (kept even if renamed). */
  id: string;
  /** Shown in the menu, the page title and the browser tab. */
  title: string;
  /** Free-form paragraphs (separated by blank lines). */
  content: string;
  /** Short feature phrases shown as chips below the title. */
  chips: string[];
  /** Optional call-to-action button. Empty label = no button. */
  ctaLabel: string;
  /** Button target: the id of one of the site's pages. Empty = manual URL below. */
  ctaPage: string;
  /** Manual button URL (used when no page is picked, or for external links). */
  ctaHref: string;
  /** Alignment of this page's title, text, chips and button. */
  align: TextAlign;
}

export type PaletteId = "ember" | "ocean" | "forest" | "rose" | "midnight" | "slate" | "noir" | "paper" | "graphite";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  /** Data URL or web URL; empty = no image. */
  image: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  /** Data URL or web URL; empty = no image. */
  image: string;
  link: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  /** Emoji icon, e.g. "✂️". */
  icon: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  /** Raw number as typed by the user; digits are extracted when rendering. */
  whatsapp: string;
  /** Separate search text for the embedded map. Empty = use the address. */
  mapsQuery: string;
}

export interface Features {
  darkMode: boolean;
  whatsapp: boolean;
  contactForm: boolean;
  maps: boolean;
  hours: boolean;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  linkedin: string;
  tiktok: string;
}

export type SocialKey = keyof SocialLinks;

export interface SiteImages {
  /** Hero background image. Empty = use the palette's hero color. */
  heroBg: string;
  /** Image shown on the About page next to the text. Empty = text only. */
  about: string;
}

export interface SiteColors {
  /** All empty fields fall back to the chosen palette theme. */
  headerBg: string;
  headerText: string;
  footerBg: string;
  footerText: string;
}

export interface SiteButtons {
  /** Label of the main call-to-action on the homepage. Empty = template default. */
  primaryLabel: string;
  /** Background color of that button. Empty = palette accent. */
  primaryColor: string;
}

/** A team member / doctor / crew member shown on the "team" page. */
export interface TeamItem {
  id: string;
  name: string;
  role: string;
  bio: string;
}

/** A job opening shown on the "jobs" page. */
export interface JobItem {
  id: string;
  title: string;
  /** Department / team (e.g. "Cardiology", "Design"). */
  dept: string;
  location: string;
  /** e.g. Full-time, Part-time, Contract, Remote. */
  type: string;
}

export interface SiteConfig {
  template: TemplateId;
  siteName: string;
  tagline: string;
  palette: PaletteId;
  /** Enabled pages, in display order. "home" is always first and required. */
  pages: PageRef[];
  /** User-created pages beyond the built-in set. */
  customPages: CustomPage[];
  hero: {
    heading: string;
    subtext: string;
  };
  /** Text/button alignment overrides. Empty fields mean "follow the template". */
  align: {
    hero: TextAlign;
  };
  about: {
    text: string;
  };
  /** Restaurant template's menu / dishes. */
  menu: MenuItem[];
  /** Portfolio template's projects / work. */
  projects: ProjectItem[];
  /** Business template's services. */
  services: ServiceItem[];
  /** People shown on the team page (doctors, crew, employees…). */
  team: TeamItem[];
  /** Job openings shown on the jobs page (recruitment agency). */
  jobs: JobItem[];
  contact: ContactInfo;
  /** Opening hours, plain text (newlines become line breaks). */
  hours: string;
  features: Features;
  social: SocialLinks;
  images: SiteImages;
  colors: SiteColors;
  buttons: SiteButtons;
}

export const ALL_PAGES: PageId[] = ["home", "about", "menu", "gallery", "contact", "team", "booking", "jobs"];

export const FEATURE_META: Array<{
  key: keyof Features;
  icon: string;
  label: string;
  sub: string;
}> = [
  {
    key: "darkMode",
    icon: "🌙",
    label: "Dark mode",
    sub: "Visitors can switch between light and dark appearance.",
  },
  {
    key: "whatsapp",
    icon: "💬",
    label: "WhatsApp button",
    sub: "A floating chat button that opens WhatsApp on tap.",
  },
  {
    key: "contactForm",
    icon: "✉️",
    label: "Contact form",
    sub: "A message form that sends via the visitor's email app.",
  },
  {
    key: "maps",
    icon: "📍",
    label: "Location map",
    sub: "An embedded Google Map at the bottom of the contact page.",
  },
  {
    key: "hours",
    icon: "🕐",
    label: "Opening hours",
    sub: "Shows your opening hours on the contact page.",
  },
];

/** Friendly copy used on the generated site's feature strip. */
export const FEATURE_STRIP: Record<keyof Features, string> = {
  darkMode: "🌙 Dark mode",
  whatsapp: "💬 WhatsApp",
  contactForm: "✉️ Contact form",
  maps: "📍 Map",
  hours: "🕐 Opening hours",
};

export const SOCIAL_META: Array<{ key: SocialKey; code: string; label: string }> = [
  { key: "facebook", code: "f", label: "Facebook" },
  { key: "instagram", code: "IG", label: "Instagram" },
  { key: "twitter", code: "X", label: "X (Twitter)" },
  { key: "youtube", code: "YT", label: "YouTube" },
  { key: "linkedin", code: "in", label: "LinkedIn" },
  { key: "tiktok", code: "TK", label: "TikTok" },
];