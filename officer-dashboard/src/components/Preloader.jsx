import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

const words = [
  'Hello',
  'नमस्ते',
  'કેમ છો',
  'नमस्कार',
  'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
  'নমস্কার',
  'ओळख',
  'Welcome',
];

const Preloader = ({ onComplete }) => {
  const [show, setShow] = useState(true);
  const preloaderRef = useRef();
  const textRef = useRef();

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Using a pure GSAP timeline for the text loop.
    // This avoids React state re-renders and guarantees 60fps buttery smoothness.
    const tl = gsap.timeline({
      onComplete: () => {
        setShow(false);
        document.body.style.overflow = originalOverflow;
        if (onComplete) onComplete();
      }
    });

    // Initial state - removed 'y' translation to stop the jumping effect
    gsap.set(textRef.current, { opacity: 0 });

    // Loop through the words
    words.forEach((word, i) => {
      const isFirst = i === 0;
      const isLast = i === words.length - 1;

      tl.to(textRef.current, {
        opacity: 1,
        duration: isFirst ? 0.15 : 0.03, // Faster fade
        ease: 'power1.out',
        onStart: () => {
          if (textRef.current) {
            textRef.current.innerHTML = `<span style="color:rgba(255,255,255,0.4);font-size:1.8rem;margin-top:4px;display:inline-block;">&bull;</span> ${word}`;
          }
        }
      })
      // Hold the text on screen (shorter duration for faster transitions)
      .to({}, { duration: isFirst ? 0.4 : (isLast ? 0.6 : 0.08) });

      // Fade out if not the last word
      if (!isLast) {
        tl.to(textRef.current, { opacity: 0, duration: 0.03 });
      }
    });

    // Cinematic Outro
    tl.to(textRef.current, {
      opacity: 0,
      y: -40,
      duration: 0.8,
      ease: 'power3.inOut'
    })
    .to(preloaderRef.current, {
      y: '-100vh',
      duration: 0.8, // Super smooth, heavy lift
      ease: 'power4.inOut',
      roundProps: 'y'
    }, "-=0.5");

    return () => {
      document.body.style.overflow = originalOverflow;
      tl.kill();
    };
  }, [onComplete]);

  if (!show) return null;

  return (
    <div
      ref={preloaderRef}
      style={{
        position: 'fixed',
        zIndex: 9999,
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#111111', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        willChange: 'transform',
      }}
    >
      <div 
        ref={textRef} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          fontSize: 'clamp(2rem, 5vw, 3rem)', 
          willChange: 'transform, opacity',
          fontWeight: 400, 
          fontFamily: "'Inter', sans-serif", 
          letterSpacing: '-0.02em'
        }}
      >
        {/* Managed by GSAP */}
      </div>
    </div>
  );
};

export default Preloader;
