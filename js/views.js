// The three screens the router can show, each rendering into #app.

import { escapeHtml, renderMarkdown } from "./markdown.js";
import { cardStyle, excerpt, fmtDate, loadHome } from "./content.js";
import { setupSearch } from "./search.js";

const app = document.getElementById("app");

export async function renderHome() {
    const c = await loadHome();
    const headline = Array.isArray(c.headline) ? c.headline : [c.headline || "大木"];
    const cta = c.cta || {};
    const cta2 = c.ctaSecondary;
    const avatar = c.avatarImage
        ? `<img src="${escapeHtml(c.avatarImage)}" alt="${escapeHtml(c.avatar || "六")}">`
        : escapeHtml(c.avatar || "六");
    app.innerHTML = `
        <section class="hero">
            <div class="avatar">${avatar}</div>
            <h1>${headline.map(escapeHtml).join("<br>")}</h1>
            <p class="lead">${escapeHtml(c.lead || "")}</p>
            <div class="hero-actions">
                <a class="btn btn-primary" href="${escapeHtml(cta.href || "#/posts")}">${escapeHtml(cta.label || "阅读笔记 →")}</a>
                ${cta2 ? `<a class="btn btn-primary" href="${escapeHtml(cta2.href || "")}">${escapeHtml(cta2.label || "")}</a>` : ""}
            </div>
        </section>`;
    window.scrollTo(0, 0);
}

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

export function renderPost(posts, slug) {
    const post = posts.find(p => p.slug === slug);
    if (!post) { app.innerHTML = `<article><a class="back" href="#/posts">← 返回笔记列表</a><p>没有找到这篇笔记。</p></article>`; return; }
    app.innerHTML = `
        <article>
            <a class="back" href="#/posts">← 返回笔记列表</a>
            <div class="meta" style="margin-top:24px">${fmtDate(post.meta.date)}${post.meta.category ? " · " + escapeHtml(post.meta.category) : ""}</div>
            ${renderMarkdown(post.body)}
        </article>`;
    window.scrollTo(0, 0);
}

export function renderError() {
    app.innerHTML = `<p class="loading">笔记加载失败。如果你是直接打开本地文件查看的，请运行 <code>python3 -m http.server</code>，然后访问 localhost:8000。</p>`;
}
