# CLAUDE.md

Personal website for the domain `liuge.life`.

Served via GitHub Pages; `CNAME` maps the custom domain. Deploy by pushing to `main`. Preview locally with `python3 -m http.server`.

## Posts

Each post is a folder `posts/<slug>/` containing `index.md` (YAML frontmatter — `title`, `date`, optional `image`, `category` — plus body) and `cover.<ext>`; inline images go in `posts/<slug>/images/`. `posts/index.json` is an array of slugs, newest first. `index.html` is a hash-routed SPA that loads `index.json` then each `posts/<slug>/index.md`; its `renderMarkdown` supports headings, bullet/numbered lists, blockquotes, hr, bold/italic/strikethrough, inline code, links, and images.

`scripts/sync_notion.py` pulls publish-ready posts from a Notion database and writes them in this layout (see `scripts/README.md` for full setup/usage). Run `python3 scripts/sync_notion.py "标题"` to publish one note, no-arg to bulk-sync, `--props` to inspect DB properties, `--dry-run` to preview. Needs `NOTION_TOKEN`/`NOTION_DATABASE_ID` in a gitignored repo-root `.env`. Then commit & push to deploy.
