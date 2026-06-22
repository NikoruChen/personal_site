#!/usr/bin/env python3
"""Sync publish-ready posts from a Notion database into this repo.

Pulls every page whose publish checkbox is ticked, exports it as Markdown,
downloads the cover + any inline images, and regenerates posts/index.json so
the site picks the posts up automatically.

Usage
-----
    export NOTION_TOKEN=secret_xxx          # your integration's internal token
    export NOTION_DATABASE_ID=xxxxxxxx      # the database (not data source) id
    python3 scripts/sync_notion.py "标题"   # sync ONE note by exact title
    python3 scripts/sync_notion.py          # bulk-sync all publish-ready posts
    python3 scripts/sync_notion.py --props  # list DB properties and exit
    python3 scripts/sync_notion.py --dry-run

Pass a title to pull a single note (matched on the title property, ignoring the
publish/format filter — naming it is your intent to publish). With no title it
bulk-syncs everything matching the publish filter (used for the initial backfill).

A repo-root .env file (KEY=VALUE lines) is loaded automatically if present, so
you don't have to re-export the variables every time. Keep it out of git.

The script never deletes hand-written posts: it upserts the published Notion
posts and rebuilds index.json from whatever .md files exist in posts/.
"""

import argparse
import json
import mimetypes
import os
import re
import sys
import urllib.error
import urllib.request

# --- configuration ----------------------------------------------------------

# Checkbox properties that must be TRUE for a post to publish.
REQUIRE_CHECKED = ["Published", "Ready"]
# Checkbox properties that must be FALSE for a post to publish.
REQUIRE_UNCHECKED = ["Archived"]
# Only publish posts whose multi-select FORMAT_PROP contains one of these values.
# Set FORMAT_PROP = None to disable format filtering.
FORMAT_PROP = "Format"
FORMAT_INCLUDE = ["Essay"]
# Date property used for the post date; falls back to created_time if missing.
DATE_PROP = "Published on"
# Files property holding the cover image (Notion "files" type). None to disable.
COVER_PROP = "Cover Personal Site"
# Optional select/multi-select property mapped to the post "category".
CATEGORY_PROP = None

NOTION_VERSION = "2026-03-11"
API = "https://api.notion.com/v1"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS_DIR = os.path.join(ROOT, "posts")
COVERS_DIR = os.path.join(POSTS_DIR, "covers")
IMAGES_DIR = os.path.join(POSTS_DIR, "images")

# --- tiny .env loader -------------------------------------------------------


def load_dotenv():
    path = os.path.join(ROOT, ".env")
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip().strip("\"'"))


# --- Notion HTTP ------------------------------------------------------------


def notion(method, path, body=None):
    url = f"{API}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Notion-Version", NOTION_VERSION)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")
        sys.exit(f"Notion API error {e.code} on {method} {path}:\n{detail}")


def resolve_data_source(database_id):
    db = notion("GET", f"/databases/{database_id}")
    sources = db.get("data_sources") or []
    if not sources:
        sys.exit("Database has no data sources. Check the database id / sharing.")
    if len(sources) > 1:
        names = ", ".join(s.get("name", "?") for s in sources)
        print(f"Note: database has multiple data sources ({names}); using the first.")
    return sources[0]["id"]


def build_filter():
    conditions = []
    for name in REQUIRE_CHECKED:
        conditions.append({"property": name, "checkbox": {"equals": True}})
    for name in REQUIRE_UNCHECKED:
        conditions.append({"property": name, "checkbox": {"equals": False}})
    if FORMAT_PROP and FORMAT_INCLUDE:
        conditions.append({
            "or": [{"property": FORMAT_PROP, "multi_select": {"contains": v}}
                   for v in FORMAT_INCLUDE]
        })
    return {"and": conditions}


def query_published(ds_id):
    results, cursor = [], None
    while True:
        body = {"filter": build_filter(), "page_size": 100}
        if cursor:
            body["start_cursor"] = cursor
        page = notion("POST", f"/data_sources/{ds_id}/query", body)
        results.extend(page["results"])
        if not page.get("has_more"):
            return results
        cursor = page["next_cursor"]


def query_by_title(ds_id, title_prop, title):
    body = {"filter": {"property": title_prop, "title": {"equals": title}}}
    return notion("POST", f"/data_sources/{ds_id}/query", body)["results"]


# --- property extraction ----------------------------------------------------


def prop_of_type(schema, type_name):
    for name, meta in schema.items():
        if meta.get("type") == type_name:
            return name
    return None


def get_title(props):
    for meta in props.values():
        if meta.get("type") == "title":
            return "".join(t["plain_text"] for t in meta["title"]).strip()
    return ""


def get_date(props, date_prop, created_time):
    if date_prop and date_prop in props:
        d = props[date_prop].get("date")
        if d and d.get("start"):
            return d["start"][:10]
    return created_time[:10]


def get_category(props):
    if not CATEGORY_PROP or CATEGORY_PROP not in props:
        return None
    meta = props[CATEGORY_PROP]
    if meta.get("type") == "select" and meta.get("select"):
        return meta["select"]["name"]
    if meta.get("type") == "multi_select":
        names = [o["name"] for o in meta.get("multi_select", [])]
        return names[0] if names else None
    return None


# --- files / images ---------------------------------------------------------


def slugify(title):
    # Keep Chinese and alphanumerics; strip characters illegal in filenames.
    slug = re.sub(r'[\\/:*?"<>|]', "", title).strip()
    slug = re.sub(r"\s+", " ", slug)
    return slug or "untitled"


def ext_from(url, content_type):
    path = url.split("?", 1)[0]
    _, ext = os.path.splitext(path)
    if ext:
        return ext
    return mimetypes.guess_extension(content_type or "") or ".jpg"


def download(url, dest_dir, base_name):
    """Download url into dest_dir/base_name.<ext>; return repo-relative path."""
    os.makedirs(dest_dir, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "liuge-notion-sync"})
    with urllib.request.urlopen(req) as resp:
        ctype = resp.headers.get("Content-Type", "")
        data = resp.read()
    ext = ext_from(url, ctype)
    dest = os.path.join(dest_dir, base_name + ext)
    with open(dest, "wb") as f:
        f.write(data)
    return os.path.relpath(dest, ROOT).replace(os.sep, "/")


def cover_url(page):
    # Prefer the Cover files property; fall back to the page cover if set.
    if COVER_PROP:
        files = page["properties"].get(COVER_PROP, {}).get("files") or []
        for f in files:
            url = (f.get("external") or f.get("file") or {}).get("url")
            if url:
                return url
    cover = page.get("cover")
    if cover:
        return (cover.get("external") or cover.get("file") or {}).get("url")
    return None


# Notion "enhanced markdown" emits custom tags the site's renderer can't show.
# These are all authoring scaffolding (spacing, private outlines/notes, links to
# private Notion sub-pages), so they're stripped before publishing.
CALLOUT_RE = re.compile(r"<callout\b[^>]*>(?:(?!</?callout\b).)*?</callout>", re.S)
PAGE_RE = re.compile(r"<page\b[^>]*>.*?</page>", re.S)
EMPTY_BLOCK_RE = re.compile(r"[ \t]*<empty-block\s*/>[ \t]*")
BLANK_LINES_RE = re.compile(r"\n{3,}")


def clean_markdown(md):
    md = EMPTY_BLOCK_RE.sub("", md)
    md = PAGE_RE.sub("", md)
    # Remove callouts inside-out so nested ones are handled correctly.
    while CALLOUT_RE.search(md):
        md = CALLOUT_RE.sub("", md)
    md = BLANK_LINES_RE.sub("\n\n", md)
    return md.strip()


IMG_RE = re.compile(r"!\[([^\]]*)\]\((https?://[^)\s]+)\)")


def localize_images(markdown, slug):
    """Download inline images (Notion's URLs expire) and rewrite to local paths."""
    counter = [0]

    def repl(m):
        counter[0] += 1
        alt, url = m.group(1), m.group(2)
        try:
            rel = download(url, os.path.join(IMAGES_DIR, slug), f"img-{counter[0]}")
        except Exception as e:  # keep the original URL if a download fails
            print(f"  ! inline image download failed ({e}); keeping remote URL")
            return m.group(0)
        return f"![{alt}]({rel})"

    return IMG_RE.sub(repl, markdown)


# --- main -------------------------------------------------------------------


def write_post(page, schema, date_prop, dry_run):
    props = page["properties"]
    title = get_title(props)
    if not title:
        print(f"  ! skipping page {page['id']} with empty title")
        return None
    slug = slugify(title)
    date = get_date(props, date_prop, page["created_time"])
    category = get_category(props)

    md = notion("GET", f"/pages/{page['id']}/markdown")
    if md.get("truncated"):
        print(f"  ! '{title}' was truncated by Notion (very long page).")
    body = clean_markdown(md.get("markdown", ""))

    # Frontmatter
    fm = [f"title: {title}", f"date: {date}"]

    if not dry_run:
        if cover_url(page):
            try:
                img = download(cover_url(page), COVERS_DIR, slug)
                fm.append(f"image: {img}")
            except Exception as e:
                print(f"  ! cover download failed for '{title}': {e}")
        body = localize_images(body, slug)
    elif cover_url(page):
        fm.append(f"image: posts/covers/{slug}.<ext>")

    if category:
        fm.append(f"category: {category}")

    # Notion markdown omits the page title; match the existing posts' H1 style.
    if not body.startswith("# "):
        body = f"# {title}\n\n{body}"

    content = "---\n" + "\n".join(fm) + "\n---\n\n" + body + "\n"
    filename = f"{slug}.md"

    if dry_run:
        print(f"  would write posts/{filename} (date {date})")
        return filename

    with open(os.path.join(POSTS_DIR, filename), "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  wrote posts/{filename}")
    return filename


def read_date(md_path):
    with open(md_path, encoding="utf-8") as f:
        text = f.read()
    m = re.search(r"^date:\s*(.+)$", text, re.MULTILINE)
    return (m.group(1).strip() if m else "")


def rebuild_index():
    files = [f for f in os.listdir(POSTS_DIR) if f.endswith(".md")]
    files.sort(key=lambda f: read_date(os.path.join(POSTS_DIR, f)), reverse=True)
    with open(os.path.join(POSTS_DIR, "index.json"), "w", encoding="utf-8") as f:
        json.dump(files, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"rebuilt posts/index.json ({len(files)} posts)")


def main():
    parser = argparse.ArgumentParser(description="Sync Notion posts into the repo.")
    parser.add_argument("title", nargs="?",
                        help="sync only the note with this exact title; "
                             "omit to bulk-sync all publish-ready posts")
    parser.add_argument("--props", action="store_true",
                        help="list the database's properties and exit")
    parser.add_argument("--dry-run", action="store_true",
                        help="report what would change without writing files")
    args = parser.parse_args()

    load_dotenv()
    global TOKEN
    TOKEN = os.environ.get("NOTION_TOKEN")
    database_id = os.environ.get("NOTION_DATABASE_ID")
    if not TOKEN or not database_id:
        sys.exit("Set NOTION_TOKEN and NOTION_DATABASE_ID (env or .env file).")

    ds_id = resolve_data_source(database_id)
    ds = notion("GET", f"/data_sources/{ds_id}")
    schema = ds["properties"]

    if args.props:
        print("Database properties:")
        for name, meta in schema.items():
            print(f"  - {name} ({meta['type']})")
        return

    date_prop = DATE_PROP if (DATE_PROP and DATE_PROP in schema) \
        else prop_of_type(schema, "date")

    if args.title:
        title_prop = prop_of_type(schema, "title")
        pages = query_by_title(ds_id, title_prop, args.title)
        if not pages:
            sys.exit(f"No note titled '{args.title}' found in the database.")
        if len(pages) > 1:
            print(f"Note: {len(pages)} notes match '{args.title}'; syncing all.")
        print(f"Syncing '{args.title}' ({len(pages)} match).")
    else:
        # Bulk mode relies on the publish/format filter, so validate those props.
        missing = []
        for name in REQUIRE_CHECKED + REQUIRE_UNCHECKED:
            if name not in schema or schema[name]["type"] != "checkbox":
                missing.append(name)
        if FORMAT_PROP and (FORMAT_PROP not in schema
                            or schema[FORMAT_PROP]["type"] != "multi_select"):
            missing.append(FORMAT_PROP)
        if missing:
            print(f"Missing/mismatched properties: {', '.join(missing)}. Available:")
            for name, meta in schema.items():
                print(f"  - {name} ({meta['type']})")
            sys.exit("Edit the config constants at the top of this script to match.")
        pages = query_published(ds_id)
        print(f"Found {len(pages)} published post(s).")

    for page in pages:
        write_post(page, schema, date_prop, args.dry_run)

    if not args.dry_run:
        rebuild_index()
    print("Done." if not args.dry_run else "Dry run complete.")


if __name__ == "__main__":
    main()
