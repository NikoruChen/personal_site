<?xml version="1.0" encoding="UTF-8"?>
<!--
  Referenced by the <?xml-stylesheet?> line at the top of feed.xml: browsers apply it,
  podcast apps ignore it and read the raw XML. Nothing here affects the feed's contents.

  The podcast's page for readers is /#/podcast, rendered by js/podcast.js from this same
  feed — that way it sits inside the site and shares its header, footer and styles. All
  this stylesheet does is send a browser there; keep it, or visitors to the feed URL land
  on raw XML.
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8"/>

  <xsl:template match="/">
    <html lang="zh-cn">
      <head>
        <meta charset="UTF-8"/>
        <meta http-equiv="refresh" content="0; url=/#/podcast"/>
        <title><xsl:value-of select="rss/channel/title"/></title>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"/>
        <link rel="stylesheet" href="/styles/base.css"/>
      </head>
      <body>
        <div class="wrap">
          <p style="padding: 80px 0; text-align: center;">
            <a href="/#/podcast">前往播客页面 →</a>
          </p>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
