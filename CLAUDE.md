# CLAUDE.md

Personal website for the domain `damu.blog`.

Served via GitHub Pages; `CNAME` maps the custom domain. Deploy by pushing to `main`. Preview locally with `python3 -m http.server`.

## Posts

Each post is a folder `posts/<slug>/` containing `index.md` (YAML frontmatter — `title`, `date`, optional `image`, `category` — plus body) and `cover.<ext>`; inline images go in `posts/<slug>/images/`. `posts/index.json` is an array of slugs, newest first. `index.html` is a hash-routed SPA that loads `index.json` then each `posts/<slug>/index.md`; its `renderMarkdown` supports headings, bullet/numbered lists, blockquotes, hr, bold/italic/strikethrough, inline code, links, and images.

`scripts/sync_notion.py` pulls publish-ready posts from a Notion database and writes them in this layout (see `scripts/README.md` for full setup/usage). Run `python3 scripts/sync_notion.py "标题"` to publish one note, no-arg to bulk-sync, `--props` to inspect DB properties, `--dry-run` to preview. Needs `NOTION_TOKEN`/`NOTION_DATABASE_ID` in a gitignored repo-root `.env`. Then commit & push to deploy.

## Podcast (`czzy/`)

`czzy/` holds the RSS feed for the podcast 《粗枝壮叶》 — `czzy/feed.xml`, served at `https://damu.blog/czzy/feed.xml`, plus `czzy/cover.png` (the show artwork, which is in this repo only because the feed cites it by public URL).

**`czzy/feed.xml` is the podcast's source of truth** — there is no manifest anywhere. It holds both the show metadata (the `<channel>` block) and every published episode (`<item>`). The tooling that maintains it lives in the separate, private **`guild`** repo (`podcast/publish/`), where the `podcast-publish` skill uploads each episode's audio to Cloudflare R2 (behind `czzy.damu.blog`) and splices a new `<item>` into this file.

Two rules if you edit it directly:

- The **`<channel>` block is fair game** — that's how the show's title, description, categories and owner email change. Run `feed.py validate` in `guild` afterwards; Apple rejects category names that don't match its list exactly.
- **Never touch an existing `<item>`'s `<guid>`.** It's how podcast apps recognize an episode they already have; change one and every subscriber re-downloads it as new. `feed.py validate` compares against the last committed version of this file and hard-fails if a published guid disappears — which is also why every publish must be committed.
