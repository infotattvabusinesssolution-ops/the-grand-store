import { ExternalLink, Play } from 'lucide-react'
import FooterPageShell from './FooterPageShell'

const videos = [
  { id: 'HAxtwHRYFjk', title: "3 best gins you must try | World's Best Gin | Cocktails | Royal Flush Gin" },
  { id: 'moXWdODQdQI', title: 'Top 5 Whisky | 5 Whiskeys You Need to Try | Monkey Shoulder Scotch Whisky' },
  { id: 'zZIzF-07_kY', title: 'Top 5 Rum Reconsideration by Expert | Best Rum Ever | Bumbu XO Rum' },
]

export default function CocktailsPage() {
  return (
    <FooterPageShell
      eyebrow="Cocktail"
      title="Cocktails & tasting guides"
      intro="Watch The Grand Store’s original guides to standout gin, whisky and rum."
      wide
    >
      <div className="grid gap-8 lg:grid-cols-3">
        {videos.map((video) => (
          <article className="overflow-hidden border border-white/10 bg-[#10100e]" key={video.id}>
            <div className="relative aspect-video bg-black">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${video.id}`}
                title={video.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="p-6">
              <Play className="mb-4 text-[#d99d39]" size={23} strokeWidth={1.5} />
              <h2 className="font-serif text-xl leading-snug text-[#f2ede4]">{video.title}</h2>
              <a className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d99d39]" href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer">Watch on YouTube <ExternalLink size={14} /></a>
            </div>
          </article>
        ))}
      </div>
    </FooterPageShell>
  )
}
