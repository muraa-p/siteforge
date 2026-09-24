import { useRef, useState, type ReactNode } from "react";
import { processImageFile } from "../lib/images";

/* Small friendly UI primitives shared across the builder dashboard. */

export function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <header className="panel-head">
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      className="input"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      className="input textarea"
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Switch({
  checked,
  onChange,
  label,
  sub,
  icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
  icon?: string;
}) {
  return (
    <label className="switch-row">
      <span className="switch-icon">{icon}</span>
      <span className="switch-text">
        <span className="switch-label">{label}</span>
        {sub && <span className="switch-sub">{sub}</span>}
      </span>
      <span className="switch-track">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="switch-thumb" aria-hidden="true" />
      </span>
    </label>
  );
}

/* ---------------- Segmented control (alignment, etc.) ---------------- */

export function Segmented<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label?: string;
  hint?: string;
  value: T;
  options: Array<{ value: T; label: string; icon?: string; title?: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <div className="seg" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`seg-btn${value === o.value ? " active" : ""}`}
            title={o.title ?? o.label}
            onClick={() => onChange(o.value)}
          >
            {o.icon ? <span className="seg-icon">{o.icon}</span> : null}
            {o.label}
          </button>
        ))}
      </div>
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

/* ---------------- Image field (upload or paste a link) ---------------- */

export function ImageField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [url, setUrl] = useState("");

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const result = await processImageFile(file);
      onChange(result.dataUrl);
    } catch {
      window.alert("Could not read that image — try a JPEG or PNG.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function applyUrl() {
    const trimmed = url.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setUrl("");
    setShowUrl(false);
  }

  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <input
        ref={fileRef}
        hidden
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="image-preview">
          <img src={value} alt={label} />
          <div className="image-actions">
            <button
              type="button"
              className="btn btn-mini"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? "Working…" : "Replace"}
            </button>
            <button type="button" className="btn btn-mini" onClick={() => onChange("")}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="image-pick">
          <button
            type="button"
            className="btn btn-mini"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? "Working…" : "Upload image"}
          </button>
          <span className="image-or">or</span>
          {showUrl ? (
            <span className="image-url-row">
              <input
                className="input input-sm"
                placeholder="https://…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyUrl();
                }}
              />
              <button type="button" className="btn btn-mini" onClick={applyUrl}>
                Set
              </button>
            </span>
          ) : (
            <button type="button" className="btn btn-mini" onClick={() => setShowUrl(true)}>
              Use a link
            </button>
          )}
        </div>
      )}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

/* ---------------- Color field (empty = follow the theme) ---------------- */

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const has = value.trim().length > 0;
  return (
    <div className="field color-field">
      <span className="field-label">{label}</span>
      <div className="color-row">
        <span className="color-swatch">
          <input
            type="color"
            value={has ? value : "#ffffff"}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
          />
          <i style={{ background: has ? value : "repeating-conic-gradient(#ccc 0 25%, #fff 0 50%)" }} />
        </span>
        <span className="color-value">{has ? value.toUpperCase() : "follow theme"}</span>
        {has && (
          <button type="button" className="btn btn-mini" onClick={() => onChange("")}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}