"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";

export default function Story({ reduceMotion }) {
  const ref = useRef(null);
  useEffect(() => {
    let disposed = false;
    let context;
    if (reduceMotion) return;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        context = gsap.context(() => {
          gsap.fromTo(
            ".story-photo img",
            { scale: 1.16, yPercent: -7 },
            {
              scale: 1,
              yPercent: 7,
              ease: "none",
              scrollTrigger: {
                trigger: ref.current,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            }
          );
          gsap.fromTo(
            ".story-word",
            { opacity: 0.65 },
            {
              opacity: 1,
              stagger: 0.12,
              ease: "none",
              scrollTrigger: {
                trigger: ".story-copy",
                start: "top 85%",
                end: "center 55%",
                scrub: 1,
              },
            }
          );
        }, ref);
      }
    );
    return () => {
      disposed = true;
      context?.revert();
    };
  }, [reduceMotion]);
  const words = "South African soul. A world of possibility.".split(" ");
  return (
    <section
      className="story section-space"
      id="our-story"
      ref={ref}
      aria-labelledby="story-heading"
    >
      <div className="container story-layout">
        <div className="story-photo">
          <img
            src="/assets/cape-wineland.webp"
            srcSet="/assets/cape-wineland-sm.webp 1000w, /assets/cape-wineland.webp 1600w"
            sizes="(max-width: 767px) 100vw, 50vw"
            alt="An artistic view of Cape Winelands vineyards and mountains in the afternoon sun"
            loading="lazy"
            width="1600"
            height="900"
          />
        </div>
        <div className="story-copy">
          <span className="eyebrow">The story behind the store</span>
          <h2 id="story-heading">
            {words.map((word, index) => (
              <span className="story-word" key={index}>
                {word}{" "}
              </span>
            ))}
          </h2>
          <p>
            We believe good taste has no borders. But it always has a story.
          </p>
          <p>
            The Grand Store brings passionate South African makers and
            celebrated global houses together. A place to find a new favourite,
            build your collection, and share something extraordinary.
          </p>
          <a className="text-link" href="https://grandstoreglobal.com/about">
            About us <ArrowUpRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
