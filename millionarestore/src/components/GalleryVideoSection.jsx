import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Film } from 'lucide-react';
import './GalleryVideoSection.css';

export default function GalleryVideoSection() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // Lazy render & viewport playback lifecycle
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // Play automatically when entering viewport
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch(() => {
              // Browser autoplay policy fallback
              setIsPlaying(false);
            });
          }
        } else {
          // Pause when leaving viewport to save resources
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      },
      {
        threshold: 0.25, // Trigger when 25% of the section is visible
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if (videoRef.current.webkitEnterFullscreen) {
      videoRef.current.webkitEnterFullscreen();
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !videoRef.current.duration) return;
    const current = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(current);
  };

  const handleSeek = (e) => {
    if (!videoRef.current || !videoRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = clickPos * videoRef.current.duration;
  };

  return (
    <section className="gallery-video-section" id="cellar-film" ref={sectionRef}>
      <div className="shell video-section-header" data-reveal>
        <p className="eyebrow">
          <Film size={16} /> Exclusive Visuals
        </p>
        <h2 className="section-title">
          The Living <em>Collection.</em>
        </h2>
        <p className="section-subtitle">
          Immerse yourself in the craft, heritage, and celebratory moments of the Millionaires Collection.
        </p>
      </div>

      <div className="shell video-showcase-wrapper" data-reveal>
        <div 
          className="video-player-container"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {isInView ? (
            <video
              ref={videoRef}
              src="/assets/gallery-experience.mp4"
              className="showcase-video"
              loop
              muted={isMuted}
              playsInline
              preload="metadata"
              onTimeUpdate={handleTimeUpdate}
              onClick={togglePlay}
            />
          ) : (
            <div className="video-lazy-placeholder">
              <div className="lazy-shimmer" />
              <span className="lazy-label">Scroll to experience the cellar film</span>
            </div>
          )}

          {/* Luxury Overlay Badge */}
          <div className="video-badge-pill">
            <span className="live-dot" />
            <span>Cellar & Pour Showcase</span>
          </div>

          {/* Top Right Controls: Mute & Fullscreen */}
          <div className={`video-floating-actions ${showControls ? 'visible' : ''}`}>
            <button 
              type="button" 
              onClick={toggleMute} 
              className="video-action-btn"
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
              title={isMuted ? "Unmute audio" : "Mute audio"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              <span className="btn-hint">{isMuted ? "Sound Off" : "Sound On"}</span>
            </button>
            <button 
              type="button" 
              onClick={toggleFullscreen} 
              className="video-action-btn"
              aria-label="Toggle Fullscreen"
              title="Fullscreen"
            >
              <Maximize size={18} />
            </button>
          </div>

          {/* Center Play/Pause Trigger if Paused */}
          {!isPlaying && isInView && (
            <button 
              type="button" 
              onClick={togglePlay} 
              className="video-center-play"
              aria-label="Play video"
            >
              <Play size={32} fill="currentColor" />
            </button>
          )}

          {/* Bottom Bar: Progress & Play Button */}
          <div className={`video-controls-bottom ${showControls ? 'visible' : ''}`}>
            <button 
              type="button" 
              onClick={togglePlay} 
              className="video-control-play-btn"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
            </button>

            <div 
              className="video-timeline-bar" 
              onClick={handleSeek}
              role="slider"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={Math.round(progress)}
              tabIndex={0}
            >
              <div className="video-timeline-track">
                <div 
                  className="video-timeline-fill" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
