import { useState } from "react";
import {
  WhatsappLogo,
  InstagramLogo,
  FacebookLogo,
  XLogo,
  YoutubeLogo,
  TiktokLogo,
  PinterestLogo,
} from "@phosphor-icons/react";

const SOCIAL_ITEMS = [
  {
    id: "wa",
    label: "WhatsApp Concierge",
    sub: "+27 82 496 7256",
    href: "https://wa.me/27824967256",
    icon: WhatsappLogo,
    goldGlow: true,
  },
  {
    id: "ig",
    label: "Instagram",
    sub: "@thegrandstoreofficial",
    href: "https://www.instagram.com/thegrandstoreofficial/",
    icon: InstagramLogo,
  },
  {
    id: "fb",
    label: "Facebook",
    sub: "thegrandstoreofficial",
    href: "https://www.facebook.com/thegrandstoreofficial",
    icon: FacebookLogo,
  },
  {
    id: "x",
    label: "X (Twitter)",
    sub: "@Thegrandstore1",
    href: "https://x.com/Thegrandstore1",
    icon: XLogo,
  },
  {
    id: "yt",
    label: "YouTube",
    sub: "Official Cellar Channel",
    href: "https://www.youtube.com/@thegrandstoreofficial",
    icon: YoutubeLogo,
  },
  {
    id: "tt",
    label: "TikTok",
    sub: "@thegrandstoreofficial",
    href: "https://www.tiktok.com/@thegrandstoreofficial",
    icon: TiktokLogo,
  },
  {
    id: "pt",
    label: "Pinterest",
    sub: "@thegrandstore1",
    href: "https://www.pinterest.com/thegrandstore1/",
    icon: PinterestLogo,
  },
];

export default function StickySocialBar() {
  const [hovered, setHovered] = useState(null);

  return (
    <aside className="sticky-social-dock" aria-label="Official Grand Store Social Networks">
      <div className="dock-pill-track">
        <span className="dock-accent-pip top" aria-hidden="true" />

        {SOCIAL_ITEMS.map((item) => {
          const Icon = item.icon;
          const isHovered = hovered === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`dock-social-link ${item.goldGlow ? "highlight-wa" : ""}`}
              aria-label={`Visit The Grand Store on ${item.label}`}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(item.id)}
              onBlur={() => setHovered(null)}
            >
              <Icon size={18} weight="bold" />

              {/* Tooltip popping to the left */}
              {isHovered && (
                <div className="dock-tooltip" role="tooltip">
                  <span className="dock-tooltip-title">{item.label}</span>
                  <span className="dock-tooltip-sub">{item.sub}</span>
                  <span className="dock-tooltip-arrow" aria-hidden="true" />
                </div>
              )}
            </a>
          );
        })}

        <span className="dock-accent-pip bottom" aria-hidden="true" />
      </div>
    </aside>
  );
}
