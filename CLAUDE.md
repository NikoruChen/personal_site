# CLAUDE.md

Personal website for the domain `damu.blog`.

Served via GitHub Pages; `CNAME` maps the custom domain. Deploy by pushing to `main`. Preview
locally with `python3 -m http.server` — the site fetches its own content, so a `file://` path
will not work.

## Conventions

**No build step.** The browser loads what is in the repo: plain CSS and ES modules, served as
they are. Nothing here may need compiling, bundling or minifying.

**One document.** Every screen — the podcast included — is a hash route inside `index.html`
rendered into `#app`, so the header and footer exist once. A new screen means a file in
`js/screens/` and a branch in the router.

**Screens render; `js/content.js` fetches.** It reads `posts/*.md`, `home.json` and
`czzy/feed.xml` and hands back plain objects. A screen never fetches for itself, and
`content.js` never knows what anything looks like.

**`styles/base.css` is the design system** — the tokens, the type scale, the shared chrome. A
change to the site's look belongs there rather than in a per-screen stylesheet.

**Per-screen CSS is scoped.** Every stylesheet loads into that one document, so each rule in
`podcast.css` is scoped to `.podcast`; unscoped, a `.hero` there would reach the landing page
too. `site.css` is the exception and predates the split — it owns the generic names (`.hero`,
`.intro`) that `podcast.css` then has to restate under `.podcast`. A new screen gets its own
scoped stylesheet; don't add to that overlap.

**The landing page's copy lives in `home.json`**, not in the markup.

## Posts

Each post is a folder `posts/<slug>/` containing `index.md` (YAML frontmatter — `title`, `date`,
optional `image` — plus body) and `cover.<ext>`; inline images go in `posts/<slug>/images/`.
`posts/index.json` is an array of slugs, newest first.

A post may also carry a `category`, which picks its card's icon and gradient (`CARD_STYLES` in
`js/content.js`). Nothing writes one today: `sync_notion.py`'s `CATEGORY_PROP` is `None`, so
every card falls back to its cover image. Point that constant at a Notion select property to
turn categories on.

A post may only use the subset of markdown `js/markdown.js` implements; anything else reaches
the page as literal text.

`scripts/sync_notion.py` pulls publish-ready posts from a Notion database and writes them in
this layout — setup and usage in `scripts/README.md`. It needs `NOTION_TOKEN` and
`NOTION_DATABASE_ID` in a gitignored repo-root `.env`.
