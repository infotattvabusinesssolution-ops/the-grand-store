import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { Link } from 'react-router-dom';
import './VendorSplitSection.css';

function VendorSplitSection({ 
  title, 
  subtitle, 
  paragraphs, 
  buttonText, 
  buttonLink, 
  imageAlign = 'left',
  backgroundUrl,
  imageAlt = '',
  sectionId
}) {
  const [contentRef, contentVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [imageRef, imageVisible] = useIntersectionObserver({ threshold: 0.1 });

  const isLeft = imageAlign === 'left';
  
  const contentSide = (
    <div 
      ref={contentRef} 
      className={`vendor-split__content ${contentVisible ? (isLeft ? 'reveal-right' : 'reveal-left') : (isLeft ? 'hidden-right' : 'hidden-left')}`}
    >
      <div className="vendor-split__content-inner">
        {title && <h3 className="vendor-split__title text-gold">{title}</h3>}
        {subtitle && <h4 className="vendor-split__subtitle">{subtitle}</h4>}
        
        <div className="vendor-split__text">
          {paragraphs.map((p, index) => (
            <p key={index}>{p}</p>
          ))}
        </div>
        
        {buttonText && buttonLink && (
          <Link to={buttonLink} className="vendor-split__btn">
            {buttonText}
          </Link>
        )}
      </div>
    </div>
  );

  const imageSide = (
    <div 
      ref={imageRef}
      className={`vendor-split__image-side ${imageVisible ? (isLeft ? 'reveal-left' : 'reveal-right') : (isLeft ? 'hidden-left' : 'hidden-right')}`}
    >
      <img src={backgroundUrl} alt={imageAlt} loading="lazy" />
      <div className="vendor-split__image-shade" aria-hidden="true" />
    </div>
  );

  return (
    <section id={sectionId} className={`vendor-split ${isLeft ? 'vendor-split--img-left' : 'vendor-split--img-right'}`}>
      {isLeft ? (
        <>
          {imageSide}
          {contentSide}
        </>
      ) : (
        <>
          {contentSide}
          {imageSide}
        </>
      )}
    </section>
  );
}

export default VendorSplitSection;
