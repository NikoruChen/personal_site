// The search box on the posts page: substring matching over title, category and
// body, with a keyboard-navigable dropdown of snippets.

import { escapeHtml } from "./markdown.js";
import { fmtDate } from "./content.js";

function highlight(text, query) {
    const safe = escapeHtml(text);
    if (!query) return safe;
    const i = text.toLowerCase().indexOf(query.toLowerCase());
    if (i < 0) return safe;
    return escapeHtml(text.slice(0, i)) +
        "<mark>" + escapeHtml(text.slice(i, i + query.length)) + "</mark>" +
        escapeHtml(text.slice(i + query.length));
}

// Split into "words": each CJK character is one word, latin/number runs are one word.
function tokenize(text) {
    const tokens = [];
    const re = /[㐀-鿿぀-ヿ]|[A-Za-z0-9]+/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        tokens.push({ start: m.index, end: m.index + m[0].length });
    }
    return tokens;
}

// Build a snippet: ~5 words before/after the match, with the match highlighted.
function snippetFor(text, query, ctx = 5) {
    if (!text || !query) return null;
    const i = text.toLowerCase().indexOf(query.toLowerCase());
    if (i < 0) return null;
    const mStart = i, mEnd = i + query.length;
    const tokens = tokenize(text);
    let first = tokens.findIndex(t => t.end > mStart);
    let last = -1;
    for (let k = 0; k < tokens.length && tokens[k].start < mEnd; k++) last = k;
    if (first < 0) first = 0;
    if (last < 0) last = tokens.length - 1;
    let s = tokens.length ? tokens[Math.max(0, first - ctx)].start : 0;
    let e = tokens.length ? tokens[Math.min(tokens.length - 1, last + ctx)].end : text.length;
    s = Math.min(s, mStart);
    e = Math.max(e, mEnd);
    const clean = str => str.replace(/\s+/g, " ");
    return (s > 0 ? "…" : "") +
        escapeHtml(clean(text.slice(s, mStart))) +
        "<mark>" + escapeHtml(clean(text.slice(mStart, mEnd))) + "</mark>" +
        escapeHtml(clean(text.slice(mEnd, e))) +
        (e < text.length ? "…" : "");
}

function searchPosts(posts, query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return posts.filter(p => {
        const hay = [p.meta.title, p.meta.category, p.body]
            .filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
    });
}

export function setupSearch(posts) {
    const input = document.getElementById("search");
    const dropdown = document.getElementById("dropdown");
    let activeIdx = -1, matches = [];

    function close() { dropdown.hidden = true; dropdown.innerHTML = ""; activeIdx = -1; }

    function update() {
        const q = input.value;
        matches = searchPosts(posts, q);
        activeIdx = -1;
        if (!q.trim()) { close(); return; }
        if (!matches.length) {
            dropdown.innerHTML = `<div class="dropdown-empty">没有匹配的笔记</div>`;
        } else {
            dropdown.innerHTML = matches.map((p, i) => {
                const snip = snippetFor(p.body, q);
                return `
                <a class="dropdown-item" href="#/post/${p.slug}" data-idx="${i}">
                    <div class="d-title">${highlight(p.meta.title || p.slug, q)}</div>
                    ${snip ? `<div class="d-snippet">${snip}</div>` : ""}
                    <div class="d-meta">${fmtDate(p.meta.date)}${p.meta.category ? " · " + escapeHtml(p.meta.category) : ""}</div>
                </a>`;
            }).join("");
        }
        dropdown.hidden = false;
    }

    function setActive(i) {
        const items = dropdown.querySelectorAll(".dropdown-item");
        if (!items.length) return;
        activeIdx = (i + items.length) % items.length;
        items.forEach((el, idx) => el.classList.toggle("active", idx === activeIdx));
        items[activeIdx].scrollIntoView({ block: "nearest" });
    }

    input.addEventListener("input", update);
    input.addEventListener("keydown", e => {
        if (dropdown.hidden) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setActive(activeIdx + 1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive(activeIdx - 1); }
        else if (e.key === "Enter" && activeIdx > -1 && matches[activeIdx]) {
            e.preventDefault(); location.hash = `#/post/${matches[activeIdx].slug}`;
        } else if (e.key === "Escape") { input.blur(); close(); }
    });
    document.addEventListener("click", e => {
        if (!e.target.closest(".search")) close();
    });
}
