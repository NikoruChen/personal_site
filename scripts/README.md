# Notion → site publishing

`sync_notion.py` pulls notes from a Notion database and writes them into this
repo as the markdown posts the site renders. It's a single, dependency-free
Python 3 script (standard library only).

## What it does

Each post lives in its own folder, named after the post title (the *slug*):

```
posts/
  index.json                 # array of slugs, newest first — the list the site loads
  <slug>/
    index.md                 # frontmatter (title, date, image) + body
    cover.<ext>              # cover image
    images/                  # inline images (only if the post has any)
      img-1.<ext>
```

For each matching Notion page the script:

1. Exports the page as markdown (`GET /v1/pages/:id/markdown`).
2. Strips Notion's authoring scaffolding — `<callout>` notes/outlines, `<page>`
   links to private sub-pages, and `<empty-block/>` spacers.
3. Downloads the cover into `posts/<slug>/cover.<ext>` and any inline images
   into `posts/<slug>/images/` (Notion's image URLs are pre-signed and expire,
   so they're localized and the links rewritten).
4. Writes `posts/<slug>/index.md` with frontmatter (`title`, `date`, `image`).
5. Rebuilds `posts/index.json` (the array of slugs the site loads), newest first.

It **upserts** — existing posts are overwritten from Notion, but folders are
never deleted. To unpublish, delete the `posts/<slug>/` folder by hand, or
archive the note in Notion so a future bulk run won't re-add it.

## Setup (one time)

1. **Create a Notion integration** and copy its internal token
   (https://www.notion.so/my-integrations). It needs the `read_content`
   capability.
2. **Share your database** with the integration (database `•••` → Connections).
3. **Create `.env`** in the repo root (gitignored — never commit it):

   ```
   NOTION_TOKEN=ntn_your_secret_here
   NOTION_DATABASE_ID=2098dbf4974a80dd9ba0fb0cbb27d3d9
   ```

   The database id is the 32-char hex string in the database URL, before `?v=`
   (that part is the view, not the database). Dashed or plain form both work.

   Alternatively, export `NOTION_TOKEN` / `NOTION_DATABASE_ID` as environment
   variables instead of using `.env`.

## Usage

```bash
python3 scripts/sync_notion.py "笔记标题"   # sync ONE note by exact title
python3 scripts/sync_notion.py             # bulk-sync all publish-ready posts
python3 scripts/sync_notion.py --props     # list DB properties and exit
python3 scripts/sync_notion.py --dry-run   # preview without writing files
```

`--dry-run` works with either mode (e.g. `--dry-run "笔记标题"`).

- **Single-note mode** (a title argument) matches the note on its title property
  and syncs it regardless of the publish filter — naming it is your intent to
  publish. This is the normal day-to-day flow.
- **Bulk mode** (no argument) syncs every note matching the publish filter
  below. Used for the initial backfill or a full re-sync.

### Typical publish flow

```bash
python3 scripts/sync_notion.py "笔记标题"
git add -A && git commit -m "Publish: 笔记标题" && git push
```

Pushing to `main` deploys via GitHub Pages.

## Which notes get published (bulk mode)

A note is included when **all** of these hold (configurable at the top of the
script):

| Constant            | Default                | Meaning                                    |
| ------------------- | ---------------------- | ------------------------------------------ |
| `REQUIRE_CHECKED`   | `["Published","Ready"]`| these checkboxes must be ticked            |
| `REQUIRE_UNCHECKED` | `["Archived"]`         | these checkboxes must be unticked          |
| `FORMAT_PROP` / `FORMAT_INCLUDE` | `"Format"` / `["Essay"]` | multi-select must contain one of these |
| `DATE_PROP`         | `"Published on"`       | date property for the post date (falls back to created time) |
| `COVER_PROP`        | `"Cover Personal Site"`| files property holding the cover image      |
| `CATEGORY_PROP`     | `None`                 | optional select/multi-select → card category label |

If you rename a property in Notion, update the matching constant. Run
`--props` to print the database's current property names and types; the script
also lists them and exits if a configured property is missing or the wrong type.

## Notes

- Requires Notion API version `2026-03-11` (set in the script). This version
  models a database as containing **data sources**; the script resolves the
  database id to its first data source automatically.
- Post folder names (slugs) are the note title verbatim (Chinese is fine);
  characters illegal in filenames (`\ / : * ? " < > |`) are stripped.
- The site's markdown renderer (in `index.html`) supports headings, bullet and
  numbered lists, blockquotes, horizontal rules, bold/italic/strikethrough,
  inline code, links, and images. Other Notion blocks (tables, toggles, etc.)
  are not rendered — extend `renderMarkdown` in `index.html` if you start using
  them.
