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

const Preloader = ({ onComplete, customMessage }) => {
  const [show, setShow] = useState(true);
  const containerRef = useRef(null);
  const textRef1 = useRef(null);
  const innerTextRef1 = useRef(null);
  const textRef2 = useRef(null);
  const innerTextRef2 = useRef(null);
  const textLoopRef = useRef(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // If a custom message is provided, use RoleTransition-style animation
    if (customMessage) {
      let ctx = gsap.context(() => {
        const tl = gsap.timeline({
          onComplete: () => {
            setShow(false);
            document.body.style.overflow = originalOverflow;
            if (onComplete) onComplete();
          }
        });

        // Initial states - mimic RoleTransition exactly
        gsap.set(innerTextRef1.current, { y: '100%' });
        gsap.set(innerTextRef2.current, { y: '100%' });
        gsap.set(containerRef.current, { y: '0%' });

        // Extract customer name from customMessage (e.g., "Welcome Rajesh" -> "Rajesh")
        const customerName = customMessage.replace('Welcome ', '');

        // Set the text content
        if (innerTextRef1.current) {
          innerTextRef1.current.innerHTML = `<div style="display:flex;align-items:center;gap:16px;"><div style="width:10px;height:10px;border-radius:50%;background-color:#fff;opacity:0.6;margin-top:4px;"></div>Welcome</div>`;
        }
        if (innerTextRef2.current) {
          innerTextRef2.current.innerHTML = customerName;
        }

        // 1. Sweep up "Welcome" text smoothly
        tl.to(innerTextRef1.current, {
          y: '0%',
          duration: 0.5,
          ease: 'expo.out',
          delay: 0.05
        })
        .to(innerTextRef1.current, {
          y: '-100%',
          duration: 0.4,
          ease: 'expo.in',
          delay: 0.15
        })
        .set(textRef1.current, { display: 'none' })
        .to(innerTextRef2.current, {
          y: '0%',
          duration: 0.5,
          ease: 'expo.out'
        }, "-=0.1")
        .to(innerTextRef2.current, {
          y: '-100%',
          duration: 0.4,
          ease: 'expo.in',
          delay: 0.2
        });

        // Cinematic heavy lift removal
        tl.to(containerRef.current, {
          y: '-100vh',
          borderBottomLeftRadius: '50% 20vh',
          borderBottomRightRadius: '50% 20vh',
          duration: 1.1,
          ease: 'power4.inOut',
        }, "-=0.1");
      });

      return () => {
        document.body.style.overflow = originalOverflow;
        ctx.revert();
      };
    }

    // Using a pure GSAP timeline for the text loop.
    // This avoids React state re-renders and guarantees 60fps buttery smoothness.
    const tl = gsap.timeline({
      onComplete: () => {
        setShow(false);
        document.body.style.overflow = originalOverflow;
        if (onComplete) onComplete();
      }
    });

    // Initial state
    gsap.set(textLoopRef.current, { opacity: 0 });

    // Loop through the words
    words.forEach((word, i) => {
      const isFirst = i === 0;
      const isLast = i === words.length - 1;

      tl.to(textLoopRef.current, {
        opacity: 1,
        duration: isFirst ? 0.15 : 0.03,
        ease: 'power1.out',
        onStart: () => {
          if (textLoopRef.current) {
            textLoopRef.current.innerHTML = `<span style="color:rgba(255,255,255,0.4);font-size:1.8rem;margin-top:4px;display:inline-block;">&bullet;</span> ${word}`;
          }
        }
      })
      .to({}, { duration: isFirst ? 0.4 : (isLast ? 0.6 : 0.08) });

      if (!isLast) {
        tl.to(textLoopRef.current, { opacity: 0, duration: 0.03 });
      }
    });

    // Cinematic Outro
    tl.to(textLoopRef.current, {
      opacity: 0,
      y: -40,
      duration: 0.8,
      ease: 'power3.inOut'
    })
    .to(containerRef.current, {
      y: '-100vh',
      borderBottomLeftRadius: '50% 20vh',
      borderBottomRightRadius: '50% 20vh',
      duration: 1.1,
      ease: 'power4.inOut'
    }, "-=0.5");

    return () => {
      document.body.style.overflow = originalOverflow;
      tl.kill();
    };
  }, [onComplete, customMessage]);

  if (!show) return null;

  return (
    <div
      ref={containerRef}
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
      {/* When customMessage is provided */}
      <div ref={textRef1} style={{ overflow: 'hidden', position: 'absolute' }}>
        <div
          ref={innerTextRef1}
          style={{
            fontFamily: '"Helvetica Neue", "Neue Montreal", Helvetica, Arial, sans-serif',
            fontSize: '3rem',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            display: 'flex',
            alignItems: 'center',
            color: '#ffffff'
          }}
        >
        </div>
      </div>

      <div ref={textRef2} style={{ overflow: 'hidden', position: 'absolute' }}>
        <div
          ref={innerTextRef2}
          style={{
            fontFamily: '"Helvetica Neue", "Neue Montreal", Helvetica, Arial, sans-serif',
            fontSize: '4rem',
            fontWeight: 500,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            background: 'linear-gradient(45deg, #ffffff, #999999)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
          }}
        >
        </div>
      </div>

      {/* When no customMessage (default word loop) */}
      <div 
        ref={textLoopRef} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          fontSize: 'clamp(2rem, 5vw, 3rem)', 
          willChange: 'transform, opacity',
          fontWeight: 400, 
          fontFamily: '"Helvetica Neue", "Neue Montreal", Helvetica, Arial, sans-serif', 
          letterSpacing: '-0.02em',
          position: customMessage ? 'absolute' : 'relative',
          opacity: customMessage ? 0 : 1
        }}
      >
        {/* Managed by GSAP */}
      </div>
    </div>
  );
};

export default Preloader;
