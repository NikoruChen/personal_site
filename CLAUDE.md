# CLAUDE.md

Personal website for the domain `damu.blog`.

Served via GitHub Pages; `CNAME` maps the custom domain. Deploy by pushing to `main`. Preview locally with `python3 -m http.server`.

## Layout

No build step — the browser loads what is in the repo, so everything here is plain CSS and ES
modules served as-is.

`styles/base.css` is **the shared design system**: the color tokens, the type scale, the page
frame, the sticky header and the pill buttons. Both pages of the site load it — `index.html` and
the podcast's `czzy/feed.xsl` — so a change to the site's look belongs there and lands on both.
Only what a single page has of its own goes beside it (`styles/site.css`, `czzy/feed.css`).

`js/` holds the SPA, split by job: `app.js` (the hash router and entry point), `views.js` (the
three screens), `content.js` (loading posts and `home.json`), `search.js`, `markdown.js`. They
are ES modules, so `index.html` loads only `app.js`.

The landing page's copy — headline, lead, both buttons — lives in `home.json`, not in the
markup.

## Posts

Each post is a folder `posts/<slug>/` containing `index.md` (YAML frontmatter — `title`, `date`, optional `image`, `category` — plus body) and `cover.<ext>`; inline images go in `posts/<slug>/images/`. `posts/index.json` is an array of slugs, newest first — the SPA loads it, then each `posts/<slug>/index.md`. `js/markdown.js` renders a subset of markdown (headings, bullet/numbered lists, blockquotes, hr, bold/italic/strikethrough, inline code, links, images); anything outside it will not render.

`scripts/sync_notion.py` pulls publish-ready posts from a Notion database and writes them in this layout (see `scripts/README.md` for full setup/usage). Run `python3 scripts/sync_notion.py "标题"` to publish one note, no-arg to bulk-sync, `--props` to inspect DB properties, `--dry-run` to preview. Needs `NOTION_TOKEN`/`NOTION_DATABASE_ID` in a gitignored repo-root `.env`. Then commit & push to deploy.
