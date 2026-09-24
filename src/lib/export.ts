import JSZip from "jszip";
import type { SiteConfig } from "./types";
import { buildSiteFiles, slugify } from "./render";

/**
 * Fully client-side export: turn the SiteConfig into a .zip of static
 * HTML pages and download it. No server, no storage, no cost.
 */
export async function exportSite(site: SiteConfig): Promise<string> {
  const zip = new JSZip();
  const files = buildSiteFiles(site);
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(site.siteName || "site")}-site.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return a.download;
}