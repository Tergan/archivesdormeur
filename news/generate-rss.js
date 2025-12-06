import fs from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'
import matter from 'gray-matter'
import {marked} from 'marked'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const POSTS_DIR = path.join(__dirname, 'posts')
const OUTPUT_FILE = path.join(__dirname, 'news.xml')

// Change this to your public URL base (e.g. https://username.github.io/archivesdormeur/news)
const NEWS_SITE_URL = (process.env.NEWS_SITE_URL || 'https://example.com/news').replace(/\/$/, '')
const CHANNEL_TITLE = 'Archives du Dormeur - News'
const CHANNEL_DESCRIPTION = 'Actualités du launcher Archives du Dormeur'

function escapeXml(str = '') {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function stripHtml(html = '') {
    return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function buildItemXml(item) {
    const description = stripHtml(item.html)
    return `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <guid>${item.guid}</guid>
      <pubDate>${item.date.toUTCString()}</pubDate>
      <dc:creator>${escapeXml(item.author)}</dc:creator>
      <comments>${item.commentsLink}</comments>
      <slash:comments>${item.commentCount}</slash:comments>
      <description><![CDATA[${description}]]></description>
      <content:encoded><![CDATA[${item.html}]]></content:encoded>
    </item>`
}

function validatePostData(data, file) {
    const required = ['title', 'date']
    for (const key of required) {
        if (!data[key]) {
            throw new Error(`Post ${path.basename(file)} is missing required field "${key}".`)
        }
    }
}

function loadPosts() {
    if (!fs.existsSync(POSTS_DIR)) {
        throw new Error(`Posts directory not found: ${POSTS_DIR}`)
    }
    const files = fs.readdirSync(POSTS_DIR).filter(f => f.toLowerCase().endsWith('.md'))
    const posts = []

    for (const file of files) {
        const fullPath = path.join(POSTS_DIR, file)
        const raw = fs.readFileSync(fullPath, 'utf8')
        const {data, content} = matter(raw)

        validatePostData(data, file)

        const slug = data.slug || path.basename(file, path.extname(file))
        const linkBase = data.link || `${NEWS_SITE_URL}/${slug}`
        const date = new Date(data.date)
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date in ${file}: ${data.date}`)
        }

        const html = marked.parse(content)
        posts.push({
            title: data.title,
            author: data.author || 'Archives du Dormeur',
            date,
            link: linkBase,
            guid: data.guid || linkBase,
            commentsLink: data.commentsLink || `${linkBase}#comments`,
            commentCount: Number.isFinite(data.comments) ? data.comments : 0,
            html
        })
    }

    // Sort newest first.
    return posts.sort((a, b) => b.date - a.date)
}

function buildFeed(items) {
    const channelLink = NEWS_SITE_URL || 'https://example.com/news'
    const now = new Date().toUTCString()
    const itemXml = items.map(buildItemXml).join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:slash="http://purl.org/rss/1.0/modules/slash/">
  <channel>
    <title>${escapeXml(CHANNEL_TITLE)}</title>
    <link>${channelLink}</link>
    <description>${escapeXml(CHANNEL_DESCRIPTION)}</description>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>news/generate-rss.js</generator>
${itemXml}
  </channel>
</rss>
`
}

function writeFeed(xml) {
    fs.writeFileSync(OUTPUT_FILE, xml, 'utf8')
    console.log(`Generated ${OUTPUT_FILE}`)
}

try {
    const items = loadPosts()
    if (items.length === 0) {
        console.warn('No posts found. Feed will be empty.')
    }
    const feed = buildFeed(items)
    writeFeed(feed)
} catch (err) {
    console.error(err.message)
    process.exit(1)
}
