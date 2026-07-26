// Loading and shaping the site's content: the posts under posts/ and the landing
// page copy in home.json. Both are fetched once and cached for the session.

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
