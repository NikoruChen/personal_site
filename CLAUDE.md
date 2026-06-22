# CLAUDE.md

Personal website for the domain `liuge.life`.

Served via GitHub Pages; `CNAME` maps the custom domain. Deploy by pushing to `main`. Preview locally with `python3 -m http.server`.

## Posts

Posts are markdown files in `posts/` with YAML frontmatter (`title`, `date`, optional `image`, `category`), listed in `posts/index.json`. Covers live in `posts/covers/`, inline images in `posts/images/<slug>/`.

`scripts/sync_notion.py` pulls publish-ready posts (Notion checkbox property `Publish` = true) from a Notion database, exports each as markdown, downloads cover/inline images, and regenerates `index.json`. Needs `NOTION_TOKEN` and `NOTION_DATABASE_ID` (env or a gitignored repo-root `.env`). Run `python3 scripts/sync_notion.py` to sync, `--props` to inspect DB properties, `--dry-run` to preview. Then commit & push to publish.
