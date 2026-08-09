# damu.blog

Personal website (大木) — a Chinese card-style blog of 笔记. Served via GitHub Pages at
[damu.blog](https://damu.blog).

Static, with no build step and no dependencies. Deploy by pushing to `main`.

## Preview locally

```bash
python3 -m http.server      # http://localhost:8000
```

Serve it over HTTP: opened as a `file://` path, the site cannot fetch its own content.

## Publishing posts

Posts are authored in Notion and pulled in with `scripts/sync_notion.py`, which writes
each note into `posts/<slug>/`. Setup — including the Notion credentials it needs — is in
[`scripts/README.md`](scripts/README.md). The usual flow:

```bash
python3 scripts/sync_notion.py "笔记标题"          # pull one note
git add -A && git commit -m "Publish: 笔记标题" && git push
```
