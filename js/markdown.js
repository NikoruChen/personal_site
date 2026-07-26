// A small markdown subset — headings, bullet/numbered lists, blockquotes, hr,
// bold/italic/strikethrough, inline code, links and images. Enough for the notes
// this site publishes; anything richer belongs in the post as HTML.

export function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s) {
    return escapeHtml(s)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/~~(.+?)~~/g, "<del>$1</del>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/!\[(.*?)\]\((.+?)\)/g, '<img src="$2" alt="$1">')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

export function renderMarkdown(md) {
    const lines = md.split("\n");
    let html = "", inList = false, inOList = false, inQuote = false;
    const closeList = () => { if (inList) { html += "</ul>"; inList = false; } };
    const closeOList = () => { if (inOList) { html += "</ol>"; inOList = false; } };
    const closeQuote = () => { if (inQuote) { html += "</blockquote>"; inQuote = false; } };
    const closeBlocks = () => { closeList(); closeOList(); closeQuote(); };
    for (let raw of lines) {
        const line = raw.trimEnd();
        if (/^###\s+/.test(line)) { closeBlocks(); html += "<h3>" + inline(line.replace(/^###\s+/, "")) + "</h3>"; }
        else if (/^##\s+/.test(line)) { closeBlocks(); html += "<h2>" + inline(line.replace(/^##\s+/, "")) + "</h2>"; }
        else if (/^#\s+/.test(line)) { closeBlocks(); html += "<h1>" + inline(line.replace(/^#\s+/, "")) + "</h1>"; }
        else if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) { closeBlocks(); html += "<hr>"; }
        else if (/^>\s?/.test(line)) {
            closeList(); closeOList();
            if (!inQuote) { html += "<blockquote>"; inQuote = true; }
            html += "<p>" + inline(line.replace(/^>\s?/, "")) + "</p>";
        }
        else if (/^[-*]\s+/.test(line)) {
            closeOList(); closeQuote();
            if (!inList) { html += "<ul>"; inList = true; }
            html += "<li>" + inline(line.replace(/^[-*]\s+/, "")) + "</li>";
        }
        else if (/^\d+\.\s+/.test(line)) {
            closeList(); closeQuote();
            if (!inOList) { html += "<ol>"; inOList = true; }
            html += "<li>" + inline(line.replace(/^\d+\.\s+/, "")) + "</li>";
        }
        else if (line.trim() === "") { closeBlocks(); }
        else { closeBlocks(); html += "<p>" + inline(line) + "</p>"; }
    }
    closeBlocks();
    return html;
}
