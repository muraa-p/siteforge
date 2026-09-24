import type { PaletteId } from "./types";

/**
 * Every palette ships a light and a dark variant. Dark mode on the generated
 * site simply swaps these token sets via the `data-theme` attribute — no
 * per-feature theming logic anywhere.
 */
export interface ThemeTokens {
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentText: string;
  heroBg: string;
}

export interface Palette {
  id: PaletteId;
  name: string;
  light: ThemeTokens;
  dark: ThemeTokens;
}

export const PALETTES: Palette[] = [
  {
    id: "ember",
    name: "Ember",
    light: {
      bg: "#FDF9F5",
      surface: "#FFFFFF",
      surface2: "#F6EDE4",
      text: "#221A15",
      muted: "#75655A",
      border: "#EADFD3",
      accent: "#C2410C",
      accentText: "#FFFFFF",
      heroBg: "#F6E8DA",
    },
    dark: {
      bg: "#15100C",
      surface: "#1E1712",
      surface2: "#2A2018",
      text: "#F6EDE5",
      muted: "#A89485",
      border: "#33281F",
      accent: "#F97316",
      accentText: "#1A0F06",
      heroBg: "#20140C",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    light: {
      bg: "#F6F9FF",
      surface: "#FFFFFF",
      surface2: "#E8EEFB",
      text: "#151A26",
      muted: "#5B6579",
      border: "#DCE3F2",
      accent: "#1D4ED8",
      accentText: "#FFFFFF",
      heroBg: "#E2EAFB",
    },
    dark: {
      bg: "#0B1020",
      surface: "#12192E",
      surface2: "#1A233E",
      text: "#E9EEFB",
      muted: "#8F9CBF",
      border: "#27304D",
      accent: "#60A5FA",
      accentText: "#0B1424",
      heroBg: "#0F1830",
    },
  },
  {
    id: "forest",
    name: "Forest",
    light: {
      bg: "#F6FAF7",
      surface: "#FFFFFF",
      surface2: "#E6F0E9",
      text: "#14201A",
      muted: "#52645A",
      border: "#D5E3DA",
      accent: "#166534",
      accentText: "#FFFFFF",
      heroBg: "#DDEDE2",
    },
    dark: {
      bg: "#0C1410",
      surface: "#13201A",
      surface2: "#1B2C23",
      text: "#E8F2EC",
      muted: "#879F92",
      border: "#27392F",
      accent: "#4ADE80",
      accentText: "#0C1A11",
      heroBg: "#0F1C15",
    },
  },
  {
    id: "rose",
    name: "Rose",
    light: {
      bg: "#FFF7FA",
      surface: "#FFFFFF",
      surface2: "#FAE7F0",
      text: "#23111B",
      muted: "#6F4E5E",
      border: "#F0D4E0",
      accent: "#BE185D",
      accentText: "#FFFFFF",
      heroBg: "#F8DFEB",
    },
    dark: {
      bg: "#180B12",
      surface: "#22111B",
      surface2: "#2C1722",
      text: "#FBEFF5",
      muted: "#B18A9C",
      border: "#3A202E",
      accent: "#F472B6",
      accentText: "#200913",
      heroBg: "#200D17",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    light: {
      bg: "#F8F8FC",
      surface: "#FFFFFF",
      surface2: "#ECE7FA",
      text: "#17172B",
      muted: "#5B5B7C",
      border: "#DBD9EE",
      accent: "#4338CA",
      accentText: "#FFFFFF",
      heroBg: "#E5E2F6",
    },
    dark: {
      bg: "#0D0D1B",
      surface: "#14142B",
      surface2: "#1C1C3B",
      text: "#EAEAF9",
      muted: "#8D8DB6",
      border: "#272747",
      accent: "#6366F1",
      accentText: "#0F0F22",
      heroBg: "#111126",
    },
  },
  {
    id: "slate",
    name: "Slate",
    light: {
      bg: "#F4F6FA",
      surface: "#FFFFFF",
      surface2: "#E9EDF4",
      text: "#12202E",
      muted: "#5C6B7A",
      border: "#DCE3EC",
      accent: "#1B5B9C",
      accentText: "#FFFFFF",
      heroBg: "#E1EAF4",
    },
    dark: {
      bg: "#0C1522",
      surface: "#131E2E",
      surface2: "#1C2A3D",
      text: "#E9F0F7",
      muted: "#8B9BAE",
      border: "#27384C",
      accent: "#4E8CC9",
      accentText: "#0A1118",
      heroBg: "#101C2B",
    },
  },
  {
    id: "noir",
    name: "Noir",
    light: {
      bg: "#FAF8F4",
      surface: "#FFFFFF",
      surface2: "#F1ECE2",
      text: "#191512",
      muted: "#6F665C",
      border: "#E7E0D3",
      accent: "#B0261D",
      accentText: "#FFFFFF",
      heroBg: "#EFE7DA",
    },
    dark: {
      bg: "#141110",
      surface: "#1C1816",
      surface2: "#27211D",
      text: "#F3ECE3",
      muted: "#AA9E8F",
      border: "#372F28",
      accent: "#E2552F",
      accentText: "#140B07",
      heroBg: "#191412",
    },
  },
  {
    id: "paper",
    name: "Paper & Ink",
    light: {
      bg: "#FAF7F0",
      surface: "#FFFFFF",
      surface2: "#F1EADB",
      text: "#1C1917",
      muted: "#6E6557",
      border: "#DCD2BE",
      accent: "#B91C1C",
      accentText: "#FFFFFF",
      heroBg: "#F0E7D3",
    },
    dark: {
      bg: "#171410",
      surface: "#201C16",
      surface2: "#2A241B",
      text: "#F2EBDF",
      muted: "#A99C84",
      border: "#3A3325",
      accent: "#E05252",
      accentText: "#160C0C",
      heroBg: "#1D1812",
    },
  },
  {
    id: "graphite",
    name: "Graphite",
    light: {
      bg: "#F2F4F7",
      surface: "#FFFFFF",
      surface2: "#E9EDF2",
      text: "#131A24",
      muted: "#5C6878",
      border: "#DCE2EA",
      accent: "#0F766E",
      accentText: "#FFFFFF",
      heroBg: "#E3E9EF",
    },
    dark: {
      bg: "#0E141B",
      surface: "#151D26",
      surface2: "#1D2733",
      text: "#E6EEF6",
      muted: "#8FA0B2",
      border: "#2A3644",
      accent: "#2DD4A7",
      accentText: "#08211B",
      heroBg: "#121A23",
    },
  },
  {
    id: "pulse",
    name: "Pulse",
    light: {
      bg: "#F5F6F3",
      surface: "#FFFFFF",
      surface2: "#E9ECE3",
      text: "#14180F",
      muted: "#5D6552",
      border: "#D8DDCE",
      accent: "#5B8C0A",
      accentText: "#FFFFFF",
      heroBg: "#E9EFDC",
    },
    dark: {
      bg: "#0E100C",
      surface: "#171A13",
      surface2: "#212619",
      text: "#EFF3E8",
      muted: "#9BA48D",
      border: "#2E3423",
      accent: "#A3E635",
      accentText: "#101507",
      heroBg: "#131610",
    },
  },
];

export function getPalette(id: PaletteId): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}