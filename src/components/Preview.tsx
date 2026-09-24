import { useEffect, useRef, useState } from "react";
import type { PageRef } from "../lib/types";

const DEVICES = [
  { id: "desktop", label: "🖥 Desktop", width: "100%" },
  { id: "tablet", label: "📟 Tablet", width: 800 },
  { id: "phone", label: "📱 Phone", width: 400 },
] as const;

type DeviceId = (typeof DEVICES)[number]["id"];

/**
 * The live preview. It renders the exact HTML the export will produce
 * (same render function, mode "preview") inside an iframe. Clicks on the
 * generated site's internal links are intercepted via postMessage so the
 * builder can switch pages without a page reload.
 */
export function Preview({
  html,
  page,
  enabledPages,
  labels,
  onPage,
}: {
  html: string;
  page: PageRef;
  enabledPages: PageRef[];
  labels: Record<string, string>;
  onPage: (p: PageRef) => void;
}) {
  const [device, setDevice] = useState<DeviceId>("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Remember the preview's scroll position across edits so the preview doesn't
  // jump back to the top every time the user tweaks something (e.g. colours).
  const scrollPosRef = useRef(0);

  useEffect(() => {
    scrollPosRef.current = 0;
  }, [page]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data && event.data.type === "SF_NAV") {
        const next = event.data.page as string;
        if (enabledPages.includes(next)) onPage(next);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [enabledPages, onPage]);

  function handleFrameLoad() {
    const frame = iframeRef.current;
    const win = frame?.contentWindow;
    if (!frame || !win) return;
    // Safety net: the preview must always show the generated site. If anything
    // ever navigated the frame to a real URL (an escaped link, a stray hash), it
    // would render a second copy of the builder inside the preview pane — so
    // detect that and put the site back.
    let escaped = false;
    try {
      const href = win.location.href;
      escaped = !/^about:/i.test(href);
    } catch {
      // Cross-origin means it navigated somewhere else entirely.
      escaped = true;
    }
    if (escaped) {
      scrollPosRef.current = 0;
      frame.srcdoc = html;
      return;
    }
    try {
      win.scrollTo(0, scrollPosRef.current);
      win.addEventListener(
        "scroll",
        () => {
          scrollPosRef.current = win.scrollY;
        },
        { passive: true }
      );
    } catch {
      /* cross-origin guard — not expected with srcDoc, but harmless */
    }
  }

  const width = device === "desktop" ? "100%" : DEVICES.find((d) => d.id === device)!.width;

  return (
    <div className="preview-wrap">
      <div className="preview-toolbar">
        <div className="preview-toolbar-left">
          <span className="preview-label">Live preview</span>
          <span className="preview-hint">click the site’s links — they work</span>
        </div>
        <div className="preview-toolbar-right">
          <select
            className="input input-sm select"
            value={page}
            onChange={(e) => onPage(e.target.value as PageRef)}
            aria-label="Preview page"
          >
            {enabledPages.map((p) => (
              <option key={p} value={p}>
                {labels[p]}
              </option>
            ))}
          </select>
          <div className="device-seg">
            {DEVICES.map((d) => (
              <button
                key={d.id}
                className={`device-btn${device === d.id ? " active" : ""}`}
                onClick={() => setDevice(d.id)}
                title={d.label}
              >
                {d.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={`device-frame device-${device}`}>
        <iframe
          ref={iframeRef}
          title="Live preview of your website"
          className="preview-iframe"
          srcDoc={html}
          style={{ width }}
          onLoad={handleFrameLoad}
        />
      </div>
    </div>
  );
}