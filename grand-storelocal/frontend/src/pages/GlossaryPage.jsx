import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import FooterPageShell from './FooterPageShell'
import glossaryEntries from './glossaryData'

export default function GlossaryPage() {
  const [query, setQuery] = useState('')
  const [letter, setLetter] = useState('All')
  const letters = useMemo(() => [...new Set(glossaryEntries.map(({ term }) => term[0].toUpperCase()))].sort(), [])
  const visibleEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return glossaryEntries.filter(({ term, definition }) => {
      const matchesLetter = letter === 'All' || term.toUpperCase().startsWith(letter)
      const matchesQuery = !normalizedQuery || `${term} ${definition}`.toLowerCase().includes(normalizedQuery)
      return matchesLetter && matchesQuery
    })
  }, [letter, query])

  return (
    <FooterPageShell eyebrow="Wines & Spirits" title="Glossary" intro="Search The Grand Store’s complete reference of wine and spirits terms." wide>
      <div className="sticky top-24 z-10 mb-9 border border-[#d99d39]/25 bg-[#0d0d0b]/95 p-4 shadow-2xl backdrop-blur sm:p-5">
        <label className="relative block">
          <span className="sr-only">Search glossary</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#d99d39]" size={19} />
          <input className="h-14 w-full border border-white/15 bg-[#090907] pl-12 pr-12 text-[#f2ede4] outline-none placeholder:text-[#70695f] focus:border-[#d99d39]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a term or definition" />
          {query && <button className="absolute right-4 top-1/2 -translate-y-1/2 text-[#91897e] hover:text-white" type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={18} /></button>}
        </label>
        <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Filter glossary by letter">
          {['All', ...letters].map((item) => <button className={`min-w-9 border px-2 py-1.5 text-xs transition ${letter === item ? 'border-[#d99d39] bg-[#d99d39] text-[#17120a]' : 'border-white/10 text-[#b0a79b] hover:border-[#d99d39]/60 hover:text-[#d99d39]'}`} type="button" key={item} onClick={() => setLetter(item)}>{item}</button>)}
        </div>
      </div>

      <p className="mb-5 text-xs uppercase tracking-[0.18em] text-[#8f877c]">{visibleEntries.length} {visibleEntries.length === 1 ? 'term' : 'terms'}</p>
      {visibleEntries.length ? (
        <dl className="grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-2">
          {visibleEntries.map(({ term, definition }) => (
            <div className="bg-[#0f0f0d] p-6 sm:p-7" key={term}>
              <dt className="font-serif text-xl text-[#d99d39]">{term}</dt>
              <dd className="mt-3 text-sm leading-7 text-[#b6ada1]">{definition}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="border border-white/10 bg-[#0f0f0d] p-12 text-center"><h2 className="font-serif text-2xl text-[#f2ede4]">No matching terms</h2><p className="mt-3 text-[#9b9388]">Try a different search or choose “All”.</p></div>
      )}
    </FooterPageShell>
  )
}
