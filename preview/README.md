# Preview routes

Standalone landing pages served at `/preview/<slug>` for review before they
go anywhere public. Each preview is a **complete, self-contained HTML
document** — it does not share the Ondrium site's markup, CSS, or shell.

## Adding a preview

1. Create a folder named after the slug:

   ```
   preview/<slug>/index.html
   ```

2. Drop the full standalone HTML in as `index.html`. Nothing else to wire up.
   Azure Static Web Apps serves the default document for a folder request, so
   `/preview/<slug>` resolves to `/preview/<slug>/index.html` automatically.

3. Add a row to the table in `preview/index.html` so the preview is listed.

4. Keep `<meta name="robots" content="noindex, nofollow">` in the `<head>`.
   `staticwebapp.config.json` also sends `X-Robots-Tag: noindex, nofollow`
   for everything under `/preview/*`, but the meta tag means the file is still
   protected if it is opened or hosted somewhere else.

## Assets

Self-contained pages (inline CSS/JS, data-URI or CDN images) are preferred —
that is the convention the main `index.html` already follows.

If a preview genuinely needs local asset files, keep them inside its own
folder and reference them **relative to the page**:

```
preview/<slug>/index.html
preview/<slug>/assets/hero.png   ->   <img src="assets/hero.png">
```

Do not use root-absolute paths like `/assets/hero.png`; they would collide
with the main site.

## Current previews

| Slug        | Status                                                        |
| ----------- | ------------------------------------------------------------- |
| `next2next` | Live. Self-extracting bundle (~3.6 MB); requires JavaScript. |

## Local check

From the repo root:

```
npx serve .        # or: python -m http.server 8000
```

Then open `http://localhost:8000/preview/next2next`.

Note that some static servers require the trailing slash
(`/preview/next2next/`) for the folder-index redirect. Azure Static Web Apps
handles the extensionless form without one.
