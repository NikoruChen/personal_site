// Where every word on the site comes from — the notes under posts/, the landing page
// copy in home.json, and the podcast in czzy/feed.xml. Each source is fetched once and
// cached for the session, and handed to the screens as plain objects: nothing in here
// knows what any of it looks like.

const POSTS_DIR = "posts";

// --- frontmatter parsing ---
function parsePost(text) {
    const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    const meta = {};
    let body = text;
    if (m) {
        m[1].split("\n").forEach(l => {
            const i = l.indexOf(":");
            if (i > -1) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim();
        });
        body = m[2];
    }
    return { meta, body };
}

// Build a plain-text excerpt from the markdown body: drop the leading
// title heading and markdown syntax, then take the opening lines.
export function excerpt(body, max = 150) {
    const text = (body || "")
        .replace(/^#{1,6}\s+.*$/gm, "")        // heading lines
        .replace(/!\[.*?\]\(.*?\)/g, "")       // images
        .replace(/^[-*]\s+/gm, "")             // bullet markers
        .replace(/^\d+\.\s+/gm, "")            // ordered markers
        .replace(/^>\s?/gm, "")                // blockquote markers
        .replace(/`([^`]+)`/g, "$1")           // inline code
        .replace(/\*\*(.+?)\*\*/g, "$1")       // bold
        .replace(/\*(.+?)\*/g, "$1")           // italic
        .replace(/\[(.+?)\]\(.+?\)/g, "$1")    // links -> text
        .replace(/\s+/g, " ")
        .trim();
    if (text.length <= max) return text;
    return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export function fmtDate(s) {
    // Parse plain YYYY-MM-DD as a local date (not UTC) to avoid an
    // off-by-one day when the browser timezone is behind UTC.
    const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec((s || "").trim());
    const d = ymd ? new Date(+ymd[1], +ymd[2] - 1, +ymd[3]) : new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

let cache = null;
export async function loadPosts() {
    if (cache) return cache;
    const slugs = await fetch(`${POSTS_DIR}/index.json`, { cache: "no-store" }).then(r => r.json());
    const posts = await Promise.all(slugs.map(async slug => {
        const text = await fetch(`${POSTS_DIR}/${slug}/index.md`, { cache: "no-store" }).then(r => r.text());
        const { meta, body } = parsePost(text);
        return { slug, file: `${slug}/index.md`, meta, body };
    }));
    posts.sort((a, b) => new Date(b.meta.date) - new Date(a.meta.date));
    cache = posts;
    return posts;
}

let homeContent = null;
export async function loadHome() {
    if (homeContent) return homeContent;
    try {
        homeContent = await fetch("home.json", { cache: "no-store" }).then(r => r.json());
    } catch (e) {
        homeContent = {};
    }
    return homeContent;
}

// Banner look per category: icon + soft gradient background.
const CARD_STYLES = {
    "随笔": { icon: "✍️", bg: "linear-gradient(135deg, #fdf0e3, #f6dcc4)" },
    "折腾": { icon: "🔧", bg: "linear-gradient(135deg, #e6eefb, #cfe0f6)" },
    "旅行": { icon: "✈️", bg: "linear-gradient(135deg, #e4f4ec, #c6e8d6)" },
    "阅读": { icon: "📖", bg: "linear-gradient(135deg, #f3e9fb, #e0cdf2)" },
};
const DEFAULT_STYLE = { icon: "📝", bg: "linear-gradient(135deg, #f0f0f0, #dcdcdc)" };
export function cardStyle(category) { return CARD_STYLES[category] || DEFAULT_STYLE; }

// --- the podcast, read out of the RSS feed ---
//
// czzy/feed.xml is the show's source of truth and the file Apple and the other
// directories subscribe to. It is only ever read from here, never written.

const FEED_URL = "/czzy/feed.xml";
const ITUNES_NS = "http://www.itunes.com/dtds/podcast-1.0.dtd";

// Direct children only: <channel> and its <item>s use the same tag names, so a
// descendant search would read an episode's title as the show's.
function child(parent, name, ns = null) {
    return [...parent.children].find(el =>
        el.localName === name && (ns === null || el.namespaceURI === ns));
}
function childText(parent, name, ns = null) {
    const el = child(parent, name, ns);
    return el ? el.textContent.trim() : "";
}

// "Thu, 23 Jul 2026 16:52:59 -0700" → "2026年7月23日". Read off the string rather than
// through Date, so the date shown is the one the episode was published with and does
// not shift a day for a reader in another timezone.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtPubDate(rfc) {
    const m = /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/.exec(rfc || "");
    if (!m) return rfc || "";
    return `${m[3]}年${MONTHS.indexOf(m[2]) + 1}月${Number(m[1])}日`;
}

let show = null;
export async function loadShow() {
    if (show) return show;
    const xml = await fetch(FEED_URL, { cache: "no-store" }).then(r => r.text());
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("feed did not parse");

    const channel = doc.querySelector("rss > channel");
    const cover = child(channel, "image", ITUNES_NS);
    show = {
        title: childText(channel, "title"),
        cover: cover ? cover.getAttribute("href") : "",
        // The description and the show notes are HTML inside CDATA — markup to a
        // reader, plain text to the parser. The screen sets them as HTML.
        description: childText(channel, "description"),
        episodes: [...channel.children].filter(el => el.localName === "item").map(item => {
            const audio = child(item, "enclosure");
            const duration = childText(item, "duration", ITUNES_NS);
            return {
                title: childText(item, "title"),
                date: fmtPubDate(childText(item, "pubDate")),
                // hh:mm:ss, but drop a zero hour — nobody writes 00:05:25.
                duration: duration.startsWith("00:") ? duration.slice(3) : duration,
                audio: audio ? audio.getAttribute("url") : "",
                notes: childText(item, "description"),
            };
        }),
    };
    return show;
}
