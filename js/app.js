// Entry point: the hash router. #/ is the landing page, #/posts the list,
// #/post/<slug> one note. The podcast is a page of its own (czzy/feed.xml), so
// it is a plain link in the nav rather than a route here.

import { loadPosts } from "./content.js";
import { renderError, renderHome, renderList, renderPost } from "./views.js";

document.getElementById("year").textContent = new Date().getFullYear();

function setActiveNav(hash) {
    const route = (hash.startsWith("#/posts") || hash.startsWith("#/post/")) ? "posts" : "home";
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
            const posts = await loadPosts();
            renderPost(posts, decodeURIComponent(m[1]));
        } else if (hash.startsWith("#/posts")) {
            const posts = await loadPosts();
            renderList(posts);
        } else {
            await renderHome();
        }
    } catch (e) {
        renderError();
    }
}

window.addEventListener("hashchange", router);
router();
