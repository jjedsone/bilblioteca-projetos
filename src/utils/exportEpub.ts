import JSZip from 'jszip'
import type { Book } from '../types'

function x(t: string) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}
function chapterXhtml(title: string, paragraphs: string[]) {
  const body = paragraphs.map(p => `<p>${x(p)}</p>`).join('\n')
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="pt-br" lang="pt-br">
  <head><meta charset="utf-8"/><title>${x(title)}</title></head>
  <body><h1>${x(title)}</h1>${body}</body>
</html>`
}
function parseDataUrl(dataUrl: string): { mime: string; data: Uint8Array } {
  const m = dataUrl.match(/^data:(.*?);base64,(.+)$/)
  if (!m) throw new Error('dataURL inválido')
  const mime = m[1]
  const bin = atob(m[2])
  const arr = new Uint8Array(bin.length)
  for (let i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i)
  return { mime, data: arr }
}

export async function exportBookToEPUB(book: Book) {
  const zip = new JSZip()
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`)

  const manifestItems: string[] = []
  const spineItems: string[] = []

  zip.file('OEBPS/title.xhtml', `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="pt-br" lang="pt-br">
  <head><meta charset="utf-8"/><title>${x(book.title)}</title></head>
  <body><h1>${x(book.title)}</h1><p>${x(book.author ?? '')}</p><p>${x(book.subject ?? '')}</p></body>
</html>`)
  manifestItems.push(`<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>`)
  spineItems.push(`<itemref idref="title"/>`)

  let coverMeta = ''
  if (book.coverDataUrl) {
    try {
      const parsed = parseDataUrl(book.coverDataUrl)
      const ext = parsed.mime.includes('png') ? 'png' : parsed.mime.includes('webp') ? 'webp' : 'jpg'
      const fname = `images/cover.${ext}`
      zip.file(`OEBPS/${fname}`, parsed.data)
      manifestItems.unshift(`<item id="cover-image" href="${fname}" media-type="${parsed.mime}" properties="cover-image"/>`)
      coverMeta = `<meta name="cover" content="cover-image"/>`
    } catch {
      // Ignore invalid cover data URL
    }
  }

  book.chapters.forEach((ch, i) => {
    const fname = `ch${i+1}.xhtml`
    zip.file(`OEBPS/${fname}`, chapterXhtml(ch.title, ch.paragraphs))
    manifestItems.push(`<item id="ch${i+1}" href="${fname}" media-type="application/xhtml+xml"/>`)
    spineItems.push(`<itemref idref="ch${i+1}"/>`)
  })

  const keywords = (book.keywords ?? []).join(', ')
  const contentOpf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">urn:uuid:${cryptoRandom()}</dc:identifier>
    <dc:title>${x(book.title)}</dc:title>
    <dc:language>pt-BR</dc:language>
    <dc:creator>${x(book.author ?? '')}</dc:creator>
    <dc:subject>${x(book.subject ?? '')}</dc:subject>
    <meta property="keywords">${x(keywords)}</meta>
    ${coverMeta}
  </metadata>
  <manifest>${manifestItems.join('\n    ')}</manifest>
  <spine>${spineItems.join('\n    ')}</spine>
</package>`
  zip.file('OEBPS/content.opf', contentOpf)

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${book.title.replace(/[^\w\d-_]+/g, '_')}.epub`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
function cryptoRandom() {
  const arr = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(arr)
  else for (let i=0;i<16;i++) arr[i] = Math.floor(Math.random()*256)
  return Array.from(arr).map(b => ('0' + b.toString(16)).slice(-2)).join('')
}
