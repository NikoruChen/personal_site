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

  <xsl:template match="/">
    <html lang="zh-cn">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title><xsl:value-of select="rss/channel/title"/></title>
        <meta name="description" content="{normalize-space(rss/channel/description)}"/>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"/>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
        <!-- The chrome, type scale and buttons shared with the rest of the site;
             then the parts only this page has. -->
        <link rel="stylesheet" href="/styles/base.css"/>
        <link rel="stylesheet" href="/czzy/feed.css"/>
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
      <div class="meta">
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
      <a class="btn btn-ghost" href="{$url}" target="_blank" rel="noopener">
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
