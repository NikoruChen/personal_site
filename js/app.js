// Entry point: the hash router. Each route is one screen in js/screens/ — #/ the
// landing page, #/posts the list, #/post/<slug> one note, #/podcast the show.
// czzy/feed.xml redirects to #/podcast rather than rendering itself, so every screen
// shares this page's header and footer.

import { loadPosts } from "./content.js";
import { renderHome } from "./screens/home.js";
import { renderList } from "./screens/posts.js";
import { renderPost } from "./screens/post.js";
import { renderPodcast } from "./screens/podcast.js";

const app = document.getElementById("app");
document.getElementById("year").textContent = new Date().getFullYear();

function setActiveNav(hash) {
    const route = hash.startsWith("#/podcast") ? "podcast"
        : (hash.startsWith("#/posts") || hash.startsWith("#/post/")) ? "posts"
        : "home";
    document.querySelectorAll("nav a[data-route]").forEach(a => {
        a.classList.toggle("active", a.dataset.route === route);
    });
}

async function router() {
    const hash = location.hash || "#/";
    setActiveNav(hash);
    try {
        const m = hash.match(/^#\/post\/(.+)$/);
        if (m) {
            renderPost(await loadPosts(), decodeURIComponent(m[1]));
        } else if (hash.startsWith("#/podcast")) {
            await renderPodcast();
        } else if (hash.startsWith("#/posts")) {
            renderList(await loadPosts());
        } else {
            await renderHome();
        }
    } catch (e) {
        app.innerHTML = `<p class="loading">内容加载失败。如果你是直接打开本地文件查看的，请运行 <code>python3 -m http.server</code>，然后访问 localhost:8000。</p>`;
    }
}

window.addEventListener("hashchange", router);
router();
