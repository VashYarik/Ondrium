# Ondrium Web — Repository Guide

Place this file at the repository root. Every agent working in this repo reads it first.

---

## What this repo is

The public Ondrium website (`ondrium.com`) and the client preview mockups hosted under it.

Two kinds of content live here:

| Path | What it is |
|---|---|
| `/` | Ondrium's marketing site. Real content, real business. |
| `/preview/<client>/` | Pitch mockups for prospective clients. Fake data, no backend. |

Preview mockups exist to win engagements. They are shown live, in a room, in front of the prospect they are named after. **A demo that breaks mid-pitch is worse than no demo.** Every rule below follows from that.

---

## Stack

**Plain HTML, CSS, and JavaScript. No framework. No build step. No package manager.**

Open a file in a browser and it works. That is a feature, not a limitation — it means nothing can break between writing and presenting.

Do not introduce React, Vue, Svelte, Tailwind, a bundler, a CSS preprocessor, or a `package.json` without explicit approval. If a task seems to require one, stop and ask.

---

## Hard rules

### No backend

No servers, no databases, no API routes, no serverless functions, no authentication. Everything is static files served as-is.

If a task appears to need a backend, stop and raise it rather than improvising one.

### No external CDN dependencies

**Every asset must be served from this repo.** No `<script src="https://cdn...">`, no Google Fonts link, no remote CSS.

Reason: these pages get presented on client wifi, hotel wifi, and phone hotspots. A CDN that fails to load takes the demo down in front of the prospect. Vendor any library you genuinely need into the repo and commit it.

Prefer no library at all. Most of what these pages do is achievable with plain JS.

### No secrets, ever

No API keys, tokens, connection strings, or credentials in any file. This repo is public.

### No tracking or analytics

Not without explicit approval. No Google Analytics, no pixels, no third-party scripts.

### No browser storage in demos

No `localStorage` or `sessionStorage` for demo state.

**Demos must reset to a known state on every page load.** Persisted state means a screen shows leftovers from the last time it was clicked through — an uploaded photo from yesterday's rehearsal appearing during a live pitch. Keep state in JavaScript variables that die on refresh.

---

## Client preview mockups

Rules specific to anything under `/preview/`:

**Fake data must be plausible and obviously not real.** Invented names, invented addresses, invented phone numbers. Never a real person's details, never a real customer of the client, never scraped data. If the prospect recognizes a name, that is a problem.

**Match the client's visual language, not Ondrium's.** A preview should read as *their* system. Ondrium branding belongs on the marketing site, not inside a mockup of the client's product.

**Every screen must be directly linkable.** Its own URL, reachable without clicking through the others. During a pitch you jump straight to the screen that answers the question just asked.

**Must work at 1280×800 and on a phone.** Laptop projected to a screen, or handed across a table. Both happen.

**Fast.** No spinners waiting on real work, because there is no real work. Any delay shown is deliberate and scripted.

---

## Conventions

```
/                          Ondrium marketing site
/assets/                   Shared images, fonts, icons
/preview/<client>/         One directory per client mockup
  index.html               That client's landing page
  <screen>.html            One file per screen
  styles.css               Client-specific styles, self-contained
  app.js                   Client-specific behavior
```

- Lowercase, hyphen-separated filenames: `ai-estimate.html`, not `aiEstimate.html`
- One CSS file per preview directory. Do not leak Ondrium's site styles into a client mockup or vice versa.
- Relative paths throughout, so pages work when opened directly from disk.

---

## Deployment

Currently Vercel. Migration to Azure Static Web Apps is planned — see `ondrium-azure-migration-brief.md`.

Because of that migration:

- **Nothing platform-specific.** No `vercel.json` rewrites, no Vercel serverless functions, no platform-specific redirect config. Anything that only works on one host becomes a migration blocker.
- Plain static files with relative links port cleanly to any host. Keep it that way.

---

## Definition of done

Before reporting a task complete:

- [ ] Opens and works correctly from a plain `file://` URL, no server needed
- [ ] Works at 1280×800 and at phone width
- [ ] No console errors
- [ ] No external network requests — check the Network tab, it should show only this repo's files
- [ ] No secrets, no analytics, no `package.json`
- [ ] Refreshing any page returns it to its initial state
- [ ] Every new page is reachable by direct URL

---

## When to stop and ask

- A task seems to need a backend, a database, or a build step
- A task seems to need an npm package or a CDN library
- A task requires real client data
- Requirements conflict with anything in this file

Stopping to ask is always correct. Improvising around a rule here is not.
