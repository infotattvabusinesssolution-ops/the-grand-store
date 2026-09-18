import { useEffect, useState, useRef } from 'react';

export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Once the element intersects, we keep it true to let the animation play once.
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          // Optional: disconnect observer after first reveal
          if (targetRef.current) observer.unobserve(targetRef.current);
        }
      },
      {
        threshold: 0.1, // Trigger when 10% visible
        rootMargin: '0px 0px -50px 0px', // Trigger slightly before it comes fully into view
        ...options,
      }
    );

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => {
      if (targetRef.current) observer.unobserve(targetRef.current);
    };
  }, [options.threshold, options.rootMargin]);

  return [targetRef, isIntersecting];
}
