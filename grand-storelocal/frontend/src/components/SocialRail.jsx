export default function SocialRail() {
  const socialLinks = [
    { label: 'Facebook', mark: 'f', href: 'https://www.facebook.com/thegrandstoreofficial' },
    { label: 'X', mark: '𝕏', href: 'https://x.com/Thegrandstore1' },
    { label: 'Instagram', mark: '◎', href: 'https://www.instagram.com/thegrandstoreofficial/' },
    { label: 'Pinterest', mark: 'p', href: 'https://www.pinterest.com/thegrandstore1/' },
    { label: 'YouTube', mark: '▶', href: 'https://www.youtube.com/@thegrandstoreofficial' },
    { label: 'TikTok', mark: '♪', href: 'https://www.tiktok.com/@thegrandstoreofficial' },
  ]

  return (
    <nav 
      className="hidden md:grid fixed top-1/2 right-0 z-[88] w-[44px] overflow-visible border border-[#e1bd70]/15 border-r-0 transform -translate-y-1/2 shadow-[-8px_12px_28px_rgba(0,0,0,0.3)]" 
      aria-label="The Grand Store social media"
    >
      {socialLinks.map((social) => (
        <a 
          className="group relative grid w-[43px] h-[45px] max-[560px]:h-[38px] place-items-center border-b border-black/70 text-[#e1bd70] bg-[#1c1d1d] no-underline transition-all duration-[180ms] ease last:border-b-0 hover:bg-[#e1bd70] hover:text-[#11100d] focus-visible:bg-[#e1bd70] focus-visible:text-[#11100d] focus-visible:outline-none" 
          href={social.href} 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label={`Visit The Grand Store on ${social.label}`} 
          data-label={social.label} 
          key={social.label}
        >
          <span className="absolute top-1/2 right-[calc(100%+10px)] p-[7px_10px] border border-[#e1bd70]/20 text-[#ddd5c8] bg-[#141310] text-[10px] font-[650] tracking-[0.08em] opacity-0 pointer-events-none uppercase whitespace-nowrap transform translate-x-2 -translate-y-1/2 transition-all duration-[160ms] ease group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 before:content-[attr(data-label)]"></span>
          <span 
            className="grid w-[23px] h-[23px] place-items-center font-sans text-[16px] font-bold leading-none" 
            aria-hidden="true"
            style={{
              fontSize: social.label === 'Instagram' ? '22px' : social.label === 'YouTube' ? '13px' : '16px',
              fontWeight: social.label === 'Instagram' ? 400 : 700
            }}
          >
            {social.mark}
          </span>
        </a>
      ))}
    </nav>
  )
}
