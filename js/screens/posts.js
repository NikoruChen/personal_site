// 笔记 — the list of notes, with the search box above it.

import { escapeHtml } from "../markdown.js";
import { cardStyle, excerpt, fmtDate } from "../content.js";
import { setupSearch } from "../search.js";

const app = document.getElementById("app");

export function renderList(posts) {
    app.innerHTML = `
        <div class="intro">
            <h1>近期笔记</h1>
        </div>
        <div class="search">
            <input class="search-input" type="search" id="search" placeholder="搜索笔记…" autocomplete="off">
            <div class="dropdown" id="dropdown" hidden></div>
        </div>
        <section class="posts" style="padding-top:24px">
            ${posts.map(p => {
                const s = cardStyle(p.meta.category);
                const banner = p.meta.image
                    ? `<div class="card-banner" style="background-image:url('${escapeHtml(p.meta.image)}')"></div>`
                    : `<div class="card-banner" style="background:${s.bg}"><div class="banner-icon">${s.icon}</div></div>`;
                return `
                <a class="post-card" href="#/post/${p.slug}">
                    ${banner}
                    <div class="card-body">
                        <div class="meta">${fmtDate(p.meta.date)}${p.meta.category ? " · " + escapeHtml(p.meta.category) : ""}</div>
                        <h2 class="post-title">${escapeHtml(p.meta.title || p.slug)}</h2>
                        <p class="post-desc">${escapeHtml(excerpt(p.body))}</p>
                        <span class="read-link">→ 阅读全文</span>
                    </div>
                </a>`;
            }).join("")}
        </section>`;
    setupSearch(posts);
}
