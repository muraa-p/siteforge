import { useState } from "react";
import type {
  CustomPage,
  FaqItem,
  JobItem,
  MenuItem,
  PageId,
  PageRef,
  ProjectItem,
  ServiceItem,
  SiteConfig,
  SocialKey,
  TeamItem,
  TemplateId,
} from "../lib/types";
import { ALL_PAGES, FEATURE_META, isBuiltInPage, PAGE_HINTS, SOCIAL_META } from "../lib/types";
import { PALETTES } from "../lib/palettes";
import { TEMPLATE_ORDER, templateMeta, pageLabel } from "../lib/templates";
import { createSite } from "../lib/sample";
import { slugify, pageListKind } from "../lib/render";
import { Section, Field, TextInput, TextArea, Switch, ImageField, ColorField, Segmented } from "./ui";

export type SiteUpdater = Partial<SiteConfig> | ((prev: SiteConfig) => SiteConfig);

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export function Controls({
  site,
  setSite,
}: {
  site: SiteConfig;
  setSite: (updater: SiteUpdater) => void;
}) {
  const update = (u: SiteUpdater) => setSite(u);

  function switchTemplate(id: TemplateId) {
    if (id === site.template) return;
    const keep = window.confirm(
      "Switch template? The template's page content (menu / services / work / departments / team / roles) and the About text will be replaced. Your name, theme, colors, images, socials, contact details and any pages you created are kept."
    );
    if (!keep) return;
    const next = createSite(id);
    const customRefs = site.pages.filter((p) => !isBuiltInPage(p));
    update(() => ({
      ...next,
      siteName: site.siteName.trim() ? site.siteName : next.siteName,
      tagline: site.tagline.trim() ? site.tagline : next.tagline,
      palette: site.palette,
      align: site.align,
      social: site.social,
      images: site.images,
      colors: site.colors,
      buttons: site.buttons,
      contact: site.contact,
      customPages: site.customPages,
      pages: [...next.pages, ...customRefs],
    }));
  }

  return (
    <div className="sidebar-scroll">
      <TemplatePicker site={site} onSelect={switchTemplate} />
      <SiteIdentity site={site} update={update} />
      <PalettePicker site={site} update={update} />
      <HeaderFooterColors site={site} update={update} />
      <ImagesPanel site={site} update={update} />
      <PagesPanel site={site} update={update} />
      <FeaturesPanel site={site} update={update} />
      <ContentPanel site={site} update={update} />
      <SocialPanel site={site} update={update} />
      <ContactPanel site={site} update={update} />
      <ButtonsPanel site={site} update={update} />
    </div>
  );
}

/* ------------------------------------------------ Templates */

function TemplatePicker({
  site,
  onSelect,
}: {
  site: SiteConfig;
  onSelect: (id: TemplateId) => void;
}) {
  const meta = templateMeta(site.template);
  return (
    <Section title="0 · Template" sub="Choose the look of your site.">
      <div className="field">
        <select
          className="input select"
          value={site.template}
          aria-label="Template"
          onChange={(e) => onSelect(e.target.value as TemplateId)}
        >
          {TEMPLATE_ORDER.map((id) => {
            const m = templateMeta(id);
            return (
              <option key={id} value={id}>
                {m.icon}  {m.name}
              </option>
            );
          })}
        </select>
        <span className="field-hint">{meta.blurb}</span>
      </div>
    </Section>
  );
}

/* ------------------------------------------------ Site identity */

function SiteIdentity({
  site,
  update,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
}) {
  return (
    <Section title="1 · Name, slogan & text" sub="What your visitors read.">
      <Field label="Site name">
        <TextInput
          value={site.siteName}
          placeholder="e.g. La Trattoria"
          onChange={(siteName) => update({ siteName })}
        />
      </Field>
      <Field label="Slogan / tagline" hint="One line under your name, everywhere.">
        <TextInput
          value={site.tagline}
          placeholder="e.g. Honest Italian cooking, fresh every day."
          onChange={(tagline) => update({ tagline })}
        />
      </Field>
      <Field label="Homepage headline">
        <TextInput
          value={site.hero.heading}
          onChange={(heading) => update((p) => ({ ...p, hero: { ...p.hero, heading } }))}
        />
      </Field>
      <Field label="Homepage intro">
        <TextArea
          rows={3}
          value={site.hero.subtext}
          onChange={(subtext) => update((p) => ({ ...p, hero: { ...p.hero, subtext } }))}
        />
      </Field>
      <Field label="Your story (on the About page)" hint="Separate paragraphs with a blank line.">
        <TextArea
          rows={5}
          value={site.about.text}
          onChange={(text) => update((prev) => ({ ...prev, about: { text } }))}
        />
      </Field>
      <Segmented
        label="Homepage headline, intro & buttons"
        value={site.align.hero}
        options={[
          { value: "left", label: "Left", icon: "⬅", title: "Align left" },
          { value: "center", label: "Center", icon: "↔", title: "Align center" },
          { value: "right", label: "Right", icon: "➡", title: "Align right" },
        ]}
        onChange={(v) => update((p) => ({ ...p, align: { ...p.align, hero: v } }))}
      />
    </Section>
  );
}

/* ------------------------------------------------ Color theme */

function getAccent(site: SiteConfig) {
  return PALETTES.find((p) => p.id === site.palette)?.light.accent ?? "#C2410C";
}

function PalettePicker({
  site,
  update,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
}) {
  return (
    <Section title="2 · Color theme" sub="Pick a mood. Dark mode works in every theme.">
      <div className="palette-grid">
        {PALETTES.map((p) => {
          const active = site.palette === p.id;
          return (
            <button
              key={p.id}
              className={`palette-card${active ? " active" : ""}`}
              onClick={() => update({ palette: p.id })}
              title={p.name}
            >
              <span className="palette-swatches">
                <i style={{ background: p.light.accent }} />
                <i style={{ background: p.light.bg, border: "1px solid rgba(0,0,0,0.08)" }} />
                <i style={{ background: p.dark.bg, border: "1px solid rgba(255,255,255,0.12)" }} />
              </span>
              <span className="palette-name">{p.name}</span>
              {active && <span className="palette-check">✓</span>}
            </button>
          );
        })}
      </div>
      <div className="theme-demo" aria-hidden="true">
        <span style={{ background: getAccent(site) }} className="demo-chip" />
        <span className="demo-text">See it live in the preview →</span>
      </div>
    </Section>
  );
}

/* ------------------------------------------------ Header & footer colors */

function HeaderFooterColors({
  site,
  update,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
}) {
  const setColor = (key: keyof SiteConfig["colors"]) => (v: string) =>
    update((prev) => ({ ...prev, colors: { ...prev.colors, [key]: v } }));
  return (
    <Section title="3 · Header & footer colors" sub="Leave empty to follow the theme.">
      <ColorField label="Header background" value={site.colors.headerBg} onChange={setColor("headerBg")} />
      <ColorField label="Header text" value={site.colors.headerText} onChange={setColor("headerText")} />
      <ColorField label="Footer background" value={site.colors.footerBg} onChange={setColor("footerBg")} />
      <ColorField label="Footer text" value={site.colors.footerText} onChange={setColor("footerText")} />
    </Section>
  );
}

/* ------------------------------------------------ Images */

function ImagesPanel({
  site,
  update,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
}) {
  const setImage = (key: keyof SiteConfig["images"]) => (v: string) =>
    update((prev) => ({ ...prev, images: { ...prev.images, [key]: v } }));
  return (
    <Section title="4 · Images" sub="Optional. Uploads are compressed automatically.">
      <ImageField
        label="Homepage background image"
        hint="Cover photo behind your headline. Leave empty for a clean color."
        value={site.images.heroBg}
        onChange={setImage("heroBg")}
      />
      <ImageField
        label="About-page photo"
        hint="A photo next to your story — e.g. of your place or you."
        value={site.images.about}
        onChange={setImage("about")}
      />
    </Section>
  );
}

/* ------------------------------------------------ Pages */

function PagesPanel({
  site,
  update,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const customPages = site.customPages;

  function refLabel(ref: PageRef): string {
    if (isBuiltInPage(ref)) return pageLabel(site.template, ref);
    return customPages.find((c) => c.id === ref)?.title.trim() || "Page";
  }

  function movePage(from: number, to: number) {
    update((prev) => {
      const pages = [...prev.pages];
      const [moved] = pages.splice(from, 1);
      pages.splice(to, 0, moved);
      return { ...prev, pages };
    });
  }

  function toggleBuiltIn(id: PageId, on: boolean) {
    update((prev) => {
      const pages = on ? [...prev.pages, id] : prev.pages.filter((p) => p !== id);
      return { ...prev, pages };
    });
  }

  function createPage() {
    const title = newTitle.trim();
    if (!title) return;
    let slug = slugify(title);
    const taken = new Set(customPages.map((c) => c.id));
    const base = slug;
    let n = 2;
    while (taken.has(slug)) slug = `${base}-${n++}`;
    const page: CustomPage = { id: slug, title, content: "", chips: [], ctaLabel: "", ctaPage: "", ctaHref: "", align: "left" };
    update((prev) => ({
      ...prev,
      customPages: [...prev.customPages, page],
      pages: [...prev.pages, slug],
    }));
    setNewTitle("");
    setShowNew(false);
  }

  function patchCustom(id: string, patch: Partial<CustomPage>) {
    update((prev) => ({
      ...prev,
      customPages: prev.customPages.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }

  function removeCustom(id: string) {
    update((prev) => ({
      ...prev,
      customPages: prev.customPages.filter((c) => c.id !== id),
      pages: prev.pages.filter((p) => p !== id),
    }));
  }

  const disabledBuiltIns = ALL_PAGES.filter((p) => p !== "home" && !site.pages.includes(p));

  return (
    <Section title="5 · Pages" sub="Drag to reorder. Home is always first.">
      <ul className="pages-list">
        {site.pages.map((ref, idx) => {
          const builtIn = isBuiltInPage(ref);
          const locked = ref === "home";
          return (
            <li
              key={ref}
              className={`page-row${dragIdx === idx ? " dragging" : ""}${locked ? " locked" : ""}`}
              draggable={!locked}
              onDragStart={(e) => {
                if (locked) {
                  e.preventDefault();
                  return;
                }
                setDragIdx(idx);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIdx === null || dragIdx === idx || dragIdx === 0) return;
                movePage(dragIdx, idx);
                setDragIdx(null);
              }}
              onDragEnd={() => setDragIdx(null)}
            >
              <span className="drag-handle" aria-hidden="true">
                {locked ? "·" : "⠿"}
              </span>
              {builtIn ? (
                <input
                  type="checkbox"
                  checked={true}
                  disabled={locked}
                  onChange={(e) => toggleBuiltIn(ref as PageId, e.target.checked)}
                />
              ) : (
                <span className="page-badge" title="Your custom page">
                  ✎
                </span>
              )}
              <span className="page-label">{refLabel(ref)}</span>
              {locked && <span className="page-note">always on</span>}
            </li>
          );
        })}
      </ul>

      {disabledBuiltIns.length > 0 && (
        <div className="add-pages">
          <span className="add-pages-label">Add a page:</span>
          {disabledBuiltIns.map((id) => (
            <button
              key={id}
              className="btn btn-mini"
              title={PAGE_HINTS[id]}
              onClick={() => toggleBuiltIn(id, true)}
            >
              + {pageLabel(site.template, id)}
            </button>
          ))}
        </div>
      )}

      {showNew ? (
        <div className="new-page-form">
          <input
            className="input"
            autoFocus
            placeholder="Page name — e.g. Catering, Gallery, Team…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createPage();
              if (e.key === "Escape") {
                setShowNew(false);
                setNewTitle("");
              }
            }}
          />
          <div className="new-page-actions">
            <button className="btn btn-mini btn-mini-primary" onClick={createPage}>
              Create page
            </button>
            <button
              className="btn btn-mini"
              onClick={() => {
                setShowNew(false);
                setNewTitle("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn-outline btn-block" onClick={() => setShowNew(true)}>
          ＋ New page…
        </button>
      )}

      {customPages.length > 0 && (
        <div className="stack custom-pages">
          <p className="custom-pages-head">✎ Edit your pages</p>
          {customPages.map((c) => {
            const targetMode =
              c.ctaPage && site.pages.includes(c.ctaPage) ? c.ctaPage : "__custom__";
            const pageTargets = site.pages.filter((p) => p !== c.id);
            return (
              <div key={c.id} className="custom-page-card">
                <Field label="Page name">
                  <TextInput value={c.title} placeholder="Page name" onChange={(title) => patchCustom(c.id, { title })} />
                </Field>
                <Field label="Content" hint="Separate paragraphs with a blank line.">
                  <TextArea rows={3} value={c.content} onChange={(content) => patchCustom(c.id, { content })} />
                </Field>
                <Field label="Feature chips" hint="One short phrase per line — e.g. Fast, Friendly, Free quote.">
                  <TextArea
                    rows={2}
                    value={c.chips.join("\n")}
                    onChange={(v) => patchCustom(c.id, { chips: v.split("\n") })}
                  />
                </Field>
                <Segmented
                  label="Text alignment on this page"
                  value={c.align}
                  options={[
                    { value: "left", label: "Left", icon: "⬅", title: "Align left" },
                    { value: "center", label: "Center", icon: "↔", title: "Align center" },
                    { value: "right", label: "Right", icon: "➡", title: "Align right" },
                  ]}
                  onChange={(v) => patchCustom(c.id, { align: v })}
                />
                <Field label="Button label" hint="Leave empty for no button on this page.">
                  <TextInput
                    value={c.ctaLabel}
                    placeholder="e.g. Book a table"
                    onChange={(ctaLabel) => patchCustom(c.id, { ctaLabel })}
                  />
                </Field>
                <Field label="Button goes to">
                  <select
                    className="input select"
                    value={targetMode}
                    disabled={!c.ctaLabel.trim()}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__custom__") patchCustom(c.id, { ctaPage: "" });
                      else patchCustom(c.id, { ctaPage: v, ctaHref: "" });
                    }}
                  >
                    {pageTargets.map((ref) => (
                      <option key={ref} value={ref}>
                        {refLabel(ref)}
                      </option>
                    ))}
                    <option value="__custom__">Link…</option>
                  </select>
                </Field>
                {targetMode === "__custom__" && (
                  <input
                    className="input"
                    placeholder="https://… or email@address"
                    value={c.ctaHref}
                    disabled={!c.ctaLabel.trim()}
                    onChange={(e) => patchCustom(c.id, { ctaHref: e.target.value })}
                  />
                )}
                <button className="btn btn-mini btn-danger" onClick={() => removeCustom(c.id)}>
                  ✕ Delete this page
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

/* ------------------------------------------------ Features */

function FeaturesPanel({
  site,
  update,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
}) {
  return (
    <Section title="6 · Features" sub="Things that make your site feel real.">
      <div className="stack">
        {FEATURE_META.map((f) => (
          <Switch
            key={f.key}
            icon={f.icon}
            label={f.label}
            sub={f.sub}
            checked={site.features[f.key]}
            onChange={(v) =>
              update((prev) => ({ ...prev, features: { ...prev.features, [f.key]: v } }))
            }
          />
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------ Template content (menu/services/work/team/jobs) */

/**
 * The content editors a site needs: whatever its template ships with, plus
 * whatever the user's chosen pages require (add a Pricing page and the plan
 * editor appears; add a News page and the posts editor appears).
 */
function ContentPanel({
  site,
  update,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
}) {
  const t = site.template;
  const needs = new Set<string>();
  // What the template shows out of the box.
  if (t === "portfolio" || t === "films" || t === "agency" || t === "newsroom") needs.add("projects");
  if (["business", "modern", "clinic", "profile", "dashboard", "fitness", "saas", "law"].includes(t))
    needs.add("services");
  if (["restaurant", "shop", "bank", "dashboard", "fitness", "saas"].includes(t)) needs.add("menu");
  if (["clinic", "films", "modern", "dashboard", "fitness", "law"].includes(t)) needs.add("team");
  if (t === "hr") needs.add("jobs");
  // What the user's pages need.
  for (const ref of site.pages) {
    if (!isBuiltInPage(ref)) continue;
    const kind = pageListKind(ref, t);
    if (kind) needs.add(kind);
  }

  const parts: React.ReactNode[] = [];
  let num = 7;
  if (needs.has("menu"))
    parts.push(<MenuPanel key="menu" site={site} update={update} num={num++} />);
  if (needs.has("services"))
    parts.push(<ServicesPanel key="services" site={site} update={update} num={num++} />);
  if (needs.has("projects"))
    parts.push(<ProjectsPanel key="projects" site={site} update={update} num={num++} />);
  if (needs.has("team")) parts.push(<TeamPanel key="team" site={site} update={update} num={num++} />);
  if (needs.has("jobs")) parts.push(<JobsPanel key="jobs" site={site} update={update} num={num++} />);
  if (needs.has("faqs")) parts.push(<FaqsPanel key="faqs" site={site} update={update} num={num++} />);
  if (needs.has("testimonials"))
    parts.push(<TestimonialsPanel key="testimonials" site={site} update={update} num={num++} />);
  return <>{parts}</>;
}

/**
 * "Where does this card's button go?" — pick any page of this site or type an
 * external URL. Empty means "use the template's default" (e.g. Book this).
 */
function CardLinkField({
  value,
  site,
  onChange,
  label = "Button link",
}: {
  value: string | undefined;
  site: SiteConfig;
  onChange: (v: string) => void;
  label?: string;
}) {
  const v = (value || "").trim();
  const isPage = site.pages.includes(v);
  return (
    <Field
      label={label}
      hint="Optional. Pick a page of your site, or type any link — leave empty for the default."
    >
      <div className="stack">
        <select
          className="input select"
          value={isPage ? v : v ? "__url__" : ""}
          onChange={(e) => onChange(e.target.value === "__url__" ? "" : e.target.value)}
        >
          <option value="">No link (use default)</option>
          {site.pages.map((ref) => (
            <option key={ref} value={ref}>
              {isBuiltInPage(ref)
                ? pageLabel(site.template, ref)
                : site.customPages.find((c) => c.id === ref)?.title || ref}
            </option>
          ))}
          <option value="__url__">Custom link…</option>
        </select>
        {!isPage && v ? (
          <input
            className="input"
            placeholder="https://… or mailto:…"
            value={v}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : null}
      </div>
    </Field>
  );
}

function FaqsPanel({
  site,
  update,
  num,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
  num: number;
}) {
  function setItem(id: string, patch: Partial<FaqItem>) {
    update((prev) => ({ ...prev, faqs: prev.faqs.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
  }
  return (
    <Section title={`${num} · ${pageLabel(site.template, "faq")}`} sub="The questions you get asked most.">
      <div className="stack menu-edit">
        {site.faqs.map((f) => (
          <div key={f.id} className="menu-edit-card">
            <div className="menu-edit-row">
              <input
                className="input"
                value={f.question}
                placeholder="Question"
                onChange={(e) => setItem(f.id, { question: e.target.value })}
              />
              <button
                className="icon-btn"
                title="Remove question"
                aria-label={`Remove ${f.question || "question"}`}
                onClick={() => update((prev) => ({ ...prev, faqs: prev.faqs.filter((x) => x.id !== f.id) }))}
              >
                ✕
              </button>
            </div>
            <textarea
              className="input textarea"
              rows={2}
              value={f.answer}
              placeholder="Your answer"
              onChange={(e) => setItem(f.id, { answer: e.target.value })}
            />
          </div>
        ))}
        {site.faqs.length === 0 && <p className="empty-note">No questions yet — add the first one below.</p>}
        <button
          className="btn btn-outline btn-block"
          onClick={() =>
            update((prev) => ({
              ...prev,
              faqs: [...prev.faqs, { id: newId(), question: "New question?", answer: "" }],
            }))
          }
        >
          + Add question
        </button>
      </div>
    </Section>
  );
}

function TestimonialsPanel({
  site,
  update,
  num,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
  num: number;
}) {
  function setItem(id: string, patch: Partial<SiteConfig["testimonials"][number]>) {
    update((prev) => ({
      ...prev,
      testimonials: prev.testimonials.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }
  return (
    <Section
      title={`${num} · ${pageLabel(site.template, "testimonials")}`}
      sub="What clients say — shown as quotes."
    >
      <div className="stack menu-edit">
        {site.testimonials.map((t) => (
          <div key={t.id} className="menu-edit-card">
            <textarea
              className="input textarea"
              rows={2}
              value={t.quote}
              placeholder="Their words"
              onChange={(e) => setItem(t.id, { quote: e.target.value })}
            />
            <div className="menu-edit-row">
              <input
                className="input"
                value={t.author}
                placeholder="Who said it"
                onChange={(e) => setItem(t.id, { author: e.target.value })}
              />
              <input
                className="input"
                value={t.role}
                placeholder="Context (optional)"
                onChange={(e) => setItem(t.id, { role: e.target.value })}
              />
              <button
                className="icon-btn"
                title="Remove quote"
                aria-label={`Remove quote by ${t.author || "client"}`}
                onClick={() =>
                  update((prev) => ({ ...prev, testimonials: prev.testimonials.filter((x) => x.id !== t.id) }))
                }
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {site.testimonials.length === 0 && <p className="empty-note">No quotes yet — add the first one below.</p>}
        <button
          className="btn btn-outline btn-block"
          onClick={() =>
            update((prev) => ({
              ...prev,
              testimonials: [...prev.testimonials, { id: newId(), quote: "", author: "", role: "" }],
            }))
          }
        >
          + Add quote
        </button>
      </div>
    </Section>
  );
}

function MenuPanel({
  site,
  update,
  num,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
  num: number;
}) {
  function setItem(id: string, patch: Partial<MenuItem>) {
    update((prev) => ({
      ...prev,
      menu: prev.menu.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }
  function removeItem(id: string) {
    update((prev) => ({ ...prev, menu: prev.menu.filter((m) => m.id !== id) }));
  }
  function addItem() {
    update((prev) => ({
      ...prev,
      menu: [...prev.menu, { id: newId(), name: "New dish", description: "", price: "", image: "", link: "" }],
    }));
  }
  const listPage: PageId = site.pages.includes("pricing") ? "pricing" : "menu";
  return (
    <Section
      title={`${num} · ${pageLabel(site.template, listPage)}`}
      sub={
        listPage === "pricing"
          ? "Plans, packages or tiers — the price goes in the price box."
          : site.template === "bank"
            ? "Accounts & cards — put the rate or fee in the price."
            : site.template === "shop"
              ? "Products & prices — a photo makes the card pop."
              : "Dishes, prices and photos."
      }
    >
      <div className="stack menu-edit">
        {site.menu.map((m) => (
          <div key={m.id} className="menu-edit-card">
            <ImageField label={`Photo · ${m.name || "dish"}`} value={m.image} onChange={(image) => setItem(m.id, { image })} />
            <div className="menu-edit-row">
              <input
                className="input"
                value={m.name}
                placeholder="Dish name"
                onChange={(e) => setItem(m.id, { name: e.target.value })}
              />
              <input
                className="input input-price"
                value={m.price}
                placeholder="12.50"
                inputMode="decimal"
                onChange={(e) => setItem(m.id, { price: e.target.value })}
              />
              <button
                className="icon-btn"
                title="Remove dish"
                aria-label={`Remove ${m.name || "dish"}`}
                onClick={() => removeItem(m.id)}
              >
                ✕
              </button>
            </div>
            <textarea
              className="input textarea"
              rows={2}
              value={m.description}
              placeholder="Short description"
              onChange={(e) => setItem(m.id, { description: e.target.value })}
            />
            <CardLinkField value={m.link} site={site} onChange={(link) => setItem(m.id, { link })} />
          </div>
        ))}
        {site.menu.length === 0 && (
          <p className="empty-note">
            {listPage === "pricing"
              ? "No plans yet — add your first one below."
              : site.template === "bank"
                ? "No accounts yet — add your first one below."
                : site.template === "shop"
                  ? "No products yet — add your first one below."
                  : "No dishes yet — add your first one below."}
          </p>
        )}
        <button className="btn btn-outline btn-block" onClick={addItem}>
          + Add{" "}
          {listPage === "pricing"
            ? "plan"
            : site.template === "bank"
              ? "account"
              : site.template === "shop"
                ? "product"
                : "dish"}
        </button>
      </div>
    </Section>
  );
}

function ProjectsPanel({
  site,
  update,
  num,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
  num: number;
}) {
  function setItem(id: string, patch: Partial<ProjectItem>) {
    update((prev) => ({
      ...prev,
      projects: prev.projects.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }
  function removeItem(id: string) {
    update((prev) => ({ ...prev, projects: prev.projects.filter((m) => m.id !== id) }));
  }
  function addItem() {
    update((prev) => ({
      ...prev,
      projects: [...prev.projects, { id: newId(), title: "New project", description: "", image: "", link: "" }],
    }));
  }
  return (
    <Section
      title={`${num} · ${pageLabel(site.template, "gallery")}`}
      sub={
        site.template === "films"
          ? "Films, short films and brand work — a poster photo makes the card."
          : "What you want to show off."
      }
    >
      <div className="stack menu-edit">
        {site.projects.map((m) => (
          <div key={m.id} className="menu-edit-card">
            <ImageField label={`Photo · ${m.title || "project"}`} value={m.image} onChange={(image) => setItem(m.id, { image })} />
            <div className="menu-edit-row">
              <input
                className="input"
                value={m.title}
                placeholder="Project title"
                onChange={(e) => setItem(m.id, { title: e.target.value })}
              />
              <button
                className="icon-btn"
                title="Remove project"
                aria-label={`Remove ${m.title || "project"}`}
                onClick={() => removeItem(m.id)}
              >
                ✕
              </button>
            </div>
            <textarea
              className="input textarea"
              rows={2}
              value={m.description}
              placeholder="Short description"
              onChange={(e) => setItem(m.id, { description: e.target.value })}
            />
            <input
              className="input"
              value={m.link}
              placeholder="Link (optional) — https://…"
              onChange={(e) => setItem(m.id, { link: e.target.value })}
            />
          </div>
        ))}
        {site.projects.length === 0 && <p className="empty-note">No projects yet — add one below.</p>}
        <button className="btn btn-outline btn-block" onClick={addItem}>
          + Add project
        </button>
      </div>
    </Section>
  );
}

function ServicesPanel({
  site,
  update,
  num,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
  num: number;
}) {
  function setItem(id: string, patch: Partial<ServiceItem>) {
    update((prev) => ({
      ...prev,
      services: prev.services.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }
  function removeItem(id: string) {
    update((prev) => ({ ...prev, services: prev.services.filter((m) => m.id !== id) }));
  }
  function addItem() {
    update((prev) => ({
      ...prev,
      services: [...prev.services, { id: newId(), title: "New service", description: "", icon: "✨", link: "" }],
    }));
  }
  const listPage: PageId = site.pages.includes("menu") ? "menu" : "home";
  const heading =
    site.template === "fitness"
      ? "Benefits of training"
      : site.template === "law"
        ? "Practice areas"
        : site.template === "saas"
          ? "Features"
          : pageLabel(site.template, listPage);
  return (
    <Section
      title={`${num} · ${heading}`}
      sub={
        site.template === "clinic"
          ? "Departments patients can book into — add an emoji icon for each."
          : "What you offer — add an emoji icon for each."
      }
    >
      <div className="stack menu-edit">
        {site.services.map((m) => (
          <div key={m.id} className="menu-edit-card">
            <div className="menu-edit-row">
              <input
                className="input input-icon"
                value={m.icon}
                placeholder="✨"
                maxLength={4}
                onChange={(e) => setItem(m.id, { icon: e.target.value })}
              />
              <input
                className="input"
                value={m.title}
                placeholder="Service name"
                onChange={(e) => setItem(m.id, { title: e.target.value })}
              />
              <button
                className="icon-btn"
                title="Remove service"
                aria-label={`Remove ${m.title || "service"}`}
                onClick={() => removeItem(m.id)}
              >
                ✕
              </button>
            </div>
            <textarea
              className="input textarea"
              rows={2}
              value={m.description}
              placeholder="Short description"
              onChange={(e) => setItem(m.id, { description: e.target.value })}
            />
            <CardLinkField value={m.link} site={site} onChange={(link) => setItem(m.id, { link })} />
          </div>
        ))}
        {site.services.length === 0 && <p className="empty-note">No services yet — add one below.</p>}
        <button className="btn btn-outline btn-block" onClick={addItem}>
          + Add service
        </button>
      </div>
    </Section>
  );
}

function TeamPanel({
  site,
  update,
  num,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
  num: number;
}) {
  function setItem(id: string, patch: Partial<TeamItem>) {
    update((prev) => ({
      ...prev,
      team: prev.team.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }
  function removeItem(id: string) {
    update((prev) => ({ ...prev, team: prev.team.filter((m) => m.id !== id) }));
  }
  function addItem() {
    update((prev) => ({
      ...prev,
      team: [...prev.team, { id: newId(), name: "New member", role: "", bio: "", link: "" }],
    }));
  }
  return (
    <Section title={`${num} · ${pageLabel(site.template, "team")}`} sub="Name, role and a short bio.">
      <div className="stack menu-edit">
        {site.team.map((m) => (
          <div key={m.id} className="menu-edit-card">
            <div className="menu-edit-row">
              <input
                className="input"
                value={m.name}
                placeholder="Name — e.g. Dr. Amina Okafor"
                onChange={(e) => setItem(m.id, { name: e.target.value })}
              />
              <button
                className="icon-btn"
                title="Remove member"
                aria-label={`Remove ${m.name || "member"}`}
                onClick={() => removeItem(m.id)}
              >
                ✕
              </button>
            </div>
            <input
              className="input"
              value={m.role}
              placeholder="Role — e.g. Cardiologist · 15 yrs"
              onChange={(e) => setItem(m.id, { role: e.target.value })}
            />
            <textarea
              className="input textarea"
              rows={2}
              value={m.bio}
              placeholder="Short bio"
              onChange={(e) => setItem(m.id, { bio: e.target.value })}
            />
            <CardLinkField value={m.link} site={site} onChange={(link) => setItem(m.id, { link })} />
          </div>
        ))}
        {site.team.length === 0 && <p className="empty-note">No team members yet — add one below.</p>}
        <button className="btn btn-outline btn-block" onClick={addItem}>
          + Add member
        </button>
      </div>
    </Section>
  );
}

function JobsPanel({
  site,
  update,
  num,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
  num: number;
}) {
  function setItem(id: string, patch: Partial<JobItem>) {
    update((prev) => ({
      ...prev,
      jobs: prev.jobs.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }
  function removeItem(id: string) {
    update((prev) => ({ ...prev, jobs: prev.jobs.filter((m) => m.id !== id) }));
  }
  function addItem() {
    update((prev) => ({
      ...prev,
      jobs: [...prev.jobs, { id: newId(), title: "New role", dept: "", location: "", type: "Full-time" }],
    }));
  }
  return (
    <Section title={`${num} · ${pageLabel(site.template, "jobs")}`} sub="Title, department, location and contract type.">
      <div className="stack menu-edit">
        {site.jobs.map((m) => (
          <div key={m.id} className="menu-edit-card">
            <div className="menu-edit-row">
              <input
                className="input"
                value={m.title}
                placeholder="Role title — e.g. Senior Recruiter"
                onChange={(e) => setItem(m.id, { title: e.target.value })}
              />
              <button
                className="icon-btn"
                title="Remove role"
                aria-label={`Remove ${m.title || "role"}`}
                onClick={() => removeItem(m.id)}
              >
                ✕
              </button>
            </div>
            <div className="menu-edit-row">
              <input
                className="input"
                value={m.dept}
                placeholder="Department / company"
                onChange={(e) => setItem(m.id, { dept: e.target.value })}
              />
              <input
                className="input"
                value={m.location}
                placeholder="Location"
                onChange={(e) => setItem(m.id, { location: e.target.value })}
              />
            </div>
            <input
              className="input"
              value={m.type}
              placeholder="Type — Full-time, Part-time, Contract…"
              onChange={(e) => setItem(m.id, { type: e.target.value })}
            />
          </div>
        ))}
        {site.jobs.length === 0 && <p className="empty-note">No roles yet — add one below.</p>}
        <button className="btn btn-outline btn-block" onClick={addItem}>
          + Add role
        </button>
      </div>
    </Section>
  );
}

/* ------------------------------------------------ Social links */

function SocialPanel({
  site,
  update,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
}) {
  const setSocial = (key: SocialKey) => (v: string) =>
    update((prev) => ({ ...prev, social: { ...prev.social, [key]: v } }));
  return (
    <Section title="8 · Social media" sub="Shown in the footer and on the contact page. Leave empty to hide.">
      <div className="stack">
        {SOCIAL_META.map((s) => (
          <Field key={s.key} label={s.label} hint={s.code === "X" ? "Include the full URL." : undefined}>
            <TextInput
              value={site.social[s.key]}
              placeholder={`https://${s.code === "X" ? "x.com/yourname" : s.label.toLowerCase() + ".com/yourname"}`}
              onChange={setSocial(s.key)}
            />
          </Field>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------ Contact */

function ContactPanel({
  site,
  update,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
}) {
  const setContact = (patch: Partial<SiteConfig["contact"]>) =>
    update((prev) => ({ ...prev, contact: { ...prev.contact, ...patch } }));

  return (
    <Section title="9 · Contact details" sub="Shown on the contact page and footer.">
      <div className="stack">
        <Field label="Phone">
          <TextInput
            value={site.contact.phone}
            placeholder="+1 (555) 214-8890"
            onChange={(phone) => setContact({ phone })}
          />
        </Field>
        <Field label="Email">
          <TextInput
            value={site.contact.email}
            placeholder="you@example.com"
            onChange={(email) => setContact({ email })}
          />
        </Field>
        <Field label="Address">
          <TextInput
            value={site.contact.address}
            placeholder="48 Union Street, Springfield"
            onChange={(address) => setContact({ address })}
          />
        </Field>
        <Field
          label="What to show on the map"
          hint="Usually your address. You can type something else if the pin should land elsewhere."
        >
          <TextInput
            value={site.contact.mapsQuery}
            placeholder="Leave empty to use your address"
            onChange={(mapsQuery) => setContact({ mapsQuery })}
          />
        </Field>
        <Field
          label="WhatsApp number"
          hint={site.features.whatsapp && !site.contact.whatsapp.trim() ? "Add this to use the WhatsApp button." : "Digits only — country code included."}
        >
          <TextInput
            value={site.contact.whatsapp}
            placeholder="+1 555 214 8890"
            onChange={(whatsapp) => setContact({ whatsapp })}
          />
        </Field>
        <Field label="Opening hours" hint="One line per day. Shown when the hours feature is on.">
          <TextArea
            rows={4}
            value={site.hours}
            onChange={(hours) => update({ hours })}
          />
        </Field>
      </div>
    </Section>
  );
}

/* ------------------------------------------------ Buttons */

function ButtonsPanel({
  site,
  update,
}: {
  site: SiteConfig;
  update: (u: SiteUpdater) => void;
}) {
  return (
    <Section title="10 · Main button" sub="The big call-to-action on your homepage.">
      <Field label="Button text">
        <TextInput
          value={site.buttons.primaryLabel}
          placeholder={
            site.template === "portfolio"
              ? "See my work"
              : site.template === "business"
                ? "Our services"
                : "View menu"
          }
          onChange={(primaryLabel) => update((p) => ({ ...p, buttons: { ...p.buttons, primaryLabel } }))}
        />
      </Field>
      <ColorField
        label="Button color"
        value={site.buttons.primaryColor}
        onChange={(primaryColor) => update((p) => ({ ...p, buttons: { ...p.buttons, primaryColor } }))}
      />
    </Section>
  );
}