# liuge.life

Personal website (大木) — a Chinese card-style blog of 笔记, served via GitHub
Pages at [liuge.life](https://liuge.life).

It's a single static `index.html` (a small hash-routed SPA, no build step) plus
markdown posts. Deploy by pushing to `main`.

## Layout

```
index.html          # the whole site: styles, router, tiny markdown renderer
home.json           # landing-page content (avatar, headline, lead, CTA)
posts/
  index.json        # array of post slugs, newest first
  <slug>/
    index.md        # frontmatter (title, date, image) + body
    cover.<ext>     # cover image
    images/         # inline images (if any)
czzy/
  feed.xml          # podcast RSS feed — DEPLOYED ARTIFACT, generated elsewhere
  cover.png         # show artwork (the feed cites it by public URL)
scripts/
  sync_notion.py    # pull posts from Notion into posts/  (see scripts/README.md)
CNAME               # custom domain mapping
```

## Develop

```bash
python3 -m http.server      # preview at http://localhost:8000
```

Open `http://localhost:8000/#/posts` to see the post list. (Serve over HTTP —
opening `index.html` as a `file://` won't let it fetch the posts.)

## Publishing posts

Posts are authored in Notion and pulled in with `scripts/sync_notion.py`, which
writes each note into `posts/<slug>/`. Full setup and usage are in
[`scripts/README.md`](scripts/README.md). The typical flow:

```bash
python3 scripts/sync_notion.py "笔记标题"          # pull one note
git add -A && git commit -m "Publish: 笔记标题" && git push
```

Pushing to `main` deploys via GitHub Pages.

## The podcast feed (`czzy/`)

This repo serves the RSS feed for 《粗枝壮叶》 at
[damu.blog/czzy/feed.xml](https://damu.blog/czzy/feed.xml) — the URL every podcast app polls.
The audio itself is on Cloudflare R2 behind `czzy.damu.blog`.

**`czzy/feed.xml` is the podcast's source of truth** — there's no manifest behind it. It holds
the show metadata and every episode. The tooling that maintains it lives in the private
**`guild`** repo (`podcast/publish/`), next to the `podcast-publish` skill: that's what uploads
an episode's audio and splices the new `<item>` into this file.

You can hand-edit the `<channel>` block (show title, description, categories, owner email), but
never an existing episode's `<guid>` — see [`CLAUDE.md`](CLAUDE.md). Validate any edit with
`feed.py validate` in `guild`.
