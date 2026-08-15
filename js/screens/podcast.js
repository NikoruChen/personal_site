// 播客 — the show and its episodes, from the feed at czzy/feed.xml.
//
// Everything a reader sees that is not in the feed lives here, so nothing decorative
// ends up in the XML that podcast apps parse.

import { escapeHtml } from "../markdown.js";
import { loadShow } from "../content.js";

// 收听平台 — paste a show URL to make its button appear, leave it empty to skip it.
// The same links close every episode's description in the RSS feed, from footer.md in the guild
// repo. A platform that moves has to be changed in both: this list is live, that one is frozen
// into every episode already published.
const PLATFORMS = [
    ["苹果播客", "https://podcasts.apple.com/us/podcast/%E7%B2%97%E6%9E%9D%E5%A3%AE%E5%8F%B6/id6794143342"],
    ["小宇宙", "https://www.xiaoyuzhoufm.com/podcast/6a62aa6d49796b3301442d93"],
    ["网易云音乐", "https://music.163.com/#/djradio?id=1495839989"],
    ["喜马拉雅", "https://www.ximalaya.com/album/127426621"],
];

const app = document.getElementById("app");

function episode(ep) {
    return `
        <div class="ep">
            <div class="meta">${escapeHtml(ep.date)}${ep.duration ? " · " + escapeHtml(ep.duration) : ""}</div>
            <h3>${escapeHtml(ep.title)}</h3>
            ${ep.audio ? `<audio controls preload="none" src="${escapeHtml(ep.audio)}"></audio>` : ""}
            <details class="notes">
                <summary>本期内容</summary>
                <div class="prose"></div>
            </details>
        </div>`;
}

export async function renderPodcast() {
    const show = await loadShow();

    app.innerHTML = `
        <section class="podcast">
            <div class="hero">
                ${show.cover ? `<img class="cover" src="${escapeHtml(show.cover)}" alt="${escapeHtml(show.title)}">` : ""}
                <h1>${escapeHtml(show.title)}</h1>
            </div>

            <div class="about prose"></div>

            <div class="platforms">
                ${PLATFORMS.filter(([, url]) => url).map(([label, url]) =>
                    `<a class="btn btn-ghost" href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`).join("")}
            </div>

            <div class="intro">
                <h2>全部单集</h2>
            </div>

            <div class="episodes">
                ${show.episodes.map(episode).join("")}
            </div>
        </section>`;

    // The description and the show notes are already HTML, so they are set as markup
    // rather than escaped.
    app.querySelector(".about").innerHTML = show.description;
    app.querySelectorAll(".ep .prose").forEach((el, i) => {
        el.innerHTML = show.episodes[i].notes;
    });

    window.scrollTo(0, 0);
}
