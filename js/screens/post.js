// One note, rendered from its markdown body.

import { escapeHtml, renderMarkdown } from "../markdown.js";
import { fmtDate } from "../content.js";

const app = document.getElementById("app");

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
