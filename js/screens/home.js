// 首页 — the landing screen. Its words all come from home.json, so the copy can change
// without touching this file.

import { escapeHtml } from "../markdown.js";
import { loadHome } from "../content.js";

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
