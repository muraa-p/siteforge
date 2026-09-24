import { useState } from "react";
import type { SiteConfig } from "../lib/types";
import { exportSite } from "../lib/export";
import { fullPreviewUrl } from "../lib/render";

export function TopBar({
  site,
  onReset,
}: {
  site: SiteConfig;
  onReset: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const name = await exportSite(site);
      window.setTimeout(() => alert(`Your website "${name}" is ready to download 🎉`), 50);
    } catch (err) {
      console.error(err);
      alert("Something went wrong while exporting. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="logo">🛠️</span>
        <span className="logo-text">
          SiteForge
          <span className="logo-sub">website builder</span>
        </span>
      </div>
      <div className="topbar-actions">
        <button className="btn btn-ghost" onClick={onReset} title="Start over with a fresh sample site">
          New site
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => window.open(fullPreviewUrl(site), "_blank")}
          title="Open the full site in a new tab"
        >
          Open preview ↗
        </button>
        <button
          className="btn btn-primary"
          onClick={handleExport}
          disabled={busy}
          title="Download your site as a ZIP of plain HTML files"
        >
          {busy ? "Packing…" : "Download .zip"}
        </button>
      </div>
    </header>
  );
}