<?xml version="1.0" encoding="UTF-8"?>
<!--
  The public face of feed.xml. Referenced by the <?xml-stylesheet?> line at the top of
  feed.xml: browsers apply it and render this page, podcast apps ignore it and read the
  raw XML. Nothing here affects the feed's contents.

  Typography, colors and chrome mirror the site's index.html — keep them in sync.

  Needs to be served over http(s) — open the feed through `python3 -m http.server`, not
  as a file:// path (browsers refuse to load a stylesheet for a local file).
-->
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
    xmlns:content="http://purl.org/rss/1.0/modules/content/"
    xmlns:atom="http://www.w3.org/2005/Atom"
    exclude-result-prefixes="itunes content atom">

  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <!-- ==========================================================================
       收听平台 — the only thing in this file meant to be edited regularly.

       Paste a show URL to make its button appear; leave it empty and the button is
       skipped. These live here rather than in feed.xml on purpose: they are page
       decoration, and feed.xml holds only what podcast apps read.
       ========================================================================== -->
  <xsl:variable name="apple">https://podcasts.apple.com/us/podcast/%E7%B2%97%E6%9E%9D%E5%A3%AE%E5%8F%B6/id6794143342</xsl:variable>
  <xsl:variable name="xiaoyuzhou">https://www.xiaoyuzhoufm.com/podcast/6a62aa6d49796b3301442d93</xsl:variable>
  <xsl:variable name="netease">https://music.163.com/#/djradio?id=1495839989</xsl:variable>
  <xsl:variable name="ximalaya">https://www.ximalaya.com/album/127426621</xsl:variable>
  <xsl:variable name="spotify"></xsl:variable>

  <xsl:template match="/">
    <html lang="zh-cn">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title><xsl:value-of select="rss/channel/title"/></title>
        <meta name="description" content="{normalize-space(rss/channel/description)}"/>
        <style>
          :root {
            --bg: #ffffff;
            --text: #1a1a1a;
            --muted: #6b6b6b;
            --accent: #1a1a1a;
            --line: #ececec;
            --maxw: 880px;
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --bg: #111111;
              --text: #ededed;
              --muted: #9a9a9a;
              --accent: #ffffff;
              --line: #262626;
            }
          }

          * { box-sizing: border-box; }

          html { -webkit-text-size-adjust: 100%; }

          body {
            margin: 0;
            background: var(--bg);
            color: var(--text);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            font-size: 18px;
            line-height: 1.65;
            -webkit-font-smoothing: antialiased;
          }

          .wrap {
            max-width: var(--maxw);
            margin: 0 auto;
            padding: 0 24px;
          }

          /* Header — same chrome as index.html */
          header {
            position: sticky;
            top: 0;
            z-index: 50;
            background: color-mix(in srgb, var(--bg) 88%, transparent);
            backdrop-filter: saturate(180%) blur(12px);
            -webkit-backdrop-filter: saturate(180%) blur(12px);
            border-bottom: 1px solid var(--line);
          }
          .header-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 64px;
          }
          .brand {
            font-weight: 800;
            font-size: 20px;
            letter-spacing: -0.01em;
            color: var(--text);
            text-decoration: none;
          }
          nav { display: flex; align-items: center; }
          nav a {
            color: var(--muted);
            text-decoration: none;
            font-size: 15px;
            font-weight: 500;
            margin-left: 28px;
            transition: color 0.15s ease;
          }
          nav a:hover { color: var(--text); }
          nav a.active { color: var(--text); font-weight: 600; }

          /* Show */
          .hero {
            text-align: center;
            padding: 72px 0 56px;
            border-bottom: 1px solid var(--line);
          }
          .cover {
            width: 300px;
            height: 300px;
            max-width: 100%;
            border-radius: 32px;
            margin: 0 auto 28px;
            display: block;
            object-fit: cover;
          }
          .hero h1 {
            font-size: 46px;
            line-height: 1.12;
            letter-spacing: -0.03em;
            margin: 0 0 14px;
            font-weight: 800;
          }
          .hero .byline {
            color: var(--muted);
            font-size: 15px;
            letter-spacing: 0.04em;
            margin: 0;
          }
          .about {
            max-width: 640px;
            margin: 0 auto;
            padding: 36px 0 4px;
            font-size: 17px;
            color: var(--muted);
          }

          /* Episodes */
          .intro { padding: 56px 0 8px; }
          .intro h2 {
            font-size: 36px;
            line-height: 1.15;
            letter-spacing: -0.03em;
            margin: 0;
            font-weight: 800;
          }
          .episodes { padding: 8px 0 24px; }
          .ep {
            padding: 32px 0;
            border-bottom: 1px solid var(--line);
          }
          .ep-meta {
            font-size: 13px;
            letter-spacing: 0.04em;
            color: var(--muted);
            margin-bottom: 8px;
          }
          .ep h3 {
            font-size: 23px;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin: 0 0 16px;
          }
          audio {
            width: 100%;
            display: block;
            margin: 0 0 20px;
          }

          /* 收听平台 — the same pill as index.html's .btn-ghost */
          .platforms {
            max-width: 640px;
            margin: 0 auto;
            padding: 20px 0 4px;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
          }
          .platform {
            display: inline-block;
            text-decoration: none;
            font-size: 15px;
            font-weight: 600;
            padding: 10px 20px;
            border-radius: 999px;
            border: 1px solid var(--line);
            color: var(--text);
            transition: background 0.15s ease;
          }
          .platform:hover { background: var(--line); }

          /* Show notes, collapsed until asked for */
          .notes summary {
            cursor: pointer;
            list-style: none;
            display: inline-block;
            color: var(--muted);
            font-size: 15px;
            font-weight: 500;
            transition: color 0.15s ease;
          }
          .notes summary::-webkit-details-marker { display: none; }
          .notes summary::after {
            content: "›";
            display: inline-block;
            margin-left: 6px;
            transition: transform 0.15s ease;
          }
          .notes[open] summary::after { transform: rotate(90deg); }
          .notes summary:hover { color: var(--text); }
          .notes .prose { padding-top: 16px; }

          /* Prose — the show description and the show notes */
          .prose p { margin: 0 0 20px; }
          .prose p:last-child { margin-bottom: 0; }
          .prose a {
            color: var(--text);
            text-decoration: underline;
            text-underline-offset: 2px;
          }
          .ep .prose { font-size: 17px; }

          footer {
            padding: 32px 0 56px;
            color: var(--muted);
            font-size: 14px;
          }
          footer a { color: var(--muted); text-decoration: none; }
          footer a:hover { color: var(--text); }

          @media (max-width: 600px) {
            .hero { padding: 48px 0 40px; }
            .hero h1 { font-size: 34px; }
            .cover { width: 220px; height: 220px; border-radius: 24px; }
            .intro h2 { font-size: 28px; }
            .ep h3 { font-size: 21px; }
          }
        </style>
      </head>
      <body>
        <header>
          <div class="wrap header-inner">
            <a class="brand" href="/#/">大木</a>
            <nav>
              <a href="/#/">首页</a>
              <a href="/#/posts">笔记</a>
              <a class="active" href="/czzy/feed.xml">播客</a>
            </nav>
          </div>
        </header>
        <xsl:apply-templates select="rss/channel"/>
        <!-- The show notes are HTML inside CDATA, i.e. plain text to XSLT.
             disable-output-escaping renders it as markup in Chrome/Safari; Firefox
             ignores the attribute, so unescape those blocks here instead. -->
        <script>
          (function () {
            var blocks = document.querySelectorAll('.prose');
            for (var i = 0; i &lt; blocks.length; i++) {
              var el = blocks[i];
              if (el.children.length) continue;  // markup arrived as markup
              if (/&lt;[a-z][^&lt;&gt;]*&gt;/i.test(el.textContent)) el.innerHTML = el.textContent;
            }
          })();
        </script>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="channel">
    <div class="wrap">
      <div class="hero">
        <xsl:if test="itunes:image/@href">
          <img class="cover" src="{itunes:image/@href}" alt="{title}"/>
        </xsl:if>
        <h1><xsl:value-of select="title"/></h1>
        <!-- The itunes:category values are Apple's English taxonomy — metadata for the
             directories, not something to show a reader. -->
        <p class="byline">主播：<xsl:value-of select="itunes:author"/></p>
      </div>

      <div class="about prose">
        <xsl:call-template name="notes"/>
      </div>

      <div class="platforms">
        <xsl:call-template name="platform">
          <xsl:with-param name="url" select="$apple"/>
          <xsl:with-param name="label" select="'苹果播客'"/>
        </xsl:call-template>
        <xsl:call-template name="platform">
          <xsl:with-param name="url" select="$xiaoyuzhou"/>
          <xsl:with-param name="label" select="'小宇宙'"/>
        </xsl:call-template>
        <xsl:call-template name="platform">
          <xsl:with-param name="url" select="$netease"/>
          <xsl:with-param name="label" select="'网易云音乐'"/>
        </xsl:call-template>
        <xsl:call-template name="platform">
          <xsl:with-param name="url" select="$ximalaya"/>
          <xsl:with-param name="label" select="'喜马拉雅'"/>
        </xsl:call-template>
        <xsl:call-template name="platform">
          <xsl:with-param name="url" select="$spotify"/>
          <xsl:with-param name="label" select="'Spotify'"/>
        </xsl:call-template>
      </div>

      <div class="intro">
        <h2>全部单集</h2>
      </div>

      <div class="episodes">
        <xsl:apply-templates select="item"/>
      </div>

      <footer>
        <span><xsl:value-of select="copyright"/></span>
        <xsl:text> · </xsl:text>
        <a href="{link}"><xsl:value-of select="substring-after(link, '//')"/></a>
      </footer>
    </div>
  </xsl:template>

  <xsl:template match="item">
    <div class="ep">
      <div class="ep-meta">
        <xsl:call-template name="date">
          <xsl:with-param name="rfc" select="pubDate"/>
        </xsl:call-template>
        <xsl:if test="itunes:duration">
          <xsl:text> · </xsl:text>
          <!-- hh:mm:ss, but drop a zero hour — nobody writes 00:05:25. -->
          <xsl:choose>
            <xsl:when test="starts-with(itunes:duration, '00:')">
              <xsl:value-of select="substring(itunes:duration, 4)"/>
            </xsl:when>
            <xsl:otherwise><xsl:value-of select="itunes:duration"/></xsl:otherwise>
          </xsl:choose>
        </xsl:if>
      </div>
      <h3><xsl:value-of select="title"/></h3>

      <xsl:if test="enclosure/@url">
        <audio controls="controls" preload="none" src="{enclosure/@url}"/>
      </xsl:if>

      <details class="notes">
        <summary>本期内容</summary>
        <div class="prose">
          <xsl:call-template name="notes"/>
        </div>
      </details>
    </div>
  </xsl:template>

  <!-- One 收听平台 button, or nothing at all when that platform has no URL yet. -->
  <xsl:template name="platform">
    <xsl:param name="url"/>
    <xsl:param name="label"/>
    <xsl:if test="$url != ''">
      <a class="platform" href="{$url}" target="_blank" rel="noopener">
        <xsl:value-of select="$label"/>
      </a>
    </xsl:if>
  </xsl:template>

  <!-- Rich text (show description / show notes): HTML inside CDATA, so it is plain text
       to XSLT. See the script at the end of <body> for the Firefox path. -->
  <xsl:template name="notes">
    <xsl:value-of select="description" disable-output-escaping="yes"/>
  </xsl:template>

  <!-- "Thu, 23 Jul 2026 16:52:59 -0700" → "2026年7月23日", the site's date format. -->
  <xsl:template name="date">
    <xsl:param name="rfc"/>
    <xsl:variable name="day" select="substring($rfc, 6, 2)"/>
    <xsl:variable name="mon" select="substring($rfc, 9, 3)"/>
    <xsl:value-of select="substring($rfc, 13, 4)"/>
    <xsl:text>年</xsl:text>
    <xsl:choose>
      <xsl:when test="$mon = 'Jan'">1</xsl:when>
      <xsl:when test="$mon = 'Feb'">2</xsl:when>
      <xsl:when test="$mon = 'Mar'">3</xsl:when>
      <xsl:when test="$mon = 'Apr'">4</xsl:when>
      <xsl:when test="$mon = 'May'">5</xsl:when>
      <xsl:when test="$mon = 'Jun'">6</xsl:when>
      <xsl:when test="$mon = 'Jul'">7</xsl:when>
      <xsl:when test="$mon = 'Aug'">8</xsl:when>
      <xsl:when test="$mon = 'Sep'">9</xsl:when>
      <xsl:when test="$mon = 'Oct'">10</xsl:when>
      <xsl:when test="$mon = 'Nov'">11</xsl:when>
      <xsl:when test="$mon = 'Dec'">12</xsl:when>
    </xsl:choose>
    <xsl:text>月</xsl:text>
    <xsl:value-of select="number($day)"/>
    <xsl:text>日</xsl:text>
  </xsl:template>

</xsl:stylesheet>
