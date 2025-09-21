import { describe, it, expect } from 'vitest'
import { parseTxtToBook } from './parseTxt'

describe('parseTxtToBook', () => {
  it('detecta capítulos por cabeçalhos explícitos', () => {
    const txt = `CAPÍTULO 1\n\nEra uma vez...\n\nCAPÍTULO 2\n\nOutra história.`
    const book = parseTxtToBook(txt, { defaultTitle: 'Histórias' })
    expect(book.chapters.length).toBe(2)
    expect(book.chapters[0].title.toLowerCase()).toContain('capítulo 1')
  })
  it('usa chunking quando não há cabeçalho', () => {
    const txt = Array(5000).fill('lorem').join(' ')
    const book = parseTxtToBook(txt, { defaultTitle: 'Sem Cabeçalhos' })
    expect(book.chapters.length).toBeGreaterThan(1)
  })
})
