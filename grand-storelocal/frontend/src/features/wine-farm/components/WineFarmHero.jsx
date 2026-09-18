import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    image: '/assets/images/carousel-1.jpg',
    subHeading: 'THE GRAND STORE',
    heading: 'Transform your passion into profit',
    text: 'Tailor-made wine experiences for unforgettable memories.',
    link: '/about'
  },
  {
    id: 2,
    image: '/assets/images/carousel-2.png',
    subHeading: 'THE GRAND STORE',
    heading: 'Create a brand as unique as your taste',
    text: 'Customized wine experiences that leave a lasting impression',
    link: '/about'
  }
];

export default function WineFarmHero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <section className="relative h-screen min-h-[700px] w-full overflow-hidden bg-ink">
      {slides.map((slide, index) => (
        <div 
          key={slide.id}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1500 ease-[cubic-bezier(0.4,0,0.2,1)] ${index === currentSlide ? 'opacity-100 z-20' : 'opacity-0 z-10'}`}
        >
          {/* Background Image */}
          <div 
            className={`absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-[6000ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${index === currentSlide ? 'scale-100' : 'scale-110'}`} 
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          
          {/* Overlay */}
          <div className="absolute top-0 left-0 w-full h-full z-30" style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(11, 10, 8, 0.4) 100%), linear-gradient(to right, rgba(11, 10, 8, 0.9) 0%, rgba(11, 10, 8, 0.2) 60%)' }} />
          
          <div className="relative h-full flex items-center z-40 max-w-7xl mx-auto px-4 w-full">
            <div className={`bg-white/5 backdrop-blur-md p-10 md:p-14 rounded-3xl border border-white/10 max-w-[650px] shadow-[0_30px_60px_rgba(0,0,0,0.3)] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] delay-300 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              
              <div className="overflow-hidden block">
                <span className={`flex items-center gap-4 text-gold-bright text-[13px] font-bold tracking-[0.2em] uppercase mb-6 block transform transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[600ms] ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                  <span className="inline-block w-10 h-[2px] bg-gold-bright" /> {slide.subHeading}
                </span>
              </div>
              
              <div className="overflow-hidden block">
                <h1 className={`font-serif text-[clamp(48px,5vw,64px)] leading-[1.1] font-normal text-white mb-6 block transform transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[800ms] ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                  {slide.heading}
                </h1>
              </div>
              
              <div className="overflow-hidden block">
                <p className={`text-lg leading-[1.6] text-white/80 mb-10 block transform transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[1000ms] ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                  {slide.text}
                </p>
              </div>
              
              <div className="overflow-hidden block">
                <div className={`block transform transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[1200ms] ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                  <a href={slide.link} className="inline-block px-8 py-4 bg-gold text-ink font-bold tracking-wider uppercase text-xs hover:bg-gold-bright transition-colors rounded-sm">Explore More</a>
                </div>
              </div>

            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <div className="absolute bottom-8 right-1/2 translate-x-1/2 md:translate-x-0 md:bottom-[60px] md:right-[60px] flex gap-4 z-50">
        <button className="bg-white/10 border border-white/20 text-white w-[60px] h-[60px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] backdrop-blur-sm hover:bg-white hover:text-ink hover:scale-110" onClick={prevSlide} aria-label="Previous Slide">
          <ArrowLeft size={24} strokeWidth={1.5} />
        </button>
        <button className="bg-white/10 border border-white/20 text-white w-[60px] h-[60px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] backdrop-blur-sm hover:bg-white hover:text-ink hover:scale-110" onClick={nextSlide} aria-label="Next Slide">
          <ArrowRight size={24} strokeWidth={1.5} />
        </button>
      </div>
    </section>
  );
}
