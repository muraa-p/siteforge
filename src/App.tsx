import { useEffect, useState } from "react";
import type { PageRef, SiteConfig } from "./lib/types";
import { createSampleSite, normalizeSite } from "./lib/sample";
import { renderPage, labelFor } from "./lib/render";
import { TopBar } from "./components/TopBar";
import { Controls, type SiteUpdater } from "./components/Controls";
import { Preview } from "./components/Preview";

const STORAGE_KEY = "siteforge:site:v1";

function loadInitial(): SiteConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeSite(JSON.parse(raw));
  } catch {
    /* fall through to a fresh sample site */
  }
  return createSampleSite();
}

export default function App() {
  const [site, setSite] = useState<SiteConfig>(loadInitial);
  const [previewPage, setPreviewPage] = useState<PageRef>("home");

  /** Partial objects are merged (not replaced), functions get the full state. */
  function updateSite(updater: SiteUpdater) {
    setSite((prev) =>
      typeof updater === "function" ? updater(prev) : { ...prev, ...updater }
    );
  }

  // Auto-save to localStorage — refreshing the page never loses work.
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(site));
      } catch {
        /* storage full or unavailable — ignore */
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [site]);

  const enabledPages = site.pages;
  // If the currently previewed page was disabled or a template switch removed
  // it, fall back to the first enabled page instead of showing a stale one.
  const activePage = enabledPages.includes(previewPage) ? previewPage : enabledPages[0];
  const labels: Record<string, string> = {};
  for (const ref of enabledPages) labels[ref] = labelFor(site, ref);
  const previewHtml = renderPage(activePage, site, "preview");

  function handleReset() {
    if (window.confirm("Start a fresh site? Your current design will be replaced.")) {
      setSite(createSampleSite());
      setPreviewPage("home");
    }
  }

  return (
    <div className="app">
      <TopBar site={site} onReset={handleReset} />
      <div className="app-body">
        <aside className="sidebar">
          <Controls site={site} setSite={updateSite} />
        </aside>
        <main className="preview-main">
          <Preview
            html={previewHtml}
            page={activePage}
            enabledPages={enabledPages}
            labels={labels}
            onPage={setPreviewPage}
          />
        </main>
      </div>
    </div>
  );
}